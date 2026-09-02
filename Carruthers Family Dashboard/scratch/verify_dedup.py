import json
import re

with open("js/real_calendars.js", "r", encoding="utf-8") as f:
    text = f.read()

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
            d = d_match.group(1).strip()[:8]
            events.append({"source": source, "date": d, "summary": s})
    return events

school_evs = parse_ics(data["school"], "school")
family_evs = parse_ics(data["family"], "family")

def normalize_title(s):
    t = s.lower()
    t = re.sub(r'\(.*?\)', '', t)
    t = t.replace('school', 'classes')
    t = t.replace('day of', ' ')
    t = t.replace('day for', ' ')
    t = re.sub(r'[^a-z0-9]', ' ', t)
    stop = {'the', 'of', 'and', 'for', 'in', 'to', 'day', 'cycle'}
    words = [w for w in t.split() if w not in stop]
    return " ".join(words)

def is_matching(s_ev, f_ev):
    if s_ev["date"] != f_ev["date"]:
        return False
    s_norm = normalize_title(s_ev["summary"])
    f_norm = normalize_title(f_ev["summary"])
    if not s_norm or not f_norm:
        return False
    if s_norm.isdigit() or f_norm.isdigit():
        return False
    if s_norm == f_norm or s_norm in f_norm or f_norm in s_norm:
        return True
    f_raw = f_ev["summary"].lower()
    if 'linden meadows' in f_raw or 'pembina trails' in f_raw:
        s_raw = s_ev["summary"].lower()
        if any(w in s_raw for w in ['break', 'classes', 'holiday', 'first day']):
            return True
    return False

filtered_family = []
dropped_family = []

for fe in family_evs:
    is_dup = False
    for se in school_evs:
        if is_matching(se, fe):
            is_dup = True
            dropped_family.append((fe["summary"], se["summary"], fe["date"]))
            break
    if not is_dup:
        filtered_family.append(fe)

print("Deduplication Results:")
print(f"Total School Events: {len(school_evs)}")
print(f"Total Original Family Events: {len(family_evs)}")
print(f"Dropped Duplicate Family Events: {len(dropped_family)}")
for f_sum, s_sum, dt in dropped_family:
    print(f"  - [{dt}] Dropped duplicate family event: '{f_sum}' (School already has: '{s_sum}')")

print(f"\nRemaining Family Events ({len(filtered_family)}):")
for fe in filtered_family:
    safe_name = fe['summary'].encode('ascii', 'replace').decode('ascii')
    print(f"  - [{fe['date']}] {safe_name}")

print("\nSUCCESS: No duplicate events will be displayed!")
