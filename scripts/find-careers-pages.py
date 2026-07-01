#!/usr/bin/env python3
"""
find-careers-pages.py
=====================
Discovers careers page URLs for UK visa sponsors using Clearbit
to get the real company domain, then probing common careers paths.

Strategy per sponsor:
  1. Query Clearbit Autocomplete API → get real domain
  2. Probe /careers, /jobs, /vacancies, etc. on that domain
  3. Detect embedded ATS (Greenhouse / Lever / Workable) in HTML
  4. Save progress every 100 entries (resumable)

Output:
  scripts/careers-output.json   — { normalisedName: { type, url/token } }

Run:
  python3 scripts/find-careers-pages.py [--limit N] [--min-cos N] [--workers N]

Then merge into careers-data.ts:
  python3 scripts/merge-careers-output.py
"""

from __future__ import annotations
import asyncio
import aiohttp
import json
import re
import argparse
import time
from pathlib import Path
from typing import Optional

# ── Config ────────────────────────────────────────────────────────────────────

SPONSORS_FILE = Path(__file__).parent.parent / "prisma/data/sponsors-slim.json"
OUTPUT_FILE   = Path(__file__).parent / "careers-output.json"
PROGRESS_FILE = Path(__file__).parent / "careers-progress.json"

TIMEOUT_SEC     = 3
DEFAULT_WORKERS = 30
USER_AGENT      = "Mozilla/5.0 (compatible; SponsorAtlas/1.0)"

CLEARBIT_URL = "https://autocomplete.clearbit.com/v1/companies/suggest?query={query}"

CAREERS_PATHS = [
    "/careers",
    "/jobs",
    "/work-with-us",
    "/join-us",
    "/join-our-team",
    "/vacancies",
    "/recruitment",
    "/career",
    "/opportunities",
    "/about/careers",
    "/about/jobs",
    "/company/careers",
    "/en/careers",
    "/en-gb/careers",
    "/gb/careers",
    "/uk/careers",
]

STRIP_RE = re.compile(
    r"\b(ltd|llp|plc|limited|llc|inc|corp|corporation|group|holdings?|"
    r"uk services?|uk limited|uk ltd|technologies?|solutions?|services?|"
    r"systems?|international|global|worldwide|europe|uk|national association)\b\.?",
    re.IGNORECASE,
)

COMPANIES_HOUSE_URL = "https://api.company-information.service.gov.uk/search/companies?q={query}&items_per_page=1"

GREENHOUSE_RE = re.compile(r"boards\.greenhouse\.io/([a-zA-Z0-9_-]+)", re.IGNORECASE)
LEVER_RE      = re.compile(r"jobs\.lever\.co/([a-zA-Z0-9_-]+)", re.IGNORECASE)
WORKABLE_RE   = re.compile(r"apply\.workable\.com/([a-zA-Z0-9_-]+)", re.IGNORECASE)
NHS_RE        = re.compile(r"jobs\.nhs\.uk", re.IGNORECASE)

# ── Helpers ───────────────────────────────────────────────────────────────────

def normalise(name: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9 ]", "", name.upper())).strip()

