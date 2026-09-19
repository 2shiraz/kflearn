"""Parse the MBBS Final Year MCQ bank (.docx) into the app's MCQ format.

Layout of this bank (differs from the Year 1-4 banks):
  Heading 1 = KMU block (N, O, P, Q)   Heading 2 = module (Foundation-III, ...)
  "N1. stem" / "A. option" ... / "Answer: A. explanation   [Subject • Topic]"
App mapping: module -> block, subject -> topic.
Usage: python tools/parse_final_year.py <docx> <year_number> frontend/src/data/mcqs/extra
Then set the "name" field in the generated .meta.json if it is not "MBBS Final Year".
"""
import docx, re, json, sys, collections

def slug(s):
    s = s.lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

src, year, out_dir = sys.argv[1], int(sys.argv[2]), sys.argv[3]
d = docx.Document(src)
paras = [(p.style.name, p.text.strip()) for p in d.paragraphs if p.text.strip()]

modules = []  # [{name, items: [q...]}]
q = None
started = False
for style, t in paras:
    if style == "Heading 1":
        started = t.startswith("Block ")
        continue
    if not started:
        continue
    if style == "Heading 2":
        modules.append({"name": t, "items": []}); q = None; continue
    m = re.match(r"^[NOPQ]\d+\.\s+(.*)", t)
    if m and modules:
        q = {"s": m.group(1).strip(), "o": []}; modules[-1]["items"].append(q); continue
    m = re.match(r"^([A-E])\.\s+(.*)", t)
    if m and q is not None and "a" not in q:
        q["o"].append(m.group(2).strip()); continue
    m = re.match(r"^Answer:\s*([A-E])\.\s*(.*)", t)
    if m and q is not None:
        rest = m.group(2).strip()
        tag = re.search(r"\[([^\]]+)\]\s*$", rest)
        subject = "General"
        if tag:
            subject = tag.group(1).split("•")[0].strip()
            rest = rest[: tag.start()].strip()
        q["a"] = "ABCDE".index(m.group(1)); q["e"] = rest; q["subject"] = subject

# checks
allq = [x for mod in modules for x in mod["items"]]
bad = [x["s"][:50] for x in allq if len(x["o"]) != 5 or "a" not in x]
assert not bad, f"{len(bad)} malformed: {bad[:3]}"

# group by subject inside each module (keeps first-seen order), then number sequentially
data, blocks, n = {}, [], 0
for mod in modules:
    groups = collections.OrderedDict()
    for x in mod["items"]:
        groups.setdefault(x["subject"], []).append(x)
    bslug = slug(mod["name"]); topics = []
    for subj, items in groups.items():
        tslug = slug(subj); key = f"{bslug}/{tslug}"; data[key] = []
        for x in items:
            n += 1
            data[key].append({"id": f"y{year}-q{n}", "s": x["s"], "o": x["o"], "a": x["a"], "e": x["e"]})
        topics.append({"slug": tslug, "name": subj, "count": len(items)})
    blocks.append({"slug": bslug, "name": mod["name"], "count": len(mod["items"]), "topics": topics})

meta = {"slug": f"mbbs-{year}", "year": year, "name": sys.argv[4] if len(sys.argv) > 4 else "MBBS Final Year", "count": n, "blocks": blocks}
json.dump(data, open(f"{out_dir}/mbbs-{year}.json", "w"), ensure_ascii=False)
json.dump(meta, open(f"{out_dir}/mbbs-{year}.meta.json", "w"), ensure_ascii=False, indent=2)
print(n, "questions;", [(b["name"], b["count"], len(b["topics"])) for b in blocks])
print("answer spread:", collections.Counter("ABCDE"[x["a"]] for x in allq))
