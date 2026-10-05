"""Parse MBBS<n>_OSPE_Bank_100.docx files into backend/content-source/ospe/.

Usage: python tools/parse_ospe_docx.py <dir-with-docx-files>
Each docx: cover (module list) -> per module "MODULE k" + name + station list ->
"Station N: Title", topic line, "Specimen / Scenario", text, "Candidate Tasks",
numbered tasks, "Examiner Scoring Checklist", checklist items.
"""
import docx, re, json, sys, glob, os

YEAR_NAMES = {1: "MBBS First Year", 2: "MBBS Second Year", 3: "MBBS Third Year", 4: "MBBS Fourth Year"}

def slug(s):
    s = s.replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def block_slug(name):
    # Match MCQ slugs: drop trailing "Module"/"Block" and parentheses
    return slug(re.sub(r"\s+(Module|Block)$", "", name))

def parse(path):
    p = [x.text.strip() for x in docx.Document(path).paragraphs if x.text.strip()]
    cover = [re.sub(r"^\d+\.\s+|\s+—\s+\d+ stations$", "", x) for x in p[:15] if re.search(r"—\s+\d+ stations$", x)]
    blocks, cur, st, section = [], None, None, None
    i = 0
    while i < len(p):
        x = p[i]
        if re.fullmatch(r"(MODULE|BLOCK) \d+", x):
            cur = {"name": cover[len(blocks)], "stations": []}
            blocks.append(cur); st = None; section = None; i += 2; continue
        m = re.fullmatch(r"Station (\d+): (.+)", x)
        if m and cur is not None:
            st = {"n": int(m.group(1)), "title": m.group(2).strip(), "topic": p[i + 1],
                  "scenario": "", "tasks": [], "checklist": []}
            cur["stations"].append(st); section = None; i += 2; continue
        if st is not None:
            if x == "Specimen / Scenario": section = "scenario"
            elif x == "Candidate Tasks": section = "tasks"
            elif x == "Examiner Scoring Checklist": section = "checklist"
            elif section == "scenario": st["scenario"] = (st["scenario"] + " " + x).strip()
            elif section == "tasks": st["tasks"].append(re.sub(r"^\d+\.\s+", "", x))
            elif section == "checklist": st["checklist"].append(x)
        i += 1
    return blocks

def main(src):
    out_dir = os.path.join(os.path.dirname(__file__), "..", "backend", "content-source", "ospe")
    os.makedirs(out_dir, exist_ok=True)
    years = []
    for n in range(1, 5):
        path = glob.glob(os.path.join(src, f"*MBBS{n}_OSPE_Bank_100.docx"))[0]
        blocks = parse(path)
        stations = [s for b in blocks for s in b["stations"]]
        assert len(blocks) == 5 and len(stations) == 100, (n, len(blocks), len(stations))
        for b in blocks:  # numbering restarts at 1 in each module/block
            assert [s["n"] for s in b["stations"]] == list(range(1, len(b["stations"]) + 1)), (n, b["name"])
        for s in stations:
            assert s["scenario"] and len(s["tasks"]) >= 2 and len(s["checklist"]) >= 2, (n, s["n"], s["title"])
        data, meta_blocks = {}, []
        for b in blocks:
            bs = block_slug(b["name"])
            topics = {}  # some stations are listed out of topic order; group by topic, keep first-seen order
            for s in b["stations"]:
                ts = slug(s["topic"])
                topics.setdefault(ts, {"slug": ts, "name": s["topic"], "count": 0})["count"] += 1
                data.setdefault(f"{bs}/{ts}", []).append(
                    {"id": f"ospe{n}-{bs}-{s['n']}", "n": s["n"], "t": s["title"], "sc": s["scenario"],
                     "tk": s["tasks"], "ck": s["checklist"]})
            meta_blocks.append({"slug": bs, "name": b["name"], "count": len(b["stations"]), "topics": list(topics.values())})
        with open(os.path.join(out_dir, f"mbbs-{n}.json"), "w") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        years.append({"slug": f"mbbs-{n}", "year": n, "name": YEAR_NAMES[n], "count": len(stations), "blocks": meta_blocks})
        print(n, [(b["name"], b["count"], len(b["topics"])) for b in meta_blocks])
    with open(os.path.join(out_dir, "years.json"), "w") as f:
        json.dump(years, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main(sys.argv[1])
