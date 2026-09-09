#!/usr/bin/env python3
"""生成在线阅读版 PDF（逐页重采样 + JPEG 重压缩），按年代顺序在体积预算内收录。

用法:  SW_SRC="..." python tools/make_reading.py
依赖:  PyMuPDF, Pillow
"""
import io, json, os, time

import fitz
from PIL import Image

SRC = os.environ.get("SW_SRC", "Y:/baiduyun/软体世界（229本-不全-已结刊）")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "_work")
OUT = os.path.join(ROOT, "pdfs")

TARGET_DPI = int(os.environ.get("SW_DPI", "85"))
QUALITY = int(os.environ.get("SW_QUALITY", "44"))
BUDGET_MB = int(os.environ.get("SW_BUDGET_MB", "920"))


def recompress(src, dst):
    d = fitz.open(src)
    for pno in range(d.page_count):
        page = d[pno]
        for info in page.get_image_info(xrefs=True):
            bbox = fitz.Rect(info["bbox"])
            if bbox.width <= 0:
                continue
            eff = info["width"] / (bbox.width / 72)
            if eff <= TARGET_DPI * 1.05:
                continue
            scale = TARGET_DPI / eff
            try:
                im = Image.open(io.BytesIO(d.extract_image(info["xref"])["image"]))
            except Exception:
                continue
            im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))),
                           Image.LANCZOS)
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=QUALITY, optimize=True)
            page.replace_image(info["xref"], stream=buf.getvalue())
    d.ez_save(dst, deflate=True, garbage=4)
    d.close()


def group_key(it):
    if it["series"] == "track":
        return (0, it["id"])
    if it["series"] == "special":
        return (1, it["id"])
    if it["series"] == "main":
        return (2, it.get("year") or 9999, it.get("issue") or 0)
    return (3, it.get("year") or 9999, it.get("issue") or 0)


def main():
    os.makedirs(OUT, exist_ok=True)
    items = sorted(json.load(open(os.path.join(WORK, "issues.json"), encoding="utf-8")),
                   key=group_key)
    done = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith(".pdf"))
    total_mb = sum(os.path.getsize(os.path.join(OUT, f)) / 1e6
                   for f in os.listdir(OUT) if f.endswith(".pdf"))
    print(f"existing: {len(done)} files, {total_mb:.0f}MB", flush=True)
    for it in items:
        if it["id"] in done:
            continue
        if total_mb + it["pages"] * 0.27 > BUDGET_MB:
            print(f"SKIP {it['id']}: budget ({total_mb:.0f}/{BUDGET_MB}MB)", flush=True)
            continue
        t0 = time.time()
        dst = os.path.join(OUT, it["id"] + ".pdf")
        try:
            recompress(os.path.join(SRC, it["src"]), dst)
        except Exception as e:
            print(f"ERR {it['id']}: {e!r}", flush=True)
            if os.path.exists(dst):
                os.remove(dst)
            continue
        mb = os.path.getsize(dst) / 1e6
        total_mb += mb
        done.append(it["id"])
        print(f"{it['id']}: {mb:.1f}MB in {time.time() - t0:.0f}s "
              f"(total {total_mb:.0f}/{BUDGET_MB}MB)", flush=True)
    json.dump(done, open(os.path.join(WORK, "reading.json"), "w"), ensure_ascii=False)
    print(f"FINISHED: {len(done)} reading copies, {total_mb:.0f}MB", flush=True)


if __name__ == "__main__":
    main()
