/* 通用 archive.org 图片阅读器：?col=<馆藏>&id=<册目>。
   单页 / 双页对开（书籍模式）两种阅读方式，带 3D 翻页动画。
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
      iaPage: "https://archive.org/details/king-of-pocketgames-magazine" },
    pkmplayer: { label: "口袋玩家", data: "data/pkmplayer.json", back: "pkmplayer.html",
      iaPage: "https://archive.org/details/pkmplayer_magazine_zh" },
    cfan: { label: "电脑爱好者", data: "data/cfan.json", back: "cfan.html",
      iaPage: "https://archive.org/details/2005_20220814" },
    mic: { label: "微型计算机", data: "data/mic.json", back: "mic.html",
      iaPage: "https://archive.org/details/mic2008-2011" },
    pcfan: { label: "电脑迷", data: "data/pcfan.json", back: "pcfan.html",
      iaPage: "https://archive.org/details/201101-a" }
  };

  var col = null, item = null, colKey = null;
  var pageNum = 1, pageCount = 0, fit = "width";
  var spread = false, pairIdx = 0;
  var urlVariant = "redirect";

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

  function status(msg) {
    var st = $("rd-status");
    st.style.display = "";
    st.querySelector(".msg").textContent = msg;
  }
  function hideStatus() { $("rd-status").style.display = "none"; }

  function setVisible(el, on) { el.style.display = on ? "" : "none"; }

  function bmPaint() {
    if (!window.Bookmarks || !item) return;
    var on = window.Bookmarks.has(colKey, item.id, pageNum);
    $("bm").textContent = on ? "★" : "☆";
    $("bm").classList.toggle("on", on);
  }

  function bmPanel(force) {
    var p = $("bm-panel");
    if (force === true) p.classList.add("open");
    else p.classList.toggle("open");
    if (!p.classList.contains("open")) return;
    p.innerHTML = "<h4>书签</h4>";
    var pages = window.Bookmarks.list(colKey, item.id);
    if (!pages.length) {
      p.innerHTML += '<div class="bm-empty">还没有书签。翻到想标记的页，点 ☆ 收藏。</div>';
      return;
    }
    pages.forEach(function (pg) {
      var row = document.createElement("div");
      row.className = "bm-row";
      var a = document.createElement("a");
      a.href = "javascript:void(0)";
      a.textContent = "第 " + pg + " 页";
      a.addEventListener("click", function () { gotoPage(pg); p.classList.remove("open"); });
      var del = document.createElement("button");
      del.textContent = "×";
      del.addEventListener("click", function () { window.Bookmarks.clear(colKey, item.id, pg); bmPanel(true); bmPaint(); });
      row.appendChild(a);
      row.appendChild(del);
      p.appendChild(row);
    });
  }

  var thumbsBuilt = false;
  function buildThumbs() {
    if (thumbsBuilt) return;
    thumbsBuilt = true;
    var box = $("rd-thumbs");
    for (var n = 1; n <= pageCount; n++) {
      (function (pg) {
        var im = new Image();
        im.loading = "lazy";
        im.dataset.pg = pg;
        im.title = "第 " + pg + " 页";
        im.src = pageUrl(pg, urlVariant);
        im.addEventListener("click", function () { gotoPage(pg); });
        im.addEventListener("error", function () {
          if (urlVariant === "redirect") {
            urlVariant = "node";
            im.src = pageUrl(pg, "node");
          }
        });
        box.appendChild(im);
      })(n);
    }
  }

  function paintThumbs() {
    var box = $("rd-thumbs");
    if (!box || !box.children.length) return;
    var cur = box.querySelector("img.cur");
    if (cur) cur.classList.remove("cur");
    var t = box.children[pageNum - 1];
    if (t) { t.classList.add("cur"); t.scrollIntoView({ block: "nearest" }); }
  }

  /* ---------- 双页对开 ---------- */
  function maxPair() { return Math.max(0, Math.floor(pageCount / 2)); }
  function pairPages(k) {
    if (k <= 0) return [1];
    var a = 2 * k, b = 2 * k + 1;
    return b <= pageCount ? [a, b] : [a];
  }
  function pairOfPage(n) { return n <= 1 ? 0 : Math.floor(n / 2); }

  function setPairImgs(pages) {
    var L = $("rd-img-l"), R = $("rd-img-r");
    L.style.visibility = "hidden";
    R.style.visibility = "hidden";
    R.style.display = pages[1] ? "" : "none";
    L.onload = function () { L.style.visibility = ""; markLoaded(); };
    R.onload = function () { R.style.visibility = ""; markLoaded(); };
    L.onerror = R.onerror = imgErr;
    L.src = pageUrl(pages[0], urlVariant);
    R.src = pages[1] ? pageUrl(pages[1], urlVariant) : "";
    [pages[pages.length - 1] + 1, pages[pages.length - 1] + 2].forEach(function (k) {
      if (k <= pageCount) { var p = new Image(); p.src = pageUrl(k, urlVariant); }
    });
  }
  var loadedCount = 0;
  function markLoaded() {
    loadedCount++;
    if (loadedCount >= 1) hideStatus();
    $("rd-img-l").classList.add("flip-enter");
    $("rd-img-r").classList.add("flip-enter");
  }

  function showPair(k) {
    pairIdx = k;
    loadedCount = 0;
    var pages = pairPages(k);
    status("第 " + pages.join("·") + " 页加载中……");
    setPairImgs(pages);
    $("pg").value = pages[0];
    if (window.Progress) window.Progress.save(colKey, item.id, pages[0]);
    bmPaint();
  }

  function snapSpread(dir) {
    var srcEl = dir === 1 ? $("rd-img-r") : $("rd-img-l");
    if (!srcEl || !srcEl.naturalWidth || srcEl.style.visibility === "hidden") return null;
    var im = new Image();
    im.src = srcEl.src;
    im.style.width = srcEl.getBoundingClientRect().width + "px";
    im.style.height = "auto";
    return im;
  }

  /* ---------- 单页 ---------- */
  function show(n) {
    if (!item || n < 1 || n > pageCount) return;
    pageNum = n;
    $("pg").value = n;
    if (window.Progress) window.Progress.save(colKey, item.id, n);
    bmPaint();
    paintThumbs();
    var img = $("rd-img");
    status("第 " + n + " / " + pageCount + " 页加载中……");
    img.style.display = "none";
    img.dataset.tried = "";
    img.src = pageUrl(n, urlVariant);
    [n + 1, n + 2].forEach(function (k) {
      if (k <= pageCount) { var p = new Image(); p.src = pageUrl(k, urlVariant); }
    });
  }

  function snapSingle() {
    var img = $("rd-img");
    if (!img || img.style.display === "none" || !img.naturalWidth) return null;
    var im = new Image();
    im.src = img.src;
    im.style.width = img.getBoundingClientRect().width + "px";
    im.style.height = "auto";
    return im;
  }

  function imgErr() {
    if (urlVariant === "redirect") {
      urlVariant = "node";
      if (spread) showPair(pairIdx);
      else { var i = $("rd-img"); i.src = pageUrl(pageNum, "node"); }
      return;
    }
    status("第 " + pageNum + " 页加载失败，可尝试下一页或下载原版。");
  }

  /* ---------- 导航 ---------- */
  function go(d) {
    if (spread) {
      var k = pairIdx + d;
      if (k < 0 || k > maxPair()) return;
      window.flipGo($("flip-wrap"), d, function () { return snapSpread(d); },
                    function () { showPair(k); }, d === 1 ? "right" : "left");
    } else {
      var n = pageNum + d;
      if (n < 1 || n > pageCount) return;
      window.flipGo($("flip-wrap"), d, snapSingle, function () { show(n); });
    }
  }

  function gotoPage(n) {
    if (n < 1 || n > pageCount) { $("pg").value = spread ? pairPages(pairIdx)[0] : pageNum; return; }
    if (spread) showPair(pairOfPage(n));
    else show(n);
  }

  function setMode(toSpread) {
    spread = toSpread;
    $("rd-img").style.display = toSpread ? "none" : "";
    $("spread-box").style.display = toSpread ? "" : "none";
    $("mode").textContent = toSpread ? "单页" : "双页";
    if (toSpread) showPair(pairOfPage(pageNum));
    else show(pageNum);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var img = $("rd-img");
    img.addEventListener("load", function () {
      hideStatus();
      img.style.display = "";
      img.classList.remove("flip-enter");
      void img.offsetWidth;
      img.classList.add("flip-enter");
    });
    img.addEventListener("error", imgErr);
    img.addEventListener("click", function () { go(1); });
    $("rd-img-r").addEventListener("click", function () { go(1); });
    $("rd-img-l").addEventListener("click", function () { go(-1); });

    var q = new URLSearchParams(location.search);
    colKey = q.get("col") || "popsoft";
    col = COLLECTIONS[colKey] || COLLECTIONS.popsoft;
    $("back").href = col.back;
    $("ia").href = col.iaPage;

    var id = q.get("id") || "";
    var startFromQuery = parseInt(q.get("page") || "0", 10) || null;
    fetch(col.data).then(function (r) { return r.json(); }).then(function (data) {
      item = data.find(function (x) { return x.id === id; }) || data[0];
      pageCount = item.pages || 0;
      $("rtitle").textContent = col.label + " " + item.title;
      document.title = col.label + " " + item.title + " · 《軟體世界》杂志文献资料库";
      $("pgtotal").textContent = "/ " + pageCount;
      var iaId = item.ia_id || col.iaId;
      $("dl").href = "https://archive.org/download/" + iaId + "/" + encodeURI(item.path);
      if (!pageCount) {
        status("该册缺少页面索引，请下载原版阅读。");
        return;
      }
      var startPage = startFromQuery || ((window.Progress && id) ? window.Progress.load(colKey, id) : null);
      var savedZoom = (window.Zoom && id) ? window.Zoom.load(colKey, id) : null;
      if (savedZoom) {
        fit = savedZoom;
        $("zoom").textContent = fit === "width" ? "适应宽度" : "原始尺寸";
        document.body.classList.toggle("zoom-full", fit === "full");
      }
      show(startPage && startPage > 1 ? startPage : 1);
    }).catch(function (e) {
      status("数据加载失败：" + e);
    });

    $("prev").addEventListener("click", function () { go(-1); });
    $("next").addEventListener("click", function () { go(1); });
    // 长按连续翻页
    function holdRepeat(btn, d) {
      var timer = null;
      function start(e) {
        e.preventDefault();
        go(d);
        timer = setInterval(function () { go(d); }, 380);
      }
      function stop() {
        if (timer) { clearInterval(timer); timer = null; }
      }
      btn.addEventListener("mousedown", start);
      btn.addEventListener("touchstart", start, { passive: false });
      ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach(function (ev) {
        btn.addEventListener(ev, stop);
      });
    }
    holdRepeat($("prev"), -1);
    holdRepeat($("next"), 1);
    $("pg").addEventListener("change", function () {
      var n = parseInt($("pg").value, 10);
      if (!isNaN(n)) gotoPage(n);
    });
    $("zoom").addEventListener("click", function () {
      fit = fit === "width" ? "full" : "width";
      $("zoom").textContent = fit === "width" ? "适应宽度" : "原始尺寸";
      document.body.classList.toggle("zoom-full", fit === "full");
      if (window.Zoom) window.Zoom.save(colKey, item.id, fit);
    });
    $("thumbs").addEventListener("click", function () {
      $("rd-thumbs").classList.toggle("open");
      if ($("rd-thumbs").classList.contains("open")) buildThumbs();
    });
    $("mode").addEventListener("click", function () { setMode(!spread); });
    $("bm").addEventListener("click", function () {
      if (!window.Bookmarks) return;
      var added = window.Bookmarks.toggle(colKey, item.id, pageNum);
      bmPaint();
      if (added) bmPanel(true);
    });
    $("fs").addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else $("rd-stage").requestFullscreen().catch(function () {});
    });
    $("share").addEventListener("click", function () {
      var u = new URL(location.href);
      u.searchParams.set("page", spread ? pairPages(pairIdx)[0] : pageNum);
      var text = u.toString();
      function done() { $("share").textContent = "已复制"; setTimeout(function () { $("share").textContent = "分享"; }, 1500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { prompt("复制链接：", text); });
      } else {
        prompt("复制链接：", text);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft" || e.key === "PageUp") { go(-1); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { go(1); e.preventDefault(); }
      if (e.key === "Home") gotoPage(1);
      if (e.key === "End") gotoPage(pageCount);
    });
    var tx = null, stage = $("rd-stage");
    // 左右两侧点按翻页（移动端友好）：左 30% 上一页，其余下一页
    stage.addEventListener("click", function (e) {
      if (e.target.closest("button, a, input, select")) return;
      var r = stage.getBoundingClientRect();
      var x = e.clientX - r.left;
      if (x < r.width * 0.3) go(-1);
      else go(1);
    });
    stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (tx == null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      tx = null;
    }, { passive: true });
  });
})();
