#!/usr/bin/env python3
"""为全部馆藏生成封面缩略图 -> covers/<id>.jpg。

用法:  SW_SRC="..." python tools/make_covers.py
依赖:  PyMuPDF, Pillow
"""
import io, json, os

import fitz
from PIL import Image

SRC = os.environ.get("SW_SRC", "Y:/baiduyun/软体世界（229本-不全-已结刊）")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "_work")
OUT = os.path.join(ROOT, "covers")
WIDTH = 400


def main():
    os.makedirs(OUT, exist_ok=True)
    items = json.load(open(os.path.join(WORK, "issues.json"), encoding="utf-8"))
    ok = fail = 0
    for it in items:
        dst = os.path.join(OUT, it["id"] + ".jpg")
        if os.path.exists(dst):
            ok += 1
            continue
        try:
            d = fitz.open(os.path.join(SRC, it["src"]))
            p = d[0]
            zoom = WIDTH / p.rect.width
            pix = p.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
            img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
            img.save(dst, "JPEG", quality=72, optimize=True)
            d.close()
            ok += 1
        except Exception as e:
            fail += 1
            print("ERR", it["id"], repr(e))
    print(f"covers ok={ok} fail={fail}")


if __name__ == "__main__":
    main()
