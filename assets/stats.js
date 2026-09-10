/* 统计页：全部馆藏的数量、页数、体积与年代/类型分布 */
(function () {
  function fmtSize(bytes) {
    if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + " TB";
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " GB";
    return Math.round(bytes / 1e6) + " MB";
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  Promise.all(window.COLLS.map(function (c) {
    return fetch(c.data).then(function (r) { return r.json(); }).catch(function () { return []; })
      .then(function (items) { c.items = items; });
  })).then(function () {
    var totalIssues = 0, totalPages = 0, totalSize = 0;
    var years = {}, types = {};
    var tbody = document.getElementById("col-tbody");
    window.COLLS.forEach(function (c) {
      var issues = c.items.length, pages = 0, size = 0, yrs = [];
      c.items.forEach(function (it) {
        pages += it.pages || 0;
        size += it.size || 0;
        if (it.year) yrs.push(it.year);
        if (it.year) years[it.year] = (years[it.year] || 0) + 1;
        var t = it.type || "正刊";
        types[t] = (types[t] || 0) + 1;
      });
      totalIssues += issues; totalPages += pages; totalSize += size;
      var tr = el("tr");
      tr.appendChild(el("td", null, c.label));
      tr.appendChild(el("td", null, yrs.length ? Math.min.apply(null, yrs) + "–" + Math.max.apply(null, yrs) : "—"));
      tr.appendChild(el("td", "num", String(issues)));
      tr.appendChild(el("td", "num", pages.toLocaleString()));
      tr.appendChild(el("td", "num", fmtSize(size)));
      tbody.appendChild(tr);
    });

    document.getElementById("st-cols").textContent = window.COLLS.length;
    document.getElementById("st-issues").textContent = totalIssues.toLocaleString();
    document.getElementById("st-pages").textContent = totalPages.toLocaleString();
    document.getElementById("st-size").textContent = fmtSize(totalSize);

    // 年代分布
    var ykeys = Object.keys(years).map(Number).sort(function (a, b) { return a - b; });
    var ymax = Math.max.apply(null, ykeys.map(function (y) { return years[y]; }));
    var ybox = document.getElementById("year-chart");
    ykeys.forEach(function (y) {
      var h = Math.max(2, Math.round(years[y] / ymax * 90));
      var bar = el("div", "bar");
      bar.style.height = h + "px";
      bar.title = y + " 年：" + years[y] + " 册";
      var lab = el("span", "bar-lab", String(y).slice(2));
      var col = el("div", "bar-col");
      col.appendChild(bar);
      col.appendChild(lab);
      ybox.appendChild(col);
    });

    // 类型分布
    var tkeys = Object.keys(types).sort(function (a, b) { return types[b] - types[a]; });
    var tbox = document.getElementById("type-chart");
    tkeys.forEach(function (t) {
      var row = el("div", "trow");
      row.appendChild(el("span", "tname", t));
      var bar = el("div", "bar-h");
      bar.style.width = Math.max(2, Math.round(types[t] / tkeys.reduce(function (m, k) { return Math.max(m, types[k]); }, 1) * 70)) + "%";
      row.appendChild(bar);
      row.appendChild(el("span", "tnum", String(types[t])));
      tbox.appendChild(row);
    });
  });
})();
