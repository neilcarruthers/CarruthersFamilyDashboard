import json
import re
from datetime import datetime

# Load real_calendars.js
with open("js/real_calendars.js", "r", encoding="utf-8") as f:
    text = f.read()

# Extract json
json_str = text.split("window.REAL_CALENDAR_SNAPSHOT = ")[1].rstrip(";\n")
data = json.loads(json_str)

def parse_ics(ics_content, source):
    events = []
    blocks = ics_content.split("BEGIN:VEVENT")
    for block in blocks[1:]:
        s_match = re.search(r"^SUMMARY(?:;[^:]*)?:(.*)$", block, re.M)
        d_match = re.search(r"^DTSTART(?:;[^:]*)?:(.*)$", block, re.M)
        if s_match and d_match:
            s = s_match.group(1).strip()
            d = d_match.group(1).strip()[:8] # YYYYMMDD
            events.append({"source": source, "date": d, "summary": s})
    return events

school_evs = parse_ics(data["school"], "school")
family_evs = parse_ics(data["family"], "family")

print(f"School events: {len(school_evs)}, Family events: {len(family_evs)}")

# Find events on the same day
from collections import defaultdict
by_date = defaultdict(lambda: {"school": [], "family": []})
for e in school_evs:
    by_date[e["date"]]["school"].append(e["summary"])
for e in family_evs:
    by_date[e["date"]]["family"].append(e["summary"])

overlaps = []
for d, group in sorted(by_date.items()):
    if group["school"] and group["family"]:
        overlaps.append((d, group["school"], group["family"]))

print(f"\nFound {len(overlaps)} dates with both school and family events:")
for d, s_list, f_list in overlaps[:15]:
    print(f"Date {d}:")
    print(f"  School: {s_list}")
    print(f"  Family: {f_list}")
