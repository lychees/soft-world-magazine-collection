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
    var link = el("a");
    link.href = "issue.html?col=" + CFG.readerCol + "&id=" + encodeURIComponent(it.id);
    var img = new Image();
    img.loading = "lazy";
    img.alt = it.title + " 封面";
    img.src = CFG.covers + it.id + ".jpg";
    link.appendChild(img);
    cov.appendChild(link);
    cov.appendChild(el("span", "badge" + (it.reading === false ? " dl" : ""), it.reading === false ? "提供下载" : "在线阅读"));
    if (window.favButton) cov.appendChild(window.favButton(CFG.readerCol, it.id, it));
    c.appendChild(cov);

    var body = el("div", "body");
    body.appendChild(el("div", "t", it.title));
    var meta = [];
    if (it.pages) meta.push(it.pages + " 页");
    meta.push(fmtSize(it.size));
    body.appendChild(el("div", "m", meta.join(" · ")));
    if (it.note) body.appendChild(el("div", "m", it.note));

    var acts = el("div", "acts");
    if (it.reading !== false) {
      var r = el("a", "btn read", "阅读");
      r.href = "ia-reader.html?col=" + CFG.readerCol + "&id=" + encodeURIComponent(it.id);
      if (window.Progress) {
        var sp = window.Progress.load(CFG.readerCol, it.id);
        if (sp) {
          r.textContent = "继续 P." + sp;
          r.title = "上次读到第 " + sp + " 页";
        }
      }
      acts.appendChild(r);
    }
    var d = el("a", "btn dl", it.reading === false ? "下载" : "原版");
    d.href = "https://archive.org/download/" + (it.ia_id || CFG.iaId) + "/" + encodeURI(it.path);
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
    // 大目录滚动分页：先渲染前 3 组，其余滚动到下方再逐组追加
    var rendered = 0;
    var sentinel = el("div", null);
    function renderGroup(g) {
      var sec = el("section", "year-sec");
      sec.id = g.key;
      sec.appendChild(el("h3", null, g.title + "（" + g.items.length + " 册）"));
      if (g.note) sec.appendChild(el("p", "ynote", g.note));
      var grid = el("div", "grid");
      g.items.forEach(function (it) { grid.appendChild(card(it)); });
      sec.appendChild(grid);
      return sec;
    }
    function renderMore() {
      if (!sentinel.parentNode) cat.appendChild(sentinel);
      var batch = 3;
      while (rendered < groups.length && batch-- > 0) {
        cat.insertBefore(renderGroup(groups[rendered]), sentinel);
        rendered++;
      }
      if (rendered >= groups.length && sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
    }
    renderMore();
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) renderMore();
        });
      }, { rootMargin: "400px" });
      io.observe(sentinel);
    }

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
