/* 册内书签：localStorage 按 馆藏+册目 记录书签页码。
   window.Bookmarks = { has(col,id,page), toggle(col,id,page), list(col,id), clear(col,id,page) } */
(function () {
  var KEY = "sw_bookmarks_v1";
  function all() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function save(d) {
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (e) {}
  }
  window.Bookmarks = {
    has: function (col, id, page) {
      var a = all()[col + "/" + id] || [];
      return a.indexOf(page) >= 0;
    },
    toggle: function (col, id, page) {
      var d = all();
      var k = col + "/" + id;
      var a = d[k] || [];
      var i = a.indexOf(page);
      if (i >= 0) a.splice(i, 1);
      else { a.push(page); a.sort(function (x, y) { return x - y; }); }
      if (a.length) d[k] = a; else delete d[k];
      save(d);
      return i < 0;
    },
    list: function (col, id) {
      return (all()[col + "/" + id] || []).slice();
    },
    clear: function (col, id, page) {
      var d = all();
      var k = col + "/" + id;
      var a = (d[k] || []).filter(function (p) { return p !== page; });
      if (a.length) d[k] = a; else delete d[k];
      save(d);
    }
  };
})();
