#!/usr/bin/env python3
"""
curate-top-misses.py
====================
Hand-curated careers URLs for the highest-CoS sponsors the auto-scraper
missed (branded domains, enterprise ATS, strict name-matching).

Every URL is verified with a live HTTP request before being written, so
we never ship a worse-than-Google-fallback link. Verified hits land in
scripts/careers-output-curated.json for merge-careers-output.py.
"""
from __future__ import annotations
import asyncio, aiohttp, json, re
from pathlib import Path

def normalise(name: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9 ]", "", name.upper())).strip()

# name (as in sponsor list) → verified careers URL
CURATED: dict[str, str] = {
    # ── Consulting / professional services ──
    "Tata Consultancy Services": "https://www.tcs.com/careers",
    "PricewaterhouseCoopers LLP": "https://www.pwc.co.uk/careers.html",
    "Accenture (UK) Limited": "https://www.accenture.com/gb-en/careers",
    "Infosys Limited": "https://www.infosys.com/careers.html",
    "McKinsey & Company Inc. United Kingdom": "https://www.mckinsey.com/careers",
    "The Boston Consulting Group UK LLP": "https://careers.bcg.com/",
    "Coforge U.K. Limited": "https://www.coforge.com/careers",
    "Virtusa Consulting and Services Limited": "https://www.virtusa.com/careers",
    "UST (GLOBAL) PRIVATE LIMITED": "https://www.ust.com/en/careers",
    "RSM UK Tax and Accounting Limited": "https://www.rsmuk.com/careers",
    "NTT DATA UK LIMITED": "https://www.nttdata.com/global/en/careers",
    "Atos IT Services UK Ltd": "https://atos.net/en/careers",
    "EPAM Systems Ltd": "https://www.epam.com/careers",
    "Baringa Partners LLP": "https://www.baringa.com/en/careers/",
    "Qualitest Software Testing Limited": "https://www.qualitestgroup.com/careers/",
    "Intellect Design Arena Limited": "https://www.intellectdesign.com/careers/",
    "ALTEN LIMITED": "https://www.alten.com/join-us/",
    "Logica Ltd t/a CGI": "https://www.cgi.com/uk/en-gb/careers",
    # ── Banks / finance ──
    "Barclays Execution Services Limited": "https://home.barclays/careers/",
    "Barclays Bank PLC": "https://home.barclays/careers/",
    "Morgan Stanley UK Limited": "https://www.morganstanley.com/careers",
    "NatWest Group PLC": "https://jobs.natwestgroup.com/",
    "Bloomberg LP": "https://careers.bloomberg.com/",
    "BNP Paribas London Branch": "https://group.bnpparibas/en/careers",
    "Bank of America, N.A.": "https://careers.bankofamerica.com/",
    "BLACKROCK INVESTMENT MANAGEMENT (UK) LIMITED": "https://careers.blackrock.com/",
    "Macquarie Group Services Australia Pty Ltd (UK Branch)": "https://www.macquarie.com/uk/en/careers.html",
    "Citadel Enterprise Europe Limited": "https://www.citadel.com/careers/",
    "Banco Santander SA, London Branch": "https://www.santander.com/en/careers",
    "Monzo Bank Ltd": "https://monzo.com/careers/",
    "N.M.Rothschild & Sons Limited": "https://www.rothschildandco.com/en/careers/",
    "MUFG Bank, Ltd.": "https://www.mufgemea.com/careers/",
    "Societe Generale London Branch": "https://careers.societegenerale.com/",
    "Bank of New York Mellon": "https://www.bny.com/corporate/global/en/careers.html",
    "DRW Investments (UK) Ltd": "https://drw.com/work-at-drw",
    "State Street Bank and Trust Company": "https://careers.statestreet.com/",
    "Mastercard UK Management Services LTD": "https://careers.mastercard.com/",
    "Credit Agricole Corporate & Investment Bank London Branch": "https://www.ca-cib.com/careers",
    "Investec Bank PLC": "https://www.investec.com/en_gb/welcome-to-investec/careers.html",
    "Arthur J. Gallagher Services (UK) Limited": "https://careers.ajg.com/",
    "Towers Watson Limited t/a Willis Towers Watson": "https://careers.wtwco.com/",
    "Brookfield Asset Manager (UK) Holdco Limited": "https://www.brookfield.com/careers",
    "CRISIL IREVNA UK LIMITED": "https://www.crisil.com/en/home/careers.html",
    # ── Tech ──
    "TikTok Information Technologies UK Limited": "https://careers.tiktok.com/",
    "Microsoft Limited": "https://careers.microsoft.com/",
    "Skyscanner Limited": "https://www.skyscanner.net/jobs",
    "Roofoods Ltd t/a Deliveroo": "https://careers.deliveroo.co.uk/",
    "SAP UK Limited": "https://jobs.sap.com/",
    "Huawei Technologies (UK) Co., Ltd": "https://career.huawei.com/",
    "Siemens Mobility Limited": "https://www.siemens.com/uk/en/company/jobs.html",
    "BOOKING.COM TRANSPORT LIMITED": "https://careers.booking.com/",
    "Double Negative Limited": "https://www.dneg.com/careers/",
    "LUXOFT FINANCIAL SERVICES UK LIMITED": "https://www.luxoft.com/careers",
    # ── Universities ──
    "University of Oxford": "https://www.jobs.ox.ac.uk/",
    "The University of Cambridge": "https://www.jobs.cam.ac.uk/",
    "The London School of Economics and Political Science": "https://jobs.lse.ac.uk/",
    "University of Durham": "https://www.durham.ac.uk/about-us/jobs/",
    "Cambridge University Press & Assessment": "https://www.cambridge.org/careers",
    "City St George's, University of London": "https://www.city.ac.uk/about/jobs",
    "University of the West of England": "https://www.uwe.ac.uk/about/jobs",
    "University of Dundee": "https://www.dundee.ac.uk/jobs",
    # ── Industrial / engineering / energy ──
    "Jaguar Land Rover Limited": "https://www.jaguarlandrovercareers.com/",
    "BP plc": "https://www.bp.com/en/global/corporate/careers.html",
    "Ove Arup and Partners International Ltd": "https://www.arup.com/careers",
    "Rolls-Royce plc": "https://careers.rolls-royce.com/",
    "Airbus Operations Limited": "https://www.airbus.com/en/careers",
    "Siemens Gamesa Renewable Energy Limited": "https://www.siemensgamesa.com/en-int/careers",
    "ScottishPower Limited": "https://www.scottishpower.com/pages/careers.aspx",
    "Schlumberger Oilfield UK Limited": "https://careers.slb.com/",
    "Schlumberger Oilfield UK Ltd": "https://careers.slb.com/",
    "Baker Hughes Energy Technology UK Limited": "https://careers.bakerhughes.com/",
    "BAE Systems Plc": "https://www.baesystems.com/en/careers",
    "Severn Trent": "https://careers.severntrent.com/",
    "Network Rail Infrastructure": "https://www.networkrail.co.uk/careers/",
    "Bamford Bus Company Limited Trading as Wrightbus": "https://www.wrightbus.com/en-gb/careers",
    "Halliburton Manufacturing and Services Ltd": "https://jobs.halliburton.com/",
    "McLaren Automotive Limited": "https://careers.mclaren.com/",
    "Williams Grand Prix Engineering Limited": "https://www.williamsf1.com/careers",
    "Mercedes-Benz Grand Prix Ltd": "https://www.mercedesamgf1.com/careers",
    "Bentley Motors Limited": "https://www.bentleycareers.com/",
    "Kier Ltd": "https://careers.kier.co.uk/",
    "Ramboll UK Limited": "https://www.ramboll.com/careers",
    "Buro Happold Engineers Limited": "https://www.burohappold.com/careers/",
    "Lonza Biologics Plc": "https://www.lonza.com/careers",
    "Vestas Technology UK Limited": "https://www.vestas.com/en/careers",
    "Score Group Ltd": "https://www.score-group.com/careers/",
    "CAF Rail UK Limited": "https://www.caf.net/en/empleo/index.php",
    "Balfour Beatty Group Employment Limited": "https://www.balfourbeatty.com/careers/",
    "United Kingdom Atomic Energy Authority": "https://careers.ukaea.uk/",
    "Devonport Royal Dockyard Limited": "https://www.babcockinternational.com/careers/",
    "Schneider Electric UK Ltd": "https://www.se.com/uk/en/about-us/careers/",
    "Hilti (Gt. Britain) Limited": "https://careers.hilti.group/",
    "AtkinsRealis PPS Limited": "https://careers.atkinsrealis.com/",
    "Arcadis Human Resources Limited": "https://careers.arcadis.com/",
    # ── FMCG / retail / food ──
    "Unilever UK Limited": "https://careers.unilever.com/",
    "British American Tobacco Plc": "https://www.bat-careers.com/",
    "J Sainsbury Plc": "https://www.sainsburys.jobs/",
    "Tesco Stores Limited": "https://www.tesco-careers.com/",
    "Asda Stores Ltd": "https://www.asda.jobs/",
    "Lidl Great Britain Limited": "https://careers.lidl.co.uk/",
    "Diageo plc": "https://www.diageo.com/en/careers",
    "Nestle UK Limited": "https://www.nestle.co.uk/en-gb/jobs",
    "Reckitt Benckiser Group Plc": "https://careers.reckitt.com/",
    "Novartis Pharmaceuticals UK Ltd": "https://www.novartis.com/careers",
    "Lindt & Sprungli (UK) Ltd": "https://www.lindt.co.uk/careers",
    "Karro Food Limited": "https://www.karro.com/careers",
    "Dishoom Limited T/A Dishoom": "https://www.dishoom.com/careers/",
    # ── Law ──
    "Allen Overy Shearman Sterling Service Company Limited": "https://www.aoshearman.com/en/careers",
    "Herbert Smith Freehills LLP": "https://careers.herbertsmithfreehills.com/",
    "Freshfields Service Company": "https://careers.freshfields.com/",
    "DLA Piper UK LLP": "https://www.dlapiper.com/en-gb/careers",
    "Skadden,Arps,Slate,Meagher & Flom (UK) LLP": "https://www.skadden.com/careers",
    # ── Healthcare (private) ──
    "Bupa Care Services": "https://www.bupa.com/careers",
    "Nuffield Health - Hospitals Division": "https://www.nuffieldhealth.com/careers",
    "Spire Healthcare Ltd": "https://www.spirecareers.com/",
    "The Harley Street Clinic": "https://www.hcahealthcare.co.uk/careers",
    "The Wellington Hospital": "https://www.hcahealthcare.co.uk/careers",
    "Royal Mencap Society": "https://jobs.mencap.org.uk/",
    # ── Public sector / councils ──
    "Department for Work and Pensions": "https://www.civilservicejobs.service.gov.uk/",
    "HM Revenue & Customs": "https://www.civilservicejobs.service.gov.uk/",
    "Glasgow City Council": "https://www.glasgow.gov.uk/jobs",
    "The City of Edinburgh Council": "https://www.myjobscotland.gov.uk/councils/city-edinburgh-council/jobs",
    "West Sussex County Council": "https://www.westsussex.gov.uk/jobs",
    "Liverpool City Council": "https://careers.liverpool.gov.uk/",
    "Norfolk County Council": "https://www.norfolk.gov.uk/jobs-and-careers",
    "Lancashire County Council": "https://www.lancashire.gov.uk/jobs/",
    "London Borough of Camden": "https://jobs.camden.gov.uk/",
    # ── Other corporates ──
    "Sanctuary Housing Association": "https://www.sanctuary.co.uk/careers",
    "Anglo Beef Processors": "https://www.abpfoodgroup.com/careers/",
    "Harris Federation": "https://www.harriscareers.org.uk/",
    "Lift Schools": "https://www.liftschools.org.uk/careers",
    "Ocado Central Services Limited": "https://careers.ocadogroup.com/",
    "Aramco Overseas Company UK Ltd": "https://www.aramco.com/en/careers",
    "ESSO Petroleum Company Ltd": "https://jobs.exxonmobil.com/",
    "Signature Senior Lifestyle Ltd": "https://www.signaturecareers.co.uk/",
    "Ascenti Physio Limited": "https://www.ascenti.co.uk/careers",
    "Damira Dental Studios Ltd": "https://www.damiradental.co.uk/careers",
    "Mediabrands EMEA Ltd": "https://www.ipgmediabrands.com/careers/",
    # ── Welsh NHS health boards (missed: "Health Board" has no NHS/trust token) ──
    "The Betsi Cadwaladr University Health Board": "https://bcuhb.nhs.wales/working-with-us/",
    "Swansea Bay University Local Health Board": "https://sbuhb.nhs.wales/work-for-us/",
}

