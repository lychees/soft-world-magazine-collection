/* 大众软件在线阅读器：以 archive.org 页面图片（jp2 zip 成员 + &ext=jpg）逐页加载，
   <img> 标签不受 CORS 限制，无需搬运文件。 */
(function () {
  var IA = "https://archive.org/download/popsoft-magazine_202403/";
  var item = null, pageNum = 1, pageCount = 0, fit = "width";

  function $(id) { return document.getElementById(id); }

  function pageUrl(n) {
    var base = item.path.replace(/\.pdf$/i, "");
    var name = base.split("/").pop();
    var outer = base.split("/").map(encodeURIComponent).join("/");
    var leaf = String(n - 1).padStart(4, "0");
    var member = encodeURIComponent(name + "_jp2/" + name + "_" + leaf + ".jp2");
    return IA + outer + "_jp2.zip/" + member + "&ext=jpg";
  }

  function show(n) {
    if (!item || n < 1 || n > pageCount) return;
    pageNum = n;
    $("pg").value = n;
    var img = $("rd-img");
    var st = $("rd-status");
    st.style.display = "";
    st.querySelector(".msg").textContent = "第 " + n + " / " + pageCount + " 页加载中……";
    img.style.display = "none";
    img.src = pageUrl(n);
    // 预取后续两页
    [n + 1, n + 2].forEach(function (k) {
      if (k <= pageCount) { var p = new Image(); p.src = pageUrl(k); }
    });
  }

  function go(d) { show(pageNum + d); }

  document.addEventListener("DOMContentLoaded", function () {
    var img = $("rd-img");
    img.addEventListener("load", function () {
      $("rd-status").style.display = "none";
      img.style.display = "";
    });
    img.addEventListener("error", function () {
      var st = $("rd-status");
      st.style.display = "";
      st.querySelector(".msg").textContent = "第 " + pageNum + " 页加载失败，可尝试下一页或下载原版。";
    });
    img.addEventListener("click", function () { go(1); });

    var id = new URLSearchParams(location.search).get("id") || "";
    fetch("data/popsoft.json").then(function (r) { return r.json(); }).then(function (data) {
      item = data.find(function (x) { return x.id === id; }) || data[0];
      pageCount = item.pages || 0;
      $("rtitle").textContent = "大众软件 " + item.title;
      document.title = "大众软件 " + item.title + " · 《軟體世界》杂志文献资料库";
      $("pgtotal").textContent = "/ " + pageCount;
      $("dl").href = IA + encodeURI(item.path);
      $("ia").href = "https://archive.org/details/popsoft-magazine_202403";
      if (!pageCount) {
        $("rd-status").querySelector(".msg").textContent = "该册缺少页面索引，请下载原版阅读。";
        return;
      }
      show(1);
    }).catch(function (e) {
      $("rd-status").querySelector(".msg").textContent = "数据加载失败：" + e;
    });

    $("prev").addEventListener("click", function () { go(-1); });
    $("next").addEventListener("click", function () { go(1); });
    $("pg").addEventListener("change", function () {
      var n = parseInt($("pg").value, 10);
      if (n >= 1 && n <= pageCount) show(n); else $("pg").value = pageNum;
    });
    $("zoom").addEventListener("click", function () {
      fit = fit === "width" ? "full" : "width";
      img.className = fit === "width" ? "fit-w" : "fit-full";
      $("zoom").textContent = fit === "width" ? "适应宽度" : "原始尺寸";
    });
    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft" || e.key === "PageUp") { go(-1); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { go(1); e.preventDefault(); }
      if (e.key === "Home") show(1);
      if (e.key === "End") show(pageCount);
    });
    var tx = null, stage = $("rd-stage");
    stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (tx == null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      tx = null;
    }, { passive: true });
  });
})();
