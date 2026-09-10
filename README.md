# 软体世界杂志收藏 · SoftWorld Magazine Archive

《軟體世界》（1989–2006，智冠科技）杂志文献资料整理与在线阅读网站。
另设姐妹馆藏《大众软件》（1995–2016）文献资料页。

**在线访问**：https://lychees.github.io/soft-world-magazine-collection/

## 内容

### 《軟體世界》

- 正刊第 0 期（试刊，1989-03）至第 201 期（2006，复刊·终刊），**无缺失**
- 前身刊物《軟體世界追蹤》第二號（1987-08-25）与《軟體世界追蹤報導》第 1–5 号（1988），另存杂志创刊号另版扫描一册
- 攻略别册 3 册、线上期刊室 24 册、资讯月特报 1 册
- 共 **232 册 / 约 49,000 页 / 21 GB** 扫描件（第 81、83 完整、151 期由 [archive.org](https://archive.org/details/soft-world-magazine-collection) 藏品补全）

### 《大众软件》（[popsoft.html](https://lychees.github.io/soft-world-magazine-collection/popsoft.html)）

- 1995–2016 年正刊 495 册、增刊·特刊 12 册、攻略别册 11 册，共 **518 册**
- 扫描文件由 [archive.org](https://archive.org/details/popsoft-magazine_202403) 托管，站内逐页图片在线阅读

## 在线阅读与下载

- **全部 232 册均可在线阅读**：81 册（1988–1994 为主）为站内重压缩版（GitHub Pages 同源加载），其余经 archive.org 页面图片逐页阅读
- 全部 232 册原版扫描 PDF 见 [Release · magazines](https://github.com/lychees/soft-world-magazine-collection/releases/tag/magazines)，文件名与 `data/issues.json` 中的 `id` 对应（`<id>.pdf`）
- 《大众软件》518 册全部支持在线阅读（archive.org 页面图片），原版 PDF 经 archive.org 下载

## 站点结构

```
index.html          首页（杂志百科、编年、馆藏目录）
popsoft.html        《大众软件》馆藏目录
reader.html         軟體世界在线阅读器（PDF.js，?id=<期号>）
popsoft-reader.html 大众软件在线阅读器（archive.org 页面图片，?id=<id>）
about.html          关于与版权说明
assets/             样式、脚本、本地化的 PDF.js
data/issues.json    軟體世界馆藏元数据
data/popsoft.json   大众软件馆藏元数据
covers/<id>.jpg     軟體世界封面缩略图（229 册）
covers-popsoft/     大众软件封面缩略图（518 册）
pdfs/<id>.pdf       軟體世界在线阅读版（82 册）
tools/              馆藏整理与生成脚本
```

## 版权

杂志内容版权归智冠科技（Soft-World International）及相关权利人所有。
本项目为非营利的历史文献保存与整理，仅供学习研究使用。
「杂志百科」内容整理自维基百科条目「軟體世界」，依 CC BY-SA 4.0 许可使用。
