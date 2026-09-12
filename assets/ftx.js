/* 軟體世界全文检索：加载分片索引，按页查找匹配并给出带页码跳转的结果 */
(function () {
  var index = null, manifest = null, issueMeta = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function loadMeta() {
    if (issueMeta) return Promise.resolve(issueMeta);
    return fetch("data/issues.json").then(function (r) { return r.json(); }).then(function (d) {
      issueMeta = {};
      d.forEach(function (it) { issueMeta[it.id] = it; });
      return issueMeta;
    });
  }

  function loadIndex(onShard) {
    if (index) return Promise.resolve(index);
    return fetch("data/ftx-index.json").then(function (r) { return r.json(); }).then(function (m) {
      manifest = m;
      index = {};
      var chain = Promise.resolve();
      m.collections.forEach(function (c) {
        chain = chain.then(function () {
          return fetch("data/ftx/" + c.shard).then(function (r) { return r.json(); }).then(function (d) {
            Object.assign(index, d);
            onShard(c.shard);
          });
        });
      });
      return chain.then(function () { return index; });
    });
  }

  function snippet(text, terms, len) {
    var t = text.replace(/\s+/g, " ");
    var low = t.toLowerCase();
    var pos = -1;
    for (var i = 0; i < terms.length; i++) {
      pos = low.indexOf(terms[i]);
      if (pos >= 0) break;
    }
    if (pos < 0) pos = 0;
    var start = Math.max(0, pos - Math.floor(len / 3));
    var s = t.slice(start, start + len);
    if (start > 0) s = "…" + s;
    if (start + len < t.length) s += "…";
    terms.forEach(function (term) {
      var re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      s = s.replace(re, function (m) { return "<mark>" + m + "</mark>"; });
    });
    return s;
  }

  function doSearch(q) {
    var terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length || !index) return [];
    var out = [];
    Object.keys(index).forEach(function (iid) {
      var pages = index[iid];
      for (var i = 0; i < pages.length; i++) {
        var low = pages[i].toLowerCase();
        var ok = true;
        for (var t = 0; t < terms.length; t++) {
          if (low.indexOf(terms[t]) < 0) { ok = false; break; }
        }
        if (ok) out.push({ id: iid, page: i + 1, text: pages[i] });
        if (out.length >= 400) return out;
      }
    });
    return out;
  }

  function render(q) {
    var box = $("results");
    box.textContent = "";
    var terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var hits = doSearch(q);
    if (!hits.length) {
      box.appendChild(el("p", "ynote", "没有找到匹配内容。"));
      return;
    }
    // 按册目分组
    var byIssue = {};
    hits.forEach(function (h) {
      (byIssue[h.id] = byIssue[h.id] || []).push(h);
    });
    var count = el("p", "ynote", "共 " + hits.length + " 处匹配，" + Object.keys(byIssue).length + " 册。");
    box.appendChild(count);
    Object.keys(byIssue).forEach(function (iid) {
      var meta = issueMeta[iid] || { title: iid };
      var sec = el("div", "ftx-issue");
      var head = el("div", "ftx-issue-head");
      var img = new Image();
      img.loading = "lazy";
      img.src = "covers/" + iid + ".jpg";
      img.alt = meta.title;
      head.appendChild(img);
      var tt = el("div", "ftx-issue-title");
      tt.appendChild(el("b", null, meta.title + (meta.date ? "（" + meta.date + "）" : "")));
      head.appendChild(tt);
      sec.appendChild(head);
      var list = el("div", "ftx-pages");
      byIssue[iid].slice(0, 12).forEach(function (h) {
        var a = el("a", "ftx-page");
        a.href = "reader.html?id=" + encodeURIComponent(iid) + "&page=" + h.page;
        a.innerHTML = "<b>P." + h.page + "</b> " + snippet(h.text, terms, 90);
        list.appendChild(a);
      });
      if (byIssue[iid].length > 12) {
        list.appendChild(el("div", "ynote", "……另有 " + (byIssue[iid].length - 12) + " 处"));
      }
      sec.appendChild(list);
      box.appendChild(sec);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var input = $("q");
    var btn = $("go");
    var st = $("ftx-status");
    function go() {
      var q = input.value.trim();
      if (!q) return;
      st.textContent = "正在加载检索索引……";
      loadMeta().then(function () {
        return loadIndex(function () {
          st.textContent = "正在加载检索索引……（已加载 " + Object.keys(index).length + " 册，继续检索中）";
          render(q);
        });
      }).then(function () {
        st.textContent = "";
        render(q);
      }).catch(function (e) {
        st.textContent = "索引加载失败：" + e;
      });
    }
    btn.addEventListener("click", go);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") go();
    });
    var q0 = new URLSearchParams(location.search).get("q");
    if (q0) { input.value = q0; go(); }
  });
})();
