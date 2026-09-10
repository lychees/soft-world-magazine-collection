/* 通用 archive.org 图片阅读器：?col=<馆藏>&id=<册目>。
   通过 <img> 逐页加载 IA 节点 view_archive 图片，不受 CORS 限制。 */
(function () {
  var COLLECTIONS = {
    popsoft: {
      label: "大众软件",
      data: "data/popsoft.json",
      back: "popsoft.html",
      iaId: "popsoft-magazine_202403",
      node: "https://ia801608.us.archive.org/view_archive.php",
      dir: "/0/items/popsoft-magazine_202403/",
      iaPage: "https://archive.org/details/popsoft-magazine_202403"
    },
    zjimi: {
      label: "掌机迷",
      data: "data/zjimi.json",
      back: "zjimi.html",
      iaId: "pocketgamer",
      node: "https://ia800402.us.archive.org/view_archive.php",
      dir: "/35/items/pocketgamer/",
      iaPage: "https://archive.org/details/pocketgamer"
    },
    koudaimi: {
      label: "口袋迷",
      data: "data/koudaimi.json",
      back: "koudaimi.html",
      iaId: "gamebooks_mhsg",
      node: "https://ia600500.us.archive.org/view_archive.php",
      dir: "/24/items/gamebooks_mhsg/",
      iaPage: "https://archive.org/details/gamebooks_mhsg"
    },
    dianruan: { label: "电子游戏软件", data: "data/dianruan.json", back: "dianruan.html",
      iaPage: "https://archive.org/details/gamesoftware-magazine-1994-2001" },
    diandian: { label: "电子游戏与电脑游戏", data: "data/diandian.json", back: "diandian.html",
      iaPage: "https://archive.org/details/video_game_and_computer_game" },
    jiayou: { label: "家用电脑与游戏机", data: "data/jiayou.json", back: "jiayou.html",
      iaPage: "https://archive.org/details/jiayou-magazine" },
    ucg: { label: "游戏机实用技术", data: "data/ucg.json", back: "ucg.html",
      iaPage: "https://archive.org/details/UCG-2011" },
    gameday: { label: "游戏日", data: "data/gameday.json", back: "gameday.html",
      iaPage: "https://archive.org/details/gd-2005" },
    softstar: { label: "軟體之星", data: "data/softstar.json", back: "softstar.html",
      iaPage: "https://archive.org/details/softstarmagazine" },
    zhangjiwang: { label: "掌机王", data: "data/zhangjiwang.json", back: "zhangjiwang.html",
      iaPage: "https://archive.org/details/king-of-pocketgames-magazine" }
  };

  var col = null, item = null, pageNum = 1, pageCount = 0, fit = "width";

  function $(id) { return document.getElementById(id); }

  function pageUrl(n, variant) {
    var base = item.path.replace(/\.pdf$/i, "");
    var name = base.split("/").pop();
    var outer = base.split("/").map(encodeURIComponent).join("/");
    var leaf = String(n - 1).padStart(4, "0");
    var member = encodeURIComponent(name + "_jp2/" + name + "_" + leaf + ".jp2");
    var iaId = item.ia_id || col.iaId;
    if (variant === "node") {
      var node = item.node ? "https://" + item.node + "/view_archive.php" : col.node;
      var dir = item.dir || col.dir;
      return node + "?archive=" + dir + outer + "_jp2.zip&file=" + member + "&ext=jpg";
    }
    return "https://archive.org/download/" + iaId + "/" + outer + "_jp2.zip/" + member + "&ext=jpg";
  }

  var urlVariant = "redirect";

  function show(n) {
    if (!item || n < 1 || n > pageCount) return;
    pageNum = n;
    $("pg").value = n;
    var img = $("rd-img");
    var st = $("rd-status");
    st.style.display = "";
    st.querySelector(".msg").textContent = "第 " + n + " / " + pageCount + " 页加载中……";
    img.style.display = "none";
    img.dataset.tried = "";
    img.src = pageUrl(n, urlVariant);
    [n + 1, n + 2].forEach(function (k) {
      if (k <= pageCount) { var p = new Image(); p.src = pageUrl(k, urlVariant); }
    });
  }

  function go(d) {
    var n = pageNum + d;
    if (n < 1 || n > pageCount) return;
    window.flipGo($("flip-wrap"), d, snap, function () { show(n); });
  }

  function snap() {
    var img = $("rd-img");
    if (!img || img.style.display === "none" || !img.naturalWidth) return null;
    var im = new Image();
    im.src = img.src;
    im.style.width = img.getBoundingClientRect().width + "px";
    im.style.height = "auto";
    return im;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var img = $("rd-img");
    img.addEventListener("load", function () {
      $("rd-status").style.display = "none";
      img.style.display = "";
      img.classList.remove("flip-enter");
      void img.offsetWidth;
      img.classList.add("flip-enter");
    });
    img.addEventListener("error", function () {
      // 先试 download 重定向，失败后换节点直连再试一次
      if (urlVariant === "redirect" && !img.dataset.tried) {
        img.dataset.tried = "node";
        urlVariant = "node";
        img.src = pageUrl(pageNum, "node");
        return;
      }
      var st = $("rd-status");
      st.style.display = "";
      st.querySelector(".msg").textContent = "第 " + pageNum + " 页加载失败，可尝试下一页或下载原版。";
    });
    img.addEventListener("click", function () { go(1); });

    var q = new URLSearchParams(location.search);
    var colKey = q.get("col") || "popsoft";
    col = COLLECTIONS[colKey] || COLLECTIONS.popsoft;
    $("back").href = col.back;
    $("ia").href = col.iaPage;

    var id = q.get("id") || "";
    fetch(col.data).then(function (r) { return r.json(); }).then(function (data) {
      item = data.find(function (x) { return x.id === id; }) || data[0];
      pageCount = item.pages || 0;
      $("rtitle").textContent = col.label + " " + item.title;
      document.title = col.label + " " + item.title + " · 《軟體世界》杂志文献资料库";
      $("pgtotal").textContent = "/ " + pageCount;
      var iaId = item.ia_id || col.dir.split("/")[3];
      $("dl").href = "https://archive.org/download/" + iaId + "/" + encodeURI(item.path);
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
