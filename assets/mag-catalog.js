/* 通用杂志目录页：由页面内 window.MAGCAT 配置驱动（zjimi / koudaimi 等）。
   配置: { data, covers, readerCol, groupOf(it) -> {key,title,note}, types:[...] } */
(function () {
  var CFG = window.MAGCAT;
  if (!CFG) return;

  function fmtSize(bytes) {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " GB";
    return Math.round(bytes / 1e6) + " MB";
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function card(it) {
    var c = el("article", "card");
    c.dataset.type = it.type;
    c.dataset.key = (it.title + " " + it.id + " " + (it.note || "")).toLowerCase();

    var cov = el("div", "cov");
    var img = new Image();
    img.loading = "lazy";
    img.alt = it.title + " 封面";
    img.src = CFG.covers + it.id + ".jpg";
    cov.appendChild(img);
    cov.appendChild(el("span", "badge", "在线阅读"));
    c.appendChild(cov);

    var body = el("div", "body");
    body.appendChild(el("div", "t", it.title));
    var meta = [];
    if (it.pages) meta.push(it.pages + " 页");
    meta.push(fmtSize(it.size));
    body.appendChild(el("div", "m", meta.join(" · ")));
    if (it.note) body.appendChild(el("div", "m", it.note));

    var acts = el("div", "acts");
    var r = el("a", "btn read", "阅读");
    r.href = "ia-reader.html?col=" + CFG.readerCol + "&id=" + encodeURIComponent(it.id);
    acts.appendChild(r);
    var d = el("a", "btn dl", "原版");
    d.href = "https://archive.org/download/" + CFG.iaId + "/" + encodeURI(it.path);
    d.title = "从 archive.org 下载 PDF（" + fmtSize(it.size) + "）";
    d.target = "_blank";
    d.rel = "noopener";
    acts.appendChild(d);
    body.appendChild(acts);
    c.appendChild(body);
    return c;
  }

  function render(data) {
    var totalPages = 0, totalSize = 0;
    data.forEach(function (it) { totalPages += it.pages || 0; totalSize += it.size || 0; });
    document.getElementById("st-issues").textContent = data.length;
    document.getElementById("st-pages").textContent = totalPages.toLocaleString();
    document.getElementById("st-size").textContent = (totalSize / 1e9).toFixed(0) + " GB";

    var groups = [];
    data.forEach(function (it) {
      var gi = CFG.groupOf(it);
      var g = groups.find(function (g) { return g.key === gi.key; });
      if (!g) { g = { key: gi.key, title: gi.title, note: gi.note || "", items: [] }; groups.push(g); }
      g.items.push(it);
    });
    groups.sort(function (a, b) { return a.key.localeCompare(b.key, undefined, { numeric: true }); });

    var nav = document.getElementById("yearnav");
    groups.forEach(function (g) {
      var a = el("a", null, g.short || g.title);
      a.href = "#" + g.key;
      nav.appendChild(a);
    });

    var cat = document.getElementById("catalog-list");
    cat.textContent = "";
    groups.forEach(function (g) {
      var sec = el("section", "year-sec");
      sec.id = g.key;
      sec.appendChild(el("h3", null, g.title + "（" + g.items.length + " 册）"));
      if (g.note) sec.appendChild(el("p", "ynote", g.note));
      var grid = el("div", "grid");
      g.items.forEach(function (it) { grid.appendChild(card(it)); });
      sec.appendChild(grid);
      cat.appendChild(sec);
    });

    var activeType = "全部", query = "";
    function apply() {
      document.querySelectorAll(".card").forEach(function (c) {
        var okT = activeType === "全部" || c.dataset.type === activeType;
        var okQ = !query || c.dataset.key.indexOf(query) >= 0;
        c.style.display = okT && okQ ? "" : "none";
      });
      document.querySelectorAll(".year-sec").forEach(function (s) {
        var any = Array.prototype.some.call(s.querySelectorAll(".card"), function (c) { return c.style.display !== "none"; });
        s.style.display = any ? "" : "none";
      });
    }
    document.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("on"); });
        chip.classList.add("on");
        activeType = chip.dataset.type;
        apply();
      });
    });
    var search = document.getElementById("search");
    search.addEventListener("input", function () {
      query = search.value.trim().toLowerCase();
      apply();
    });
  }

  fetch(CFG.data)
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function (e) {
      document.getElementById("catalog-list").textContent = "目录数据加载失败：" + e;
    });
})();
