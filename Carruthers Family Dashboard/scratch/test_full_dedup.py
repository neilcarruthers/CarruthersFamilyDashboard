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
            d = d_match.group(1).strip()[:8] # YYYYMMDD
            events.append({"source": source, "date": d, "summary": s})
    return events

school_evs = parse_ics(data["school"], "school")
family_evs = parse_ics(data["family"], "family")

def normalize(title):
    t = title.lower()
    t = re.sub(r'\(.*?\)', '', t)
    t = t.replace('school', 'classes')
    t = t.replace('day of', ' ')
    t = t.replace('day for', ' ')
    t = re.sub(r'[^a-z0-9]', ' ', t)
    words = [w for w in t.split() if w not in ['the', 'of', 'and', 'for', 'in', 'to', 'day', 'cycle']]
    return " ".join(words)

def is_duplicate(school_ev, family_ev):
    if school_ev["date"] != family_ev["date"]:
        return False
    n1 = normalize(school_ev["summary"])
    n2 = normalize(family_ev["summary"])
    if not n1 or not n2:
        return False
    # Don't match generic day cycle numbers like "Day 1", "Day 2"
    if n1.isdigit() or n2.isdigit():
        return False
    if n1 == n2 or n1 in n2 or n2 in n1:
        return True
    # Also check if family event explicitly mentions Linden Meadows or Pembina Trails and school has an event on that day
    f_raw = family_ev["summary"].lower()
    if ('linden meadows' in f_raw or 'pembina trails' in f_raw) and ('break' in f_raw or 'classes' in f_raw or 'resume' in f_raw):
        s_raw = school_ev["summary"].lower()
        if 'break' in s_raw or 'classes' in s_raw or 'resume' in s_raw or 'holiday' in s_raw:
            return True
    return False

deduped_family = []
matched_pairs = []

for fe in family_evs:
    matched = False
    for se in school_evs:
        if is_duplicate(se, fe):
            matched_pairs.append((fe, se))
            matched = True
            break
    if not matched:
        deduped_family.append(fe)

print(f"Total Family Events: {len(family_evs)}")
print(f"Matched as duplicates of School Calendar: {len(matched_pairs)}")
for fe, se in matched_pairs:
    print(f"  DROP Family '{fe['summary']}' ({fe['date']}) because School has '{se['summary']}'")

print(f"\nRemaining Unique Family Events: {len(deduped_family)}")
for fe in deduped_family:
    print(f"  KEEP Family: '{fe['summary']}' ({fe['date']})")
