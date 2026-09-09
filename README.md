# 软体世界杂志收藏 · SoftWorld Magazine Archive

《軟體世界》（1989–2006，智冠科技）杂志文献资料整理与在线阅读网站。

**在线访问**：https://lychees.github.io/soft-world-magazine-collection/

## 内容

- 正刊第 0 期（试刊，1989-03）至第 201 期（2006，复刊·终刊），缺第 81、151 期
- 前身刊物《軟體世界追蹤報導》6 册（1988）
- 攻略别册 3 册、线上期刊室 24 册、资讯月特报 1 册
- 共 **229 册 / 约 49,000 页 / 21 GB** 扫描件

## 在线阅读与下载

- 站内提供 82 册的在线阅读（重压缩版，GitHub Pages 同源加载）：1988–1994 年全部册目（追踪报道、特报及正刊第 0–69 期）及部分小册
- 全部 229 册原版扫描 PDF 见 [Release · magazines](https://github.com/lychees/soft-world-magazine-collection/releases/tag/magazines)，文件名与 `data/issues.json` 中的 `id` 对应（`<id>.pdf`）

## 站点结构

```
index.html          首页（杂志百科、编年、馆藏目录）
reader.html         在线阅读器（PDF.js，?id=<期号>）
about.html          关于与版权说明
assets/             样式、脚本、本地化的 PDF.js
data/issues.json    全部馆藏元数据（期号、日期、页数、体积、是否有阅读版）
covers/<id>.jpg     封面缩略图（全部 229 册）
pdfs/<id>.pdf       在线阅读版（82 册：1988–1994 全部册目及部分小册）
tools/              馆藏整理与生成脚本
```

## 版权

杂志内容版权归智冠科技（Soft-World International）及相关权利人所有。
本项目为非营利的历史文献保存与整理，仅供学习研究使用。
「杂志百科」内容整理自维基百科条目「軟體世界」，依 CC BY-SA 4.0 许可使用。
