/* 全部馆藏配置（供全站搜索/书架/目录共用） */
window.COLLS = [
  { key: "sw", label: "軟體世界", data: "data/issues.json", covers: "covers/", reader: function (id) { return "reader.html?id=" + encodeURIComponent(id); } },
  { key: "popsoft", label: "大众软件", data: "data/popsoft.json", covers: "covers-popsoft/", reader: function (id) { return "ia-reader.html?col=popsoft&id=" + encodeURIComponent(id); } },
  { key: "dianruan", label: "电子游戏软件", data: "data/dianruan.json", covers: "covers-dianruan/", reader: function (id) { return "ia-reader.html?col=dianruan&id=" + encodeURIComponent(id); } },
  { key: "jiayou", label: "家用电脑与游戏机", data: "data/jiayou.json", covers: "covers-jiayou/", reader: function (id) { return "ia-reader.html?col=jiayou&id=" + encodeURIComponent(id); } },
  { key: "diandian", label: "电子游戏与电脑游戏", data: "data/diandian.json", covers: "covers-diandian/", reader: function (id) { return "ia-reader.html?col=diandian&id=" + encodeURIComponent(id); } },
  { key: "ucg", label: "游戏机实用技术", data: "data/ucg.json", covers: "covers-ucg/", reader: function (id) { return "ia-reader.html?col=ucg&id=" + encodeURIComponent(id); } },
  { key: "zjimi", label: "掌机迷", data: "data/zjimi.json", covers: "covers-zjimi/", reader: function (id) { return "ia-reader.html?col=zjimi&id=" + encodeURIComponent(id); } },
  { key: "gameday", label: "游戏日", data: "data/gameday.json", covers: "covers-gameday/", reader: function (id) { return "ia-reader.html?col=gameday&id=" + encodeURIComponent(id); } },
  { key: "softstar", label: "軟體之星", data: "data/softstar.json", covers: "covers-softstar/", reader: function (id) { return "ia-reader.html?col=softstar&id=" + encodeURIComponent(id); } },
  { key: "zhangjiwang", label: "掌机王", data: "data/zhangjiwang.json", covers: "covers-zhangjiwang/", reader: function (id) { return "ia-reader.html?col=zhangjiwang&id=" + encodeURIComponent(id); } },
  { key: "pkmplayer", label: "口袋玩家", data: "data/pkmplayer.json", covers: "covers-pkmplayer/", reader: function (id) { return "ia-reader.html?col=pkmplayer&id=" + encodeURIComponent(id); } },
  { key: "cfan", label: "电脑爱好者", data: "data/cfan.json", covers: "covers-cfan/", reader: function (id) { return "ia-reader.html?col=cfan&id=" + encodeURIComponent(id); } },
  { key: "mic", label: "微型计算机", data: "data/mic.json", covers: "covers-mic/", reader: function (id) { return "ia-reader.html?col=mic&id=" + encodeURIComponent(id); } },
  { key: "koudaimi", label: "口袋迷", data: "data/koudaimi.json", covers: "covers-koudaimi/", reader: function (id) { return "ia-reader.html?col=koudaimi&id=" + encodeURIComponent(id); } }
];

/* 收藏按钮工厂：在卡片封面上加 ♡/★ 切换 */
window.favButton = function (col, id, meta) {
  var b = document.createElement("button");
  b.className = "fav-btn";
  b.type = "button";
  b.title = "收藏到书架";
  function paint(on) {
    b.textContent = on ? "★" : "♡";
    b.classList.toggle("on", on);
    b.title = on ? "移出书架" : "收藏到书架";
  }
  paint(window.Favs.has(col, id));
  b.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    paint(window.Favs.toggle(col, id, meta));
  });
  return b;
};
