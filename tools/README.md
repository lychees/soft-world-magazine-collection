# 馆藏整理管线

从原始扫描目录重建站点全部数据的流程（Windows + Python 3.11+）：

```bash
pip install PyMuPDF Pillow
export SW_SRC="Y:/baiduyun/软体世界（229本-不全-已结刊）"   # 原始收藏目录

python tools/build_inventory.py   # 1. 扫描目录、解析元数据 -> _work/issues.json
python tools/make_covers.py       # 2. 渲染封面 -> covers/<id>.jpg
python tools/make_reading.py      # 3. 生成在线阅读版 -> pdfs/<id>.pdf（受体积预算限制）
python tools/build_data.py        # 4. 合并 -> data/issues.json
python tools/upload_releases.py   # 5. 上传原版到 GitHub Release（需 gh CLI）
```

- 阅读版参数可用环境变量调整：`SW_DPI`（默认 85）、`SW_QUALITY`（默认 44）、`SW_BUDGET_MB`（默认 920）
- 所有脚本均可重复运行，已生成的产物自动跳过
- 中间产物保存在 `_work/`（已被 .gitignore 排除）
