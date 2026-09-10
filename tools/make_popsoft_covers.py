#!/usr/bin/env python3
"""从 IA 抓取大众软件各册封面（jp2 首页 -> 400px JPEG）-> covers-popsoft/<id>.jpg"""
import io, json, os, subprocess
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

IA_ID = "popsoft-magazine_202403"
WORK = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(WORK)
OUT = os.path.join(ROOT, "covers-popsoft")
W = 400

def fetch_cover(it):
    from urllib.parse import quote
    dst = os.path.join(OUT, it["id"] + ".jpg")
    if os.path.exists(dst):
        return (it["id"], True, "skip")
    base = it["path"][:-4]          # e.g. 1995/大众软件-1995年08月
    name = base.rsplit("/", 1)[-1]  # e.g. 大众软件-1995年08月
    outer = "/".join(quote(p) for p in base.split("/"))
    member = quote(f"{name}_jp2/{name}_0000.jp2", safe="")
    url = (f"https://archive.org/download/{IA_ID}/{outer}_jp2.zip/"
           f"{member}&ext=jpg")
    try:
        r = subprocess.run(["curl", "-sL", "--max-time", "120", "-o", dst + ".tmp", url],
                           capture_output=True, timeout=130)
        if not os.path.exists(dst + ".tmp") or os.path.getsize(dst + ".tmp") < 10000:
            return (it["id"], False, f"download failed size={os.path.getsize(dst + '.tmp') if os.path.exists(dst + '.tmp') else 0}")
        img = Image.open(dst + ".tmp").convert("RGB")
        h = int(img.height * W / img.width)
        img = img.resize((W, h), Image.LANCZOS)
        img.save(dst, "JPEG", quality=72, optimize=True)
        os.remove(dst + ".tmp")
        return (it["id"], True, f"{os.path.getsize(dst)//1024}KB")
    except Exception as e:
        return (it["id"], False, repr(e))

def main():
    os.makedirs(OUT, exist_ok=True)
    items = json.load(open(os.path.join(WORK, "popsoft.json"), encoding="utf-8"))
    with ThreadPoolExecutor(max_workers=8) as ex:
        for iid, ok, msg in ex.map(fetch_cover, items):
            print(iid, "OK" if ok else "FAIL", msg, flush=True)
    n = len([f for f in os.listdir(OUT) if f.endswith(".jpg")])
    print(f"covers: {n}/{len(items)}")

if __name__ == "__main__":
    main()
