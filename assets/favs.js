/* 收藏夹（书架）：localStorage 记录收藏的册目。
   window.Favs = { has(col,id), toggle(col,id,meta), list() } */
(function () {
  var KEY = "sw_favs_v1";

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

  window.Favs = {
    has: function (col, id) {
      return !!all()[col + "/" + id];
    },
    toggle: function (col, id, meta) {
      var d = all();
      var k = col + "/" + id;
      if (d[k]) {
        delete d[k];
      } else {
        d[k] = { col: col, id: id, title: (meta && meta.title) || id,
                 date: (meta && meta.date) || "", t: Date.now() };
      }
      save(d);
      return !!d[k];
    },
    remove: function (col, id) {
      var d = all();
      delete d[col + "/" + id];
      save(d);
    },
    list: function () {
      var d = all();
      return Object.keys(d).map(function (k) { return d[k]; })
        .sort(function (a, b) { return b.t - a.t; });
    }
  };
})();
