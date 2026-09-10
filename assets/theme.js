/* 深色/浅色主题切换（持久化） */
(function () {
  var KEY = "sw_theme";

  function apply(theme) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = theme === "dark" ? "浅色" : "深色";
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var initial = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  document.addEventListener("DOMContentLoaded", function () {
    apply(initial);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var now = document.documentElement.classList.contains("dark") ? "light" : "dark";
        try { localStorage.setItem(KEY, now); } catch (e) {}
        apply(now);
      });
    }
  });
  // 尽早应用避免闪烁
  if (initial === "dark") document.documentElement.classList.add("dark");
})();