def clean_name_for_search(name: str) -> str:
    cleaned = STRIP_RE.sub(" ", name)
    cleaned = re.sub(r"\([^)]*\)", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()

def detect_ats(html: str, url: str) -> Optional[dict]:
    if m := GREENHOUSE_RE.search(html):
        return {"type": "greenhouse", "token": m.group(1)}
    if m := LEVER_RE.search(html):
        return {"type": "lever", "token": m.group(1)}
    if m := WORKABLE_RE.search(html):
        return {"type": "workable", "token": m.group(1)}
    if NHS_RE.search(url):
        return {"type": "nhs", "url": url}
    return None

# ── Domain discovery: Clearbit → Companies House → slug guessing ──────────────

async def get_domain_from_clearbit(session: aiohttp.ClientSession, name: str) -> Optional[str]:
    query = clean_name_for_search(name)
    url = CLEARBIT_URL.format(query=query.replace(" ", "+"))
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as r:
            if r.status != 200:
                return None
            results = await r.json()
            if not results:
                return None
            query_lower = query.lower()
            for item in results[:3]:
                if item.get("name", "").lower() == query_lower:
                    return item.get("domain")
            return results[0].get("domain")
    except Exception:
        return None

async def get_domain_from_companies_house(session: aiohttp.ClientSession, name: str) -> Optional[str]:
    url = COMPANIES_HOUSE_URL.format(query=name.replace(" ", "+"))
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as r:
            if r.status != 200:
                return None
            data = await r.json()
            items = data.get("items", [])
            if not items:
                return None
            # Get the company number of the best match
            company_number = items[0].get("company_number")
            if not company_number:
                return None
            # Fetch company profile for website
            profile_url = f"https://api.company-information.service.gov.uk/company/{company_number}"
            async with session.get(profile_url, timeout=aiohttp.ClientTimeout(total=5)) as pr:
                if pr.status != 200:
                    return None
                profile = await pr.json()
                website = profile.get("links", {}).get("self") or profile.get("registered_office_address", {}).get("address_line_1")
                # Companies House rarely has website URLs — extract from accounts/contacts
                # Return None to fall through to slug guessing
                return None
    except Exception:
        return None

def slug_domain_candidates(name: str) -> list:
    """Generate domain guesses from company name."""
    cleaned = STRIP_RE.sub(" ", name)
    cleaned = re.sub(r"\([^)]*\)", "", cleaned)
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", cleaned).strip()
    slug = re.sub(r"\s+", "-", cleaned.lower()).strip("-")
    slug_no_hyphen = slug.replace("-", "")
    # Also try first word only for common patterns like "Acme Services" → acme.co.uk
    first_word = slug.split("-")[0] if "-" in slug else ""

    candidates = []
    for s in filter(None, [slug, slug_no_hyphen, first_word]):
        candidates += [
            f"www.{s}.co.uk",
            f"www.{s}.com",
            f"{s}.co.uk",
            f"{s}.com",
            f"www.{s}.org.uk",
            f"www.{s}.org",
        ]
    # Deduplicate while preserving order
    seen = set()
    return [c for c in candidates if not (c in seen or seen.add(c))]

# ── Careers URL probe ─────────────────────────────────────────────────────────

async def probe_careers(session: aiohttp.ClientSession, domain: str) -> Optional[dict]:
    # Accept bare domain with or without www
    domain = domain.rstrip("/")
    if domain.startswith("http"):
        bases = [domain]
    elif domain.startswith("www."):
        bases = [f"https://{domain}", f"http://{domain}"]
    else:
        bases = [f"https://www.{domain}", f"https://{domain}"]

    for path in CAREERS_PATHS:
        for base in bases:
            url = f"{base}{path}"
            try:
                async with session.get(
                    url,
                    allow_redirects=True,
                    timeout=aiohttp.ClientTimeout(total=TIMEOUT_SEC),
                ) as r:
                    if r.status not in (200,):
                        continue
                    final_url = str(r.url)
                    # Skip if redirected back to homepage
                    if path.strip("/") not in final_url and not any(
                        kw in final_url for kw in ("career", "job", "vacanc", "recruit", "work-with", "join")
                    ):
                        continue
                    try:
                        chunk = await asyncio.wait_for(r.content.read(32_000), timeout=4)
                        html = chunk.decode("utf-8", errors="ignore")
                    except Exception:
                        html = ""
                    ats = detect_ats(html, final_url)
                    if ats:
                        return ats
                    return {"type": "url", "url": final_url}
            except Exception:
                continue
    return None

# ── Per-sponsor orchestration ─────────────────────────────────────────────────

async def find_careers_for_sponsor(
    session: aiohttp.ClientSession, sponsor: dict
) -> Optional[dict]:
    name = sponsor["organisationName"]

    # NHS trusts → NHS Jobs directly
    if re.search(r"nhs|foundation trust|health.*trust|trust.*nhs", name, re.IGNORECASE):
        safe = name.replace(" ", "+")
        return {
            "type": "nhs",
            "url": f"https://www.jobs.nhs.uk/candidate/search/results?keyword=&employer={safe}",
        }

    # 1. Try Clearbit for real domain
    domain = await get_domain_from_clearbit(session, name)
    if domain:
        result = await probe_careers(session, domain)
        if result:
            return result

    # 2. Fall back to slug-based domain guessing
    for candidate in slug_domain_candidates(name)[:8]:
        result = await probe_careers(session, candidate)
        if result:
            return result

    return None

# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit",   type=int, default=0,               help="Max sponsors (0=all)")
    parser.add_argument("--min-cos", type=int, default=1,               help="Min CoS activity")
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS, help="Concurrent workers")
    parser.add_argument("--all",     action="store_true",               help="Include 0-CoS sponsors")
    parser.add_argument("--start",   type=int, default=0,               help="Start index (for parallel chunks)")
    parser.add_argument("--end",     type=int, default=0,               help="End index (for parallel chunks)")
    args = parser.parse_args()

    print(f"Loading sponsors...")
    with open(SPONSORS_FILE) as f:
        all_sponsors = json.load(f)

    if args.all:
        sponsors = all_sponsors
    else:
        sponsors = [s for s in all_sponsors if (s.get("cos2025Total") or 0) >= args.min_cos]
        sponsors.sort(key=lambda s: s.get("cos2025Total") or 0, reverse=True)

    if args.start or args.end:
        end = args.end or len(sponsors)
        sponsors = sponsors[args.start:end]
    elif args.limit:
        sponsors = sponsors[:args.limit]

    chunk_tag = f"-{args.start}-{args.end}" if (args.start or args.end) else ""
    progress_file = Path(str(PROGRESS_FILE).replace(".json", f"{chunk_tag}.json"))

    print(f"Processing {len(sponsors):,} sponsors  workers={args.workers}")

    done: dict = {}
    if progress_file.exists():
        with open(progress_file) as f:
            done = json.load(f)
        print(f"  Resuming — {len(done):,} already processed")

    results: dict = dict(done)
    remaining = [s for s in sponsors if normalise(s["organisationName"]) not in done]
    print(f"  {len(remaining):,} remaining\n")

    sem       = asyncio.Semaphore(args.workers)
    start     = time.time()
    found     = sum(1 for v in done.values() if v)
    processed = len(done)

    connector = aiohttp.TCPConnector(limit=args.workers + 10, ssl=False)
    headers   = {"User-Agent": USER_AGENT}

    async with aiohttp.ClientSession(connector=connector, headers=headers) as session:

        async def process(sponsor: dict):
            nonlocal found, processed
            key = normalise(sponsor["organisationName"])
            async with sem:
                result = await find_careers_for_sponsor(session, sponsor)
            results[key] = result
            processed += 1
            if result:
                found += 1

            if processed % 100 == 0:
                with open(progress_file, "w") as f:
                    json.dump(results, f)
                elapsed = time.time() - start
                rate    = processed / elapsed if elapsed > 0 else 1
                eta     = (len(remaining) - processed) / rate if rate > 0 else 0
                pct     = found / processed * 100 if processed else 0
                print(
                    f"  [{processed:>6,}/{len(remaining):,}]  "
                    f"found={found:,} ({pct:.1f}%)  "
                    f"rate={rate:.1f}/s  ETA={eta/60:.0f}min",
                    flush=True,
                )

        await asyncio.gather(*[process(s) for s in remaining])

    # Final save
    with open(progress_file, "w") as f:
        json.dump(results, f, indent=2)

    hits = {k: v for k, v in results.items() if v}
    output_file = Path(str(OUTPUT_FILE).replace(".json", f"{chunk_tag}.json"))
    with open(output_file, "w") as f:
        json.dump(hits, f, indent=2)

    elapsed = time.time() - start
    pct     = len(hits) / processed * 100 if processed else 0
    print(f"\nDone in {elapsed/60:.1f}min")
    print(f"Found: {len(hits):,} / {processed:,} ({pct:.1f}%)")
    print(f"Output → {OUTPUT_FILE}")
    print(f"\nRun next: python3 scripts/merge-careers-output.py")

if __name__ == "__main__":
    asyncio.run(main())
