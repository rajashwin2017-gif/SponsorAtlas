#!/usr/bin/env python3
"""
merge-careers-output.py
=======================
Takes scripts/careers-output.json (from find-careers-pages.py)
and merges new entries into src/lib/careers-data.ts without
overwriting existing hand-curated entries.

Run after find-careers-pages.py completes:
  python3 scripts/merge-careers-output.py
"""

import json
import re
from pathlib import Path

OUTPUT_FILE    = Path(__file__).parent / "careers-output.json"
CAREERS_TS     = Path(__file__).parent.parent / "src/lib/careers-data.ts"

def main():
    scripts_dir = Path(__file__).parent

    # Collect all output files: chunk files first, then single output file
    chunk_files = sorted(scripts_dir.glob("careers-output-*.json"))
    all_output_files = chunk_files if chunk_files else ([OUTPUT_FILE] if OUTPUT_FILE.exists() else [])

    if not all_output_files:
        print(f"ERROR: No careers-output*.json files found. Run find-careers-pages.py first.")
        return

    print(f"Loading from {len(all_output_files)} output file(s)...")
    new_entries: dict = {}
    for f in all_output_files:
        with open(f) as fh:
            chunk = json.load(fh)
        print(f"  {f.name}: {len(chunk):,} entries")
        new_entries.update(chunk)

    with open(CAREERS_TS) as f:
        existing_ts = f.read()

    # Extract keys already in the TS file
    existing_keys = set(re.findall(r'"([A-Z0-9 ]+)":\s*\{', existing_ts))
    print(f"Existing entries in careers-data.ts: {len(existing_keys)}")

    # Filter to genuinely new entries
    to_add = {k: v for k, v in new_entries.items() if k not in existing_keys}
    print(f"New entries to add: {len(to_add)}")

    if not to_add:
        print("Nothing new to add.")
        return

    # Build TS block
    lines = ["\n  // ── Auto-discovered by find-careers-pages.py ──────────────────────────────"]
    for key, entry in sorted(to_add.items(), key=lambda x: x[0]):
        t = entry.get("type", "url")
        if t in ("greenhouse", "lever", "workable") and entry.get("token"):
            lines.append(
                f'  "{key}": {{ type: "{t}", token: "{entry["token"]}" }},'
            )
        elif entry.get("url"):
            lines.append(
                f'  "{key}": {{ type: "{t}", url: "{entry["url"]}" }},'
            )

    block = "\n".join(lines)

    # Insert before the closing }; of CAREERS_TABLE
    updated = existing_ts.replace(
        "\n};\n\nexport function lookupCareers",
        block + "\n};\n\nexport function lookupCareers",
    )

    if updated == existing_ts:
        # Try alternate insertion point
        updated = existing_ts.replace(
            "\n};\n\n// ── Lookup function",
            block + "\n};\n\n// ── Lookup function",
        )
    if updated == existing_ts:
        print("ERROR: Could not find insertion point in careers-data.ts")
        return

    with open(CAREERS_TS, "w") as f:
        f.write(updated)

    print(f"Done. Added {len(to_add)} new entries to careers-data.ts")

if __name__ == "__main__":
    main()
