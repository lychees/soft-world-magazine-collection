/* 全站搜索：跨全部馆藏按期号/标题检索（首页姐妹馆藏区块内） */
(function () {
  var COLS = [
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
    { key: "koudaimi", label: "口袋迷", data: "data/koudaimi.json", covers: "covers-koudaimi/", reader: function (id) { return "ia-reader.html?col=koudaimi&id=" + encodeURIComponent(id); } },
    { key: "pkmplayer", label: "口袋玩家", data: "data/pkmplayer.json", covers: "covers-pkmplayer/", reader: function (id) { return "ia-reader.html?col=pkmplayer&id=" + encodeURIComponent(id); } },
    { key: "cfan", label: "电脑爱好者", data: "data/cfan.json", covers: "covers-cfan/", reader: function (id) { return "ia-reader.html?col=cfan&id=" + encodeURIComponent(id); } },
    { key: "mic", label: "微型计算机", data: "data/mic.json", covers: "covers-mic/", reader: function (id) { return "ia-reader.html?col=mic&id=" + encodeURIComponent(id); } }
  ];

  var loaded = null;

  function ensureData() {
    if (loaded) return loaded;
    loaded = Promise.all(COLS.map(function (c) {
      return fetch(c.data).then(function (r) { return r.json(); }).catch(function () { return []; })
        .then(function (items) {
          c.items = items.filter(function (it) { return it.reading !== false; });
        });
    }));
    return loaded;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function search(q) {
    q = q.trim().toLowerCase();
    var out = [];
    COLS.forEach(function (c) {
      (c.items || []).forEach(function (it) {
        var key = (it.title + " " + it.id + " " + (it.date || "") + " " + (it.issue != null ? it.issue : "")).toLowerCase();
        if (key.indexOf(q) >= 0) out.push({ c: c, it: it });
      });
    });
    return out.slice(0, 60);
  }

  function renderResults(box, q) {
    box.textContent = "";
    if (!q.trim()) return;
    var results = search(q);
    if (!results.length) {
      box.appendChild(el("p", "ynote", "没有匹配的册目。"));
      return;
    }
    var grid = el("div", "grid");
    results.forEach(function (r) {
      var c = el("article", "card");
      var cov = el("div", "cov");
      var img = new Image();
      img.loading = "lazy";
      img.alt = r.it.title;
      img.src = r.c.covers + r.it.id + ".jpg";
      cov.appendChild(img);
      cov.appendChild(el("span", "badge", r.c.label));
      c.appendChild(cov);
      var body = el("div", "body");
      body.appendChild(el("div", "t", r.it.title));
      body.appendChild(el("div", "m", (r.it.date || "") + (r.it.pages ? " · " + r.it.pages + " 页" : "")));
      var acts = el("div", "acts");
      var a = el("a", "btn read", "阅读");
      a.href = r.c.reader(r.it.id);
      acts.appendChild(a);
      body.appendChild(acts);
      c.appendChild(body);
      grid.appendChild(c);
    });
    box.appendChild(grid);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("gsearch");
    var box = document.getElementById("gsearch-results");
    if (!input || !box) return;
    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      var q = input.value;
      timer = setTimeout(function () {
        if (!q.trim()) { box.textContent = ""; return; }
        box.textContent = "检索中……";
        ensureData().then(function () { renderResults(box, q); });
      }, 250);
    });
  });
})();
