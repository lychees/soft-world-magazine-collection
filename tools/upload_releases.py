#!/usr/bin/env python3
"""将全部原版 PDF 上传到 GitHub Release（tag: magazines），经 API 直传确保资源名为 <id>.pdf。
可断点续传：已存在且体积一致的资源自动跳过。

用法:  SW_SRC="..." python tools/upload_releases.py
依赖:  gh CLI（已登录）
"""
import json, os, subprocess, time

SRC = os.environ.get("SW_SRC", "Y:/baiduyun/软体世界（229本-不全-已结刊）")
REPO = "lychees/soft-world-magazine-collection"
TAG = "magazines"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "_work")
LOG = os.path.join(WORK, "upload.log")


def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def existing_assets(rel_id):
    assets = {}
    page = 1
    while True:
        r = subprocess.run(
            ["gh", "api", f"repos/{REPO}/releases/{rel_id}/assets?per_page=100&page={page}",
             "--jq", '.[] | .name + " " + (.size|tostring)'],
            capture_output=True, text=True)
        lines = [l for l in r.stdout.strip().splitlines() if l]
        if not lines:
            break
        for l in lines:
            name, size = l.rsplit(" ", 1)
            assets[name] = int(size)
        if len(lines) < 100:
            break
        page += 1
    return assets


def main():
    items = json.load(open(os.path.join(WORK, "issues.json"), encoding="utf-8"))
    total = len(items)
    rel_id = subprocess.run(
        ["gh", "api", f"repos/{REPO}/releases/tags/{TAG}", "--jq", ".id"],
        capture_output=True, text=True).stdout.strip()
    assets = existing_assets(rel_id)
    log(f"start: {total} files, {len(assets)} assets already uploaded")
    done = skipped = failed = 0
    for i, it in enumerate(items, 1):
        name = it["id"] + ".pdf"
        path = os.path.join(SRC, it["src"])
        size = os.path.getsize(path)
        if assets.get(name) == size:
            skipped += 1
            continue
        ok = False
        for attempt in range(1, 5):
            t0 = time.time()
            r = subprocess.run(
                ["gh", "api", "-X", "POST",
                 f"https://uploads.github.com/repos/{REPO}/releases/{rel_id}/assets?name={name}",
                 "-H", "Content-Type: application/octet-stream",
                 "--input", path, "--jq", ".name"],
                capture_output=True, text=True)
            if r.returncode == 0:
                dt = time.time() - t0
                done += 1
                log(f"[{i}/{total}] {name} {size / 1e6:.0f}MB ok in {dt:.0f}s "
                    f"({size / 1e6 / dt:.1f}MB/s) done={done} skip={skipped} fail={failed}")
                ok = True
                break
            err = (r.stderr or r.stdout).strip().replace("\n", " ")[:200]
            if "already_exists" in err:
                old = subprocess.run(
                    ["gh", "api", f"repos/{REPO}/releases/{rel_id}/assets?per_page=100",
                     "--paginate", "--jq", f'.[] | select(.name == "{name}") | .id'],
                    capture_output=True, text=True).stdout.split()
                for aid in old:
                    subprocess.run(["gh", "api", "-X", "DELETE",
                                    f"repos/{REPO}/releases/assets/{aid}"],
                                   capture_output=True, text=True)
                continue
            log(f"[{i}/{total}] {name} attempt {attempt} failed: {err}")
            time.sleep(10 * attempt)
        if not ok:
            failed += 1
            log(f"[{i}/{total}] {name} GAVE UP")
    log(f"FINISHED done={done} skipped={skipped} failed={failed}")


if __name__ == "__main__":
    main()
