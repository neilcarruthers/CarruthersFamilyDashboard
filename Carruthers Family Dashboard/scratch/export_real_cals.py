import urllib.request
import json
import re

urls = {
    "school": "https://calendar.google.com/calendar/ical/h0hk60cgc1m0b9hmpjco30k8uoekoviu%40import.calendar.google.com/public/basic.ics",
    "family": "https://calendar.google.com/calendar/ical/family14618050426993599120%40group.calendar.google.com/private-763f5d8968dcc5f4c04a19178d2e3341/basic.ics"
}

cached = {}

for source, url in urls.items():
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        text = resp.read().decode('utf-8', errors='ignore')
        cached[source] = text

with open("js/real_calendars.js", "w", encoding="utf-8") as f:
    f.write("// Real Google Calendar ICS snapshot for offline fallback\n")
    f.write("window.REAL_CALENDAR_SNAPSHOT = " + json.dumps(cached) + ";\n")

print("Saved real calendar snapshots!")
