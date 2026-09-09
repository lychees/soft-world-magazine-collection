#!/usr/bin/env python3
"""合并馆藏元数据与阅读版状态 -> 站点数据 data/issues.json。"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "_work")


def main():
    items = json.load(open(os.path.join(WORK, "issues.json"), encoding="utf-8"))
    reading = set()
    rj = os.path.join(WORK, "reading.json")
    if os.path.exists(rj):
        reading = set(json.load(open(rj, encoding="utf-8")))
    pdfs = os.path.join(ROOT, "pdfs")
    if os.path.isdir(pdfs):
        reading |= {f[:-4] for f in os.listdir(pdfs) if f.endswith(".pdf")}
    for it in items:
        it["reading"] = it["id"] in reading
        it.pop("src", None)
        it.pop("sort", None)
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    with open(os.path.join(ROOT, "data", "issues.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, separators=(",", ":"))
    n = sum(1 for i in items if i["reading"])
    print(f"data/issues.json: {len(items)} items, {n} with online reading")


if __name__ == "__main__":
    main()
