import re
from datetime import datetime

def normalize(title):
    t = title.lower()
    # Remove parentheticals
    t = re.sub(r'\(.*?\)', '', t)
    # Normalize common synonyms
    t = t.replace('school', 'classes')
    t = t.replace('day of', ' ')
    t = t.replace('day for', ' ')
    t = re.sub(r'[^a-z0-9]', ' ', t)
    # Remove filler words
    words = [w for w in t.split() if w not in ['the', 'of', 'and', 'for', 'in', 'to', 'day', 'cycle']]
    return " ".join(words)

test_pairs = [
    ("First day of School (For Students)", "First Day of Classes (Linden Meadows / Pembina Trails)"),
    ("National Day of Truth and Reconciliation", "National Day for Truth and Reconciliation (No Classes)"),
    ("Thanksgiving Day", "Thanksgiving Day (No Classes)"),
    ("Remembrance Day", "Remembrance Day (No Classes)"),
    ("Louis Riel Day", "Louis Riel Day (No Classes)"),
    ("Good Friday", "Good Friday (No Classes)"),
    ("Spring Break", "Spring Break (Pembina Trails / Linden Meadows)"),
    ("Victoria Day", "Victoria Day (No Classes)"),
    ("Day 2", "Margot Dance Class"), # Should NOT match
    ("Day 5", "Dawson Soccer Practice"), # Should NOT match
]

for s1, s2 in test_pairs:
    n1 = normalize(s1)
    n2 = normalize(s2)
    matches = (n1 == n2) or (n1 in n2) or (n2 in n1) or (n1.startswith(n2)) or (n2.startswith(n1))
    print(f"'{s1}' VS '{s2}' -> n1='{n1}', n2='{n2}' => MATCH: {matches}")
