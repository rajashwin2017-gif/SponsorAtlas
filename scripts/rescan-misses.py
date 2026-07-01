#!/usr/bin/env python3
"""
rescan-misses.py
================
Second-pass scraper for the ~20K sponsors the first run missed.

Why a second pass helps:
  The first run only probed guessed /careers paths and sniffed for
  Greenhouse/Lever/Workable. Misses were sponsors where no path returned
  200. This pass adds:
    1. Homepage crawl — fetch the domain root, extract <a href> links,
       follow ones that look like careers/jobs pages.
    2. Enterprise ATS detection — Workday, SuccessFactors, Taleo, iCIMS,
       SmartRecruiters, Oracle Cloud, Avature, Eightfold, Teamtailor,
       Personio, BambooHR — matched anywhere in homepage/careers HTML.

Input:   scripts/misses.json        (sponsor objects, written by caller)
Output:  scripts/careers-output-rescan.json   (merge-ready hits)
Resume:  scripts/rescan-progress.json

Run:
  python3 scripts/rescan-misses.py [--start N] [--end N] [--workers N]
Then:
  python3 scripts/merge-careers-output.py
"""
from __future__ import annotations
import asyncio, aiohttp, json, re, argparse, time
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

MISSES_FILE   = Path(__file__).parent / "misses.json"
OUTPUT_FILE   = Path(__file__).parent / "careers-output-rescan.json"
PROGRESS_FILE = Path(__file__).parent / "rescan-progress.json"

TIMEOUT_SEC     = 4
DEFAULT_WORKERS = 30
USER_AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
             "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")

CLEARBIT_URL = "https://autocomplete.clearbit.com/v1/companies/suggest?query={query}"

STRIP_RE = re.compile(
    r"\b(ltd|llp|plc|limited|llc|inc|corp|corporation|group|holdings?|"
    r"uk services?|uk limited|uk ltd|technologies?|solutions?|services?|"
    r"systems?|international|global|worldwide|europe|uk|national association)\b\.?",
    re.IGNORECASE,
)

# ── Expanded ATS detection ────────────────────────────────────────────────────
# Each pattern captures the full apply URL so we can link straight to it.
ATS_PATTERNS = [
    ("workday",        re.compile(r"https?://[a-z0-9.\-]+\.myworkdayjobs\.com/[^\s\"'<>]+", re.I)),
    ("successfactors", re.compile(r"https?://[a-z0-9.\-]*career\d*\.successfactors\.(?:com|eu)/[^\s\"'<>]+", re.I)),
    ("taleo",          re.compile(r"https?://[a-z0-9.\-]+\.taleo\.net/[^\s\"'<>]+", re.I)),
    ("icims",          re.compile(r"https?://[a-z0-9.\-]+\.icims\.com/[^\s\"'<>]+", re.I)),
    ("smartrecruiters",re.compile(r"https?://(?:jobs|careers)\.smartrecruiters\.com/[^\s\"'<>]+", re.I)),
    ("oraclecloud",    re.compile(r"https?://[a-z0-9.\-]+\.oraclecloud\.com/hcmUI/CandidateExperience/[^\s\"'<>]+", re.I)),
    ("avature",        re.compile(r"https?://[a-z0-9.\-]+\.avature\.net/[^\s\"'<>]+", re.I)),
    ("eightfold",      re.compile(r"https?://[a-z0-9.\-]+\.eightfold\.ai/careers[^\s\"'<>]*", re.I)),
    ("teamtailor",     re.compile(r"https?://[a-z0-9.\-]+\.teamtailor\.com/[^\s\"'<>]+", re.I)),
    ("personio",       re.compile(r"https?://[a-z0-9.\-]+\.jobs\.personio\.(?:com|de)/[^\s\"'<>]*", re.I)),
    ("bamboohr",       re.compile(r"https?://[a-z0-9.\-]+\.bamboohr\.com/(?:careers|jobs)[^\s\"'<>]*", re.I)),
    ("greenhouse",     re.compile(r"https?://boards\.greenhouse\.io/[a-z0-9_\-]+", re.I)),
    ("lever",          re.compile(r"https?://jobs\.lever\.co/[a-z0-9_\-]+", re.I)),
    ("workable",       re.compile(r"https?://apply\.workable\.com/[a-z0-9_\-]+", re.I)),
]

# Links on a homepage whose href/text suggests a careers destination
CAREERS_HINT_RE = re.compile(r"(career|job|vacanc|recruit|work-with-us|work-for-us|join-us|join-our|opportunit)", re.I)
HREF_RE = re.compile(r"<a\b[^>]*?href=[\"']([^\"'#]+)[\"'][^>]*>(.*?)</a>", re.I | re.S)

def normalise(name: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9 ]", "", name.upper())).strip()

