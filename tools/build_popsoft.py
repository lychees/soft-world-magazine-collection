#!/usr/bin/env python3
"""从 IA 元数据构建大众软件目录 -> _work/popsoft.json（含 scandata 页数）。"""
import json, os, re, subprocess
from concurrent.futures import ThreadPoolExecutor

IA_ID = "popsoft-magazine_202403"
WORK = os.path.dirname(os.path.abspath(__file__))

def main():
    d = json.load(open(os.path.join(WORK, "ia_meta.json"), encoding="utf-8"))
    mains = {}   # path -> size
    for f in d["files"]:
        n = f["name"]
        if f.get("format") != "Image Container PDF":
            continue
        m = re.match(r"(19|20)\d{2}/", n)
        if m or n.startswith("攻略/"):
            mains[n] = int(f.get("size", 0))

    items = []
    for path, size in mains.items():
        base = os.path.basename(path)[:-4]  # strip .pdf
        if path.startswith("攻略/"):
            title = base.replace("大众软件：", "").replace("大众软件:", "")
            items.append({"id": f"ps-guide-{len([i for i in items if i['series']=='guide'])+1:02d}",
                          "series": "guide", "type": "攻略别册", "title": f"攻略·{title}",
                          "year": None, "date": None, "size": size, "path": path})
            continue
        m = re.match(r"大众软件-(\d{4})年(\d{2})月(合刊)?([ABC])?$", base)
        if not m:
            print("UNPARSED:", path)
            continue
        y, mo, combined, abc = int(m.group(1)), int(m.group(2)), m.group(3), m.group(4)
        suffix = {"A": "上", "B": "下", "C": "中"}.get(abc or "", "")
        iid = f"ps-{y}-{mo:02d}{abc or ''}"
        title = f"{y}年{mo}月" + (f"{suffix}刊" if suffix else "刊") + ("（合刊）" if combined else "")
        items.append({"id": iid, "series": "main", "type": "正刊", "title": title,
                      "year": y, "date": f"{y}-{mo:02d}" + (f" {abc}" if abc else ""),
                      "size": size, "path": path,
                      "sort": (y, mo, abc or "")})

    items.sort(key=lambda x: x.get("sort", (9999, x["id"])))
    print("items:", len(items))

    def leaf_count(it):
        sd = it["path"][:-4] + "_scandata.xml"
        url = f"https://archive.org/download/{IA_ID}/{sd}"
        try:
            r = subprocess.run(
                ["curl", "-sL", "--max-time", "30", "-r", "0-2047", url],
                capture_output=True, text=True, timeout=40)
            m = re.search(r"<leafCount>(\d+)</leafCount>", r.stdout)
            return int(m.group(1)) if m else None
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=12) as ex:
        pages = list(ex.map(leaf_count, items))
    miss = 0
    for it, p in zip(items, pages):
        it["pages"] = p
        if p is None:
            miss += 1
            print("no pages:", it["id"])
    print("leafCount misses:", miss)

    out = os.path.join(WORK, "popsoft.json")
    json.dump(items, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(out, len(items))

if __name__ == "__main__":
    main()
