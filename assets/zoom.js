/* 缩放记忆：按 馆藏+册目 记住缩放设置。
   window.Zoom = { save(col,id,mode), load(col,id) } */
(function () {
  var KEY = "sw_zoom_v1";
  function all() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  window.Zoom = {
    save: function (col, id, mode) {
      if (!col || !id || !mode) return;
      var d = all();
      d[col + "/" + id] = mode;
      try {
        localStorage.setItem(KEY, JSON.stringify(d));
      } catch (e) {}
    },
    load: function (col, id) {
      return all()[col + "/" + id] || null;
    }
  };
})();
