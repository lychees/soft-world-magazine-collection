/* 目录页逻辑：加载 data/issues.json，渲染统计与按年分组的卡片 */
(function () {
  var DL_BASE = "https://github.com/lychees/soft-world-magazine-collection/releases/download/magazines/";

  var YEAR_NOTES = {
    1988: "《軟體世界追蹤報導》—— 杂志前身刊物，由智冠科技发行。",
    1989: "创刊年：3 月试刊，4 月正式创刊，月刊。",
    1995: "7 月改版，开始附赠游戏试玩 CD，全球发行量提高到 6 万本。",
    1997: "第 94 期为合刊（433 页）。",
    2001: "11 月「軟體世界雜誌」改版重新登場。",
    2004: "10 月官方宣布休刊，其后短暂恢复发行。",
    2005: "12 月第 200 期（纪念号）后停刊。",
    2006: "复刊改以季刊发行，第 201 期后终刊。"
  };

  var TYPE_LABEL = { "正刊": "正刊", "攻略别册": "攻略别册", "线上期刊室": "线上期刊室", "追踪报道": "追踪报道", "特报": "特报" };

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
    c.dataset.key = (it.title + " " + it.id + " " + (it.issue != null ? it.issue : "")).toLowerCase();

    var cov = el("div", "cov");
    var link = el("a");
    link.href = "issue.html?col=sw&id=" + encodeURIComponent(it.id);
    var img = new Image();
    img.loading = "lazy";
    img.alt = it.title + " 封面";
    img.src = "covers/" + it.id + ".jpg";
    link.appendChild(img);
    cov.appendChild(link);
    cov.appendChild(el("span", "badge" + (it.reading || it.ia_path ? "" : " dl"),
                       it.reading || it.ia_path ? "在线阅读" : "提供下载"));
    if (window.favButton) cov.appendChild(window.favButton("sw", it.id, it));
    c.appendChild(cov);

    var body = el("div", "body");
    body.appendChild(el("div", "t", it.title));
    var meta = [];
    if (it.date) meta.push(it.date);
    if (it.pages) meta.push(it.pages + " 页");
    meta.push(fmtSize(it.size));
    body.appendChild(el("div", "m", meta.join(" · ")));
    if (it.note) body.appendChild(el("div", "m", it.note));

    var acts = el("div", "acts");
    if (it.reading || it.ia_path) {
      var r = el("a", "btn read", "阅读");
      r.href = "reader.html?id=" + encodeURIComponent(it.id);
      if (window.Progress) {
        var sp = window.Progress.load("sw", it.id);
        if (sp) {
          r.textContent = "继续 P." + sp;
          r.title = "上次读到第 " + sp + " 页";
          acts.appendChild(r);
        } else {
          acts.appendChild(r);
        }
      } else {
        acts.appendChild(r);
      }
    }
    var d = el("a", "btn dl", it.reading ? "原版" : "下载");
    d.href = DL_BASE + it.id + ".pdf";
    d.title = "下载原版扫描 PDF（" + fmtSize(it.size) + "）";
    acts.appendChild(d);
    body.appendChild(acts);
    c.appendChild(body);
    return c;
  }

  function render(data) {
    // stats
    var totalPages = 0, totalSize = 0, reading = 0;
    data.forEach(function (it) {
      totalPages += it.pages || 0;
      totalSize += it.size || 0;
      if (it.reading || it.ia_path) reading++;
    });
    document.getElementById("st-issues").textContent = data.length;
    document.getElementById("st-pages").textContent = totalPages.toLocaleString();
    document.getElementById("st-reading").textContent = reading;
    document.getElementById("st-size").textContent = (totalSize / 1e9).toFixed(0) + " GB";

    // group
    var groups = [];
    var g1988 = { key: "y1988", title: "1988 · 前身刊物与特报", note: YEAR_NOTES[1988], items: [] };
    data.forEach(function (it) {
      if (it.series === "track" || it.series === "special") { g1988.items.push(it); return; }
      var y = it.year || 0;
      var g = groups.find(function (g) { return g.key === "y" + y; });
      if (!g) { g = { key: "y" + y, title: y + " 年", note: YEAR_NOTES[y] || "", items: [] }; groups.push(g); }
      g.items.push(it);
    });
    if (g1988.items.length) groups.unshift(g1988);
    groups.sort(function (a, b) { return a.key.localeCompare(b.key); });

    // year nav
    var nav = document.getElementById("yearnav");
    groups.forEach(function (g) {
      var a = el("a", null, g.key === "y1988" ? "1988" : g.key.slice(1));
      a.href = "#" + g.key;
      nav.appendChild(a);
    });

    // sections
    var cat = document.getElementById("catalog-list");
    cat.textContent = "";
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
      var batch = 3;
      while (rendered < groups.length && batch-- > 0) {
        cat.insertBefore(renderGroup(groups[rendered]), sentinel);
        rendered++;
      }
      if (rendered < groups.length && !cat.contains(sentinel)) cat.appendChild(sentinel);
      else if (rendered >= groups.length && sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
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

    // filters
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

  fetch("data/issues.json")
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function (e) {
      document.getElementById("catalog-list").textContent = "目录数据加载失败：" + e;
    });
})();
