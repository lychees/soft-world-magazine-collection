#!/usr/bin/env python3
"""扫描收藏目录，解析文件名元数据，生成 _work/issues.json。

用法:  SW_SRC="Y:/baiduyun/软体世界（229本-不全-已结刊）" python tools/build_inventory.py
"""
import json, os, re
import fitz

SRC = os.environ.get("SW_SRC", "Y:/baiduyun/软体世界（229本-不全-已结刊）")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "_work")
os.makedirs(WORK, exist_ok=True)


def month_of_issue(n):
    """正刊期号 -> (年, 月)，第 1 期 = 1989-04，月刊。"""
    m = 4 + (n - 1)
    return 1989 + (m - 1) // 12, (m - 1) % 12 + 1


def main():
    inv = []
    for root, _dirs, files in os.walk(SRC):
        for f in sorted(files):
            if not f.lower().endswith(".pdf"):
                continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, SRC).replace("\\", "/")
            yd = rel.split("/")[0]
            m = re.match(r"(19|20)\d{2}", yd)
            inv.append({"rel": rel, "file": f, "year_dir": yd,
                        "year": int(m.group(0)) if m else None,
                        "size": os.path.getsize(path)})
    for it in inv:
        d = fitz.open(os.path.join(SRC, it["rel"]))
        it["pages"] = d.page_count
        d.close()

    items = []
    for it in inv:
        f = it["file"]
        e = {"src": it["rel"], "pages": it["pages"], "size": it["size"]}
        m = re.match(r"軟體世界追蹤報導-(創刊號|第(\d+)號)(?:\[(\d{4})-(\d{2})-(\d{2})\])?", f)
        if m:
            idx = 0 if m.group(1) == "創刊號" else int(m.group(2))
            e.update(id=f"track-{idx:02d}", series="track", type="追踪报道",
                     title=("追踪报道·创刊号" if idx == 0 else f"追踪报道·第{idx}号"),
                     year=1988,
                     date=(f"{m.group(3)}-{m.group(4)}" if m.group(3) else "1988"),
                     sort=(1988, idx))
            items.append(e)
            continue
        if "資訊月特報" in f:
            e.update(id="special-itmonth", series="special", type="特报",
                     title="资讯月特报", year=None, date=None, sort=(1988, 99))
            items.append(e)
            continue
        m = re.match(r"軟體世界 - 第(\d+)(?:,(\d+))?期(試刊)?\[(\d{4})-(\d{2})(?:,(\d{2}))?\]", f)
        if m:
            n1, n2, trial, y, mo1, mo2 = m.groups()
            n1, y = int(n1), int(y)
            if n2:
                iid, title, date = f"sw-{n1:03d}-{int(n2):03d}", f"第{n1}·{n2}期（合刊）", f"{y}-{mo1}~{mo2}"
            else:
                iid, title, date = f"sw-{n1:03d}", f"第{n1}期", f"{y}-{mo1}"
            if trial:
                title += "（试刊）"
            e.update(id=iid, series="main", type="正刊", issue=n1, title=title,
                     year=y, date=date, sort=(y, n1))
            items.append(e)
            continue
        m = re.match(r"(\d+)(合刊)?(攻略別冊|線上期刊室)?(纪念号)?\.pdf", f)
        if m:
            n, combined, supp, memorial = m.groups()
            n = int(n)
            yy, mm = month_of_issue(n)
            if supp == "攻略別冊":
                iid, typ, title = f"sw-{n:03d}-guide", "攻略别册", f"第{n}期·攻略别册"
            elif supp == "線上期刊室":
                iid, typ, title = f"sw-{n:03d}-online", "线上期刊室", f"第{n}期·线上期刊室"
            else:
                iid, typ, title = f"sw-{n:03d}", "正刊", f"第{n}期"
                if combined:
                    title += "（合刊）"
                if memorial:
                    title += "（纪念号）"
                if n == 201:
                    title += "（复刊·终刊）"
            e.update(id=iid, series="main" if not supp else "supplement", type=typ,
                     issue=n, title=title, year=it["year"],
                     date=f"{yy}-{mm:02d}", sort=(it["year"] or 9999, n, 1 if supp else 0))
            items.append(e)
            continue
        print("UNPARSED:", f)

    for e in items:
        if e["id"] == "sw-083":
            e["note"] = "扫描不全（仅8页）"
    items.sort(key=lambda x: x["sort"])
    out = os.path.join(WORK, "issues.json")
    json.dump(items, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{out}: {len(items)} items")


if __name__ == "__main__":
    main()
