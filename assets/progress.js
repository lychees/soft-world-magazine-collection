/* 阅读进度记忆：localStorage 按 馆藏+册目 记录页码。
   window.Progress = { save(col,id,page), load(col,id) } */
(function () {
  var KEY = "sw_progress_v1";

  function all() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  window.Progress = {
    save: function (col, id, page) {
      if (!col || !id || !page || page <= 1) {
        if (page <= 1) window.Progress.clear(col, id);
        return;
      }
      var d = all();
      d[col + "/" + id] = { p: page, t: Date.now() };
      try {
        localStorage.setItem(KEY, JSON.stringify(d));
      } catch (e) {}
    },
    load: function (col, id) {
      var v = all()[col + "/" + id];
      return v && v.p > 1 ? v.p : null;
    },
    clear: function (col, id) {
      var d = all();
      delete d[col + "/" + id];
      try {
        localStorage.setItem(KEY, JSON.stringify(d));
      } catch (e) {}
    }
  };
})();