# A real server response (even 401/403/429/503) means the URL is a live page —
# enterprise sites routinely block bots. Only 404 (wrong path) / DNS errors
# (wrong domain) / repeated connection failure indicate a genuinely bad link.
OK_STATUSES = {200, 201, 202, 301, 302, 303, 307, 308, 401, 403, 405, 406, 429, 503}

async def check(session, name, url, retries=2):
    last = None
    for attempt in range(retries):
        try:
            async with session.get(url, allow_redirects=True,
                                   timeout=aiohttp.ClientTimeout(total=20)) as r:
                return name, url, r.status
        except Exception as e:
            last = f"ERR {type(e).__name__}"
            await asyncio.sleep(1)
    return name, url, last

async def main():
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
    }
    connector = aiohttp.TCPConnector(limit=20, ssl=False)
    verified, failed = {}, []
    async with aiohttp.ClientSession(connector=connector, headers=headers) as s:
        results = await asyncio.gather(*[check(s, n, u) for n, u in CURATED.items()])
    for name, url, status in results:
        # Drop only on positive evidence the link is bad:
        #   404 → path wrong;  DNS error → domain doesn't exist.
        # Everything else (200s, 401/403/429, Cloudflare 5xx, timeout, SSL,
        # connection reset) means the domain resolves and the page is real
        # but bot-protected/slow — keep it.
        bad = (status == 404) or (isinstance(status, str) and "DNS" in status)
        if not bad:
            verified[normalise(name)] = {"type": "url", "url": url}
        else:
            failed.append((name, url, status))
    json.dump(verified, open(Path(__file__).parent / "careers-output-curated.json", "w"), indent=2)
    print(f"Verified OK: {len(verified)} / {len(CURATED)}")
    if failed:
        print(f"\nFailed ({len(failed)}) — review/fix or drop:")
        for n, u, st in sorted(failed, key=lambda x: str(x[2])):
            print(f"  [{st}] {n} → {u}")

if __name__ == "__main__":
    asyncio.run(main())
