/* 册目详情页：?col=<馆藏>&id=<册目> */
(function () {
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtSize(bytes) {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " GB";
    return Math.round(bytes / 1e6) + " MB";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var q = new URLSearchParams(location.search);
    var colKey = q.get("col") || "sw";
    var id = q.get("id") || "";
    var col = window.COLLS.find(function (c) { return c.key === colKey; }) || window.COLLS[0];
    fetch(col.data).then(function (r) { return r.json(); }).then(function (data) {
      var idx = data.findIndex(function (x) { return x.id === id; });
      var it = idx >= 0 ? data[idx] : data[0];
      if (idx < 0) idx = 0;

      $("ititle").textContent = it.title;
      document.title = it.title + " · " + col.label + " · 《軟體世界》杂志文献资料库";
      $("cover").src = col.covers + it.id + ".jpg";
      $("cover").alt = it.title + " 封面";
      $("col-label").textContent = col.label;
      $("col-label").href = col.key === "sw" ? "index.html" :
        (col.key === "popsoft" ? "popsoft.html" : col.key + ".html");

      var rows = [];
      if (it.type) rows.push(["类型", it.type]);
      if (it.date) rows.push(["日期", it.date]);
      if (it.issue != null) rows.push(["期号", String(it.issue)]);
      if (it.vol != null) rows.push(["卷号", "Vol." + it.vol]);
      if (it.pages) rows.push(["页数", String(it.pages)]);
      if (it.size) rows.push(["体积", fmtSize(it.size)]);
      if (it.note) rows.push(["备注", it.note]);
      var meta = $("meta");
      rows.forEach(function (r) {
        var dt = el("dt", null, r[0]);
        var dd = el("dd", null, r[1]);
        meta.appendChild(dt);
        meta.appendChild(dd);
      });

      var read = $("read");
      read.href = col.reader(it.id);
      if (window.Progress) {
        var sp = window.Progress.load(colKey, it.id);
        if (sp) read.textContent = "继续阅读 P." + sp + " →";
      }
      var iaId = it.ia_id || (col.key === "sw" ? null : col.data.match(/data\/(\w+)\.json/)[1]);
      if (it.ia_path) {
        $("ia").href = "https://archive.org/download/" + (it.ia_id || "soft-world-magazine-collection") + "/" + encodeURI(it.ia_path);
      } else if (col.key === "sw") {
        $("ia").href = "https://github.com/lychees/soft-world-magazine-collection/releases/download/magazines/" + it.id + ".pdf";
      } else {
        $("ia").href = "https://archive.org/download/" + (it.ia_id || "") + "/" + encodeURI(it.path || "");
      }
      var back = $("back-col");
      back.href = col.key === "sw" ? "index.html#catalog" :
        (col.key === "popsoft" ? "popsoft.html#catalog" : col.key + ".html#catalog");

      // 收藏按钮
      var fb = $("fav");
      function paintFav(on) { fb.textContent = on ? "★ 已在书架" : "♡ 加入书架"; fb.classList.toggle("on", on); }
      paintFav(window.Favs && window.Favs.has(colKey, it.id));
      fb.addEventListener("click", function () {
        paintFav(window.Favs.toggle(colKey, it.id, { title: it.title, date: it.date }));
      });

      // 前后册导航
      var navs = $("neighbors");
      if (idx > 0) {
        var pv = el("a", "btn dl", "← " + data[idx - 1].title);
        pv.href = "issue.html?col=" + colKey + "&id=" + encodeURIComponent(data[idx - 1].id);
        navs.appendChild(pv);
      }
      if (idx < data.length - 1) {
        var nx = el("a", "btn dl", data[idx + 1].title + " →");
        nx.href = "issue.html?col=" + colKey + "&id=" + encodeURIComponent(data[idx + 1].id);
        nx.style.marginLeft = "auto";
        navs.appendChild(nx);
      }
    }).catch(function (e) {
      $("ititle").textContent = "加载失败：" + e;
    });
  });
})();