def clean_name_for_search(name: str) -> str:
    cleaned = STRIP_RE.sub(" ", name)
    cleaned = re.sub(r"\([^)]*\)", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()

def detect_ats(html: str) -> Optional[dict]:
    for kind, pat in ATS_PATTERNS:
        if m := pat.search(html):
            return {"type": kind, "url": m.group(0).rstrip("\\\"').,")}
    return None

def slug_domain_candidates(name: str) -> list:
    cleaned = STRIP_RE.sub(" ", name)
    cleaned = re.sub(r"\([^)]*\)", "", cleaned)
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", cleaned).strip()
    slug = re.sub(r"\s+", "-", cleaned.lower()).strip("-")
    cands = []
    for s in filter(None, [slug, slug.replace("-", "")]):
        cands += [f"www.{s}.co.uk", f"www.{s}.com", f"{s}.co.uk", f"{s}.com"]
    seen = set()
    return [c for c in cands if not (c in seen or seen.add(c))]

async def fetch(session, url) -> tuple[Optional[str], Optional[str]]:
    """Return (final_url, html) or (None, None)."""
    try:
        async with session.get(url, allow_redirects=True,
                               timeout=aiohttp.ClientTimeout(total=TIMEOUT_SEC)) as r:
            if r.status != 200:
                return None, None
            raw = await asyncio.wait_for(r.content.read(60_000), timeout=TIMEOUT_SEC)
            return str(r.url), raw.decode("utf-8", errors="ignore")
    except Exception:
        return None, None

async def get_domain(session, name) -> Optional[str]:
    query = clean_name_for_search(name)
    url = CLEARBIT_URL.format(query=query.replace(" ", "+"))
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as r:
            if r.status != 200:
                return None
            results = await r.json()
            if not results:
                return None
            ql = query.lower()
            for item in results[:3]:
                if item.get("name", "").lower() == ql:
                    return item.get("domain")
            return results[0].get("domain")
    except Exception:
        return None

async def probe_domain(session, domain) -> Optional[dict]:
    """Crawl homepage → ATS scan → follow careers-like links → ATS/url."""
    domain = domain.rstrip("/")
    root = domain if domain.startswith("http") else f"https://{domain}"
    final, html = await fetch(session, root)
    if not html:
        return None

    # 1. ATS embedded directly on the homepage
    if ats := detect_ats(html):
        return ats

    # 2. Collect careers-like links from the homepage
    base = final or root
    host = urlparse(base).netloc
    careers_links: list[str] = []
    for href, text in HREF_RE.findall(html):
        if CAREERS_HINT_RE.search(href) or CAREERS_HINT_RE.search(text):
            absolute = urljoin(base, href)
            p = urlparse(absolute)
            if p.scheme in ("http", "https"):
                careers_links.append(absolute)

    # Prefer same-host links first, then external (often the ATS itself)
    careers_links = list(dict.fromkeys(careers_links))
    careers_links.sort(key=lambda u: urlparse(u).netloc == host, reverse=True)

    for link in careers_links[:5]:
        # An external careers link may already be a known ATS host
        if ats := detect_ats(link):
            return ats
        c_final, c_html = await fetch(session, link)
        if not c_html:
            continue
        if ats := detect_ats(c_html):
            return ats
        # A real on-site careers page is itself a valid result
        if CAREERS_HINT_RE.search(c_final or link):
            return {"type": "url", "url": c_final or link}
    return None

async def find(session, sponsor) -> Optional[dict]:
    name = sponsor["organisationName"]
    domain = await get_domain(session, name)
    if domain:
        if r := await probe_domain(session, domain):
            return r
    for cand in slug_domain_candidates(name)[:4]:
        if r := await probe_domain(session, cand):
            return r
    return None

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--end", type=int, default=0)
    ap.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    args = ap.parse_args()

    sponsors = json.load(open(MISSES_FILE))
    if args.start or args.end:
        sponsors = sponsors[args.start:(args.end or len(sponsors))]
    tag = f"-{args.start}-{args.end}" if (args.start or args.end) else ""
    progress_file = Path(str(PROGRESS_FILE).replace(".json", f"{tag}.json"))

    done = {}
    if progress_file.exists():
        done = json.load(open(progress_file))
        print(f"Resuming — {len(done):,} already done")
    results = dict(done)
    remaining = [s for s in sponsors if normalise(s["organisationName"]) not in done]
    print(f"Re-scanning {len(remaining):,} of {len(sponsors):,} misses  workers={args.workers}\n")

    sem = asyncio.Semaphore(args.workers)
    start = time.time()
    found = sum(1 for v in done.values() if v)
    processed = len(done)

    connector = aiohttp.TCPConnector(limit=args.workers + 10, ssl=False)
    async with aiohttp.ClientSession(connector=connector,
                                     headers={"User-Agent": USER_AGENT}) as session:
        async def worker(sp):
            nonlocal found, processed
            key = normalise(sp["organisationName"])
            async with sem:
                try:
                    res = await find(session, sp)
                except Exception:
                    res = None
            results[key] = res
            processed += 1
            if res:
                found += 1
            if processed % 100 == 0:
                json.dump(results, open(progress_file, "w"))
                el = time.time() - start
                rate = processed / el if el else 1
                eta = (len(remaining) - (processed - len(done))) / rate if rate else 0
                print(f"  [{processed:>6,}/{len(sponsors):,}]  found={found:,} "
                      f"({found/processed*100:.1f}%)  rate={rate:.1f}/s  ETA={eta/60:.0f}min", flush=True)
        await asyncio.gather(*[worker(s) for s in remaining])

    json.dump(results, open(progress_file, "w"), indent=2)
    hits = {k: v for k, v in results.items() if v}
    out = Path(str(OUTPUT_FILE).replace(".json", f"{tag}.json"))
    json.dump(hits, open(out, "w"), indent=2)
    print(f"\nDone in {(time.time()-start)/60:.1f}min — found {len(hits):,} new "
          f"({len(hits)/processed*100:.1f}%) → {out.name}")

if __name__ == "__main__":
    asyncio.run(main())
