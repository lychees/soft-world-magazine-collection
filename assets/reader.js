/* 軟體世界在线阅读器：本地 PDF.js（有阅读版的册目）+ archive.org 页面图片模式（其余册目）。
   图片经 <img> 加载，不受 CORS 限制。 */
(function () {
  var CDN = [
    ["assets/vendor/pdf.min.js", "assets/vendor/pdf.worker.min.js"],
    ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
     "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"],
    ["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
     "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"]
  ];
  var DL_BASE = "https://github.com/lychees/soft-world-magazine-collection/releases/download/magazines/";
  var IA_NODE = "https://ia601800.us.archive.org/view_archive.php";
  var IA_DIR = "/35/items/soft-world-magazine-collection/";
  var IA_ID = "soft-world-magazine-collection";
  var iaVariant = "redirect";

  var item = null, mode = null;

  function $(id) { return document.getElementById(id); }

  /* ================= PDF.js 模式（本地阅读版） ================= */
  var pdf = null, pageNum = 1, pageCount = 0, zoomMode = "width";
  var stage, canvas, ctx, thumbsBox, rendering = false, pendingRender = null;

  function loadPdfJs(i) {
    return new Promise(function (resolve, reject) {
      if (window.pdfjsLib) return resolve();
      if (i >= CDN.length) return reject(new Error("PDF.js 加载失败（CDN 不可达）"));
      var s = document.createElement("script");
      s.src = CDN[i][0];
      s.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN[i][1];
        resolve();
      };
      s.onerror = function () { loadPdfJs(i + 1).then(resolve, reject); };
      document.head.appendChild(s);
    });
  }

  function status(msg, pct) {
    var st = $("rd-status");
    st.style.display = "";
    st.querySelector(".msg").textContent = msg;
    var bar = st.querySelector(".rd-progress i");
    if (pct != null) bar.style.width = Math.round(pct * 100) + "%";
    canvas.style.display = "none";
    $("rd-img").style.display = "none";
  }

  function hideStatus() {
    $("rd-status").style.display = "none";
    if (mode === "pdf") canvas.style.display = "";
    else $("rd-img").style.display = "";
  }

  function viewportScale(page) {
    var base = page.getViewport({ scale: 1 });
    if (zoomMode === "width") return (stage.clientWidth - 28) / base.width;
    if (zoomMode === "page") {
      return Math.min((stage.clientWidth - 28) / base.width, (stage.clientHeight - 28) / base.height);
    }
    return parseFloat(zoomMode);
  }

  function runPending() {
    if (pendingRender == null) return;
    var p = pendingRender;
    pendingRender = null;
    if (p.type === "pair") renderPair(p.k);
    else renderPdf(p.num);
  }

  function renderPdf(num) {
    if (!pdf) return;
    if (rendering) { pendingRender = { type: "pdf", num: num }; return; }
    rendering = true;
    pdf.getPage(num).then(function (page) {
      var scale = viewportScale(page);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var vp = page.getViewport({ scale: scale * dpr });
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = Math.floor(vp.width / dpr) + "px";
      canvas.style.height = Math.floor(vp.height / dpr) + "px";
      return page.render({ canvasContext: ctx, viewport: vp }).promise;
    }).then(function () {
      pageNum = num;
      $("pg").value = num;
      if (window.Progress) window.Progress.save("sw", item.id, num);
      canvas.classList.remove("flip-enter");
      void canvas.offsetWidth;
      canvas.classList.add("flip-enter");
      var cur = thumbsBox.querySelector("canvas.cur");
      if (cur) cur.classList.remove("cur");
      var t = thumbsBox.children[num - 1];
      if (t) { t.classList.add("cur"); t.scrollIntoView({ block: "nearest" }); }
      rendering = false;
      runPending();
    }).catch(function (e) {
      rendering = false;
      status("页面渲染失败：" + e.message);
    });
  }

  var thumbsBuilt = false;
  function buildThumbs() {
    if (thumbsBuilt) return;
    thumbsBuilt = true;
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= pageCount; i++) {
      (function (n) {
        var c = document.createElement("canvas");
        c.title = "第 " + n + " 页";
        c.addEventListener("click", function () { renderPdf(n); });
        frag.appendChild(c);
        pdf.getPage(n).then(function (page) {
          var base = page.getViewport({ scale: 1 });
          var sc = 116 / base.width;
          var vp = page.getViewport({ scale: sc });
          c.width = Math.floor(vp.width);
          c.height = Math.floor(vp.height);
          return page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        }).catch(function () {});
      })(i);
    }
    thumbsBox.appendChild(frag);
  }

  function startPdf(it) {
    mode = "pdf";
    var docReady = false;
    status("正在加载 PDF……", 0);
    loadPdfJs(0).then(function () {
      var task = window.pdfjsLib.getDocument({ url: "pdfs/" + it.id + ".pdf", rangeChunkSize: 1048576 });
      task.onProgress = function (p) {
        if (docReady) return;
        if (p.total) status("正在加载 PDF……（" + Math.round(p.loaded / 1048576) + " / " + Math.round(p.total / 1048576) + " MB）", p.loaded / p.total);
        else status("正在加载 PDF……（" + Math.round(p.loaded / 1048576) + " MB）");
      };
      return task.promise;
    }).then(function (doc) {
      docReady = true;
      pdf = doc;
      pageCount = doc.numPages;
      $("pgtotal").textContent = "/ " + pageCount;
      hideStatus();
      renderPdf(it._startPage || 1);
    }).catch(function (e) {
      status("加载失败：" + e.message + "。可改用下载原版阅读。");
    });
  }

  /* ================= 双页对开 ================= */
  var spread = false, pairIdx = 0;

  function maxPair() { return Math.max(0, Math.floor(pageCount / 2)); }
  function pairPages(k) {
    if (k <= 0) return [1];
    var a = 2 * k, b = 2 * k + 1;
    return b <= pageCount ? [a, b] : [a];
  }
  function pairOfPage(n) { return n <= 1 ? 0 : Math.floor(n / 2); }

  function renderPair(k) {
    if (!pdf) return;
    if (rendering) { pendingRender = { type: "pair", k: k }; return; }
    rendering = true;
    var pages = pairPages(k);
    Promise.all(pages.map(function (n) { return pdf.getPage(n); })).then(function (pgs) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var bases = pgs.map(function (page) { return page.getViewport({ scale: 1 }); });
      var totalW = bases.reduce(function (s, v) { return s + v.width; }, 0);
      var maxH = Math.max.apply(null, bases.map(function (v) { return v.height; }));
      var scale;
      if (zoomMode === "width") scale = (stage.clientWidth - 34) / totalW;
      else if (zoomMode === "page") scale = Math.min((stage.clientWidth - 34) / totalW, (stage.clientHeight - 28) / maxH);
      else scale = parseFloat(zoomMode);
      var els = [$("rd-canvas-l"), $("rd-canvas-r")];
      var tasks = [];
      pgs.forEach(function (page, i) {
        var vp = page.getViewport({ scale: scale * dpr });
        var c = els[i];
        c.width = Math.floor(vp.width);
        c.height = Math.floor(vp.height);
        c.style.width = Math.floor(vp.width / dpr) + "px";
        c.style.height = Math.floor(vp.height / dpr) + "px";
        tasks.push(page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise);
      });
      els[1].style.display = pgs.length > 1 ? "" : "none";
      return Promise.all(tasks);
    }).then(function () {
      pairIdx = k;
      $("pg").value = pairPages(k)[0];
      if (window.Progress) window.Progress.save("sw", item.id, pairPages(k)[0]);
      ["rd-canvas-l", "rd-canvas-r"].forEach(function (id) {
        var c = $(id);
        c.classList.remove("flip-enter");
        void c.offsetWidth;
        c.classList.add("flip-enter");
      });
      rendering = false;
      runPending();
    }).catch(function (e) {
      rendering = false;
      status("页面渲染失败：" + e.message);
    });
  }
  var pendingRender = null;

  function showPairIa(k) {
    pairIdx = k;
    var pages = pairPages(k);
    if (window.Progress) window.Progress.save("sw", item.id, pages[0]);
    status("第 " + pages.join("·") + " 页加载中……");
    var L = $("rd-img-l"), R = $("rd-img-r");
    L.style.visibility = "hidden";
    R.style.visibility = "hidden";
    R.style.display = pages[1] ? "" : "none";
    L.onload = function () { L.style.visibility = ""; hideStatus(); L.classList.add("flip-enter"); };
    R.onload = function () { R.style.visibility = ""; hideStatus(); R.classList.add("flip-enter"); };
    L.onerror = R.onerror = iaErr;
    L.src = iaPageUrl(pages[0], iaVariant);
    R.src = pages[1] ? iaPageUrl(pages[1], iaVariant) : "";
    [pages[pages.length - 1] + 1, pages[pages.length - 1] + 2].forEach(function (x) {
      if (x <= pageCount) { var p = new Image(); p.src = iaPageUrl(x, iaVariant); }
    });
    $("pg").value = pages[0];
  }

  function iaErr() {
    if (iaVariant === "redirect") {
      iaVariant = "node";
      if (spread) showPairIa(pairIdx);
      else { iaImg.dataset.tried = "node"; iaImg.src = iaPageUrl(pageNum, "node"); }
      return;
    }
    status("第 " + pageNum + " 页加载失败，可尝试下一页或下载原版。");
  }

  function snapSpread(d) {
    var el;
    if (mode === "pdf") el = d === 1 ? $("rd-canvas-r") : $("rd-canvas-l");
    else el = d === 1 ? $("rd-img-r") : $("rd-img-l");
    if (!el || (el.style.display === "none")) return null;
    if (mode === "pdf") {
      if (!el.width) return null;
      var im = new Image();
      im.src = el.toDataURL("image/jpeg", 0.85);
      im.style.width = el.style.width;
      return im;
    }
    if (!el.naturalWidth || el.style.visibility === "hidden") return null;
    var im2 = new Image();
    im2.src = el.src;
    im2.style.width = el.getBoundingClientRect().width + "px";
    im2.style.height = "auto";
    return im2;
  }

  function setMode(toSpread) {
    spread = toSpread;
    $("mode").textContent = toSpread ? "单页" : "双页";
    if (mode === "pdf") {
      canvas.style.display = toSpread ? "none" : "";
      $("spread-box").style.display = toSpread ? "flex" : "none";
      if (toSpread) renderPair(pairOfPage(pageNum)); else renderPdf(pageNum);
    } else if (mode === "ia") {
      iaImg.style.display = toSpread ? "none" : "";
      $("spread-img-box").style.display = toSpread ? "flex" : "none";
      if (toSpread) showPairIa(pairOfPage(pageNum)); else showIa(pageNum);
    }
  }

  var iaImg;

  function iaPageUrl(n, variant) {
    var base = item.ia_path.replace(/\.pdf$/i, "");
    var name = base.split("/").pop();
    var outer = base.split("/").map(encodeURIComponent).join("/");
    var leaf = String(n - 1).padStart(4, "0");
    var member = encodeURIComponent(name + "_jp2/" + name + "_" + leaf + ".jp2");
    if (variant === "node") {
      return IA_NODE + "?archive=" + IA_DIR + outer + "_jp2.zip&file=" + member + "&ext=jpg";
    }
    return "https://archive.org/download/" + IA_ID + "/" + outer + "_jp2.zip/" + member + "&ext=jpg";
  }

  function iaLayout() {
    if (mode !== "ia" || !iaImg.naturalWidth) return;
    var w;
    if (zoomMode === "width") w = stage.clientWidth - 28;
    else if (zoomMode === "page") w = Math.min(stage.clientWidth - 28,
      (stage.clientHeight - 28) * iaImg.naturalWidth / iaImg.naturalHeight);
    else w = iaImg.naturalWidth * parseFloat(zoomMode);
    iaImg.style.width = Math.floor(w) + "px";
    iaImg.style.height = "auto";
  }

  function showIa(n) {
    if (n < 1 || n > pageCount) return;
    pageNum = n;
    $("pg").value = n;
    if (window.Progress) window.Progress.save("sw", item.id, n);
    status("第 " + n + " / " + pageCount + " 页加载中……");
    iaImg.dataset.tried = "";
    iaImg.src = iaPageUrl(n, iaVariant);
    [n + 1, n + 2].forEach(function (k) {
      if (k <= pageCount) { var p = new Image(); p.src = iaPageUrl(k, iaVariant); }
    });
  }

  function startIa(it) {
    mode = "ia";
    pageCount = it.pages || 0;
    $("pgtotal").textContent = "/ " + pageCount;
    $("thumbs").style.display = "none";
    if (!pageCount) {
      status("该册缺少页面索引，请下载原版阅读。");
      return;
    }
    showIa(it._startPage || 1);
  }

  /* ================= 公共 ================= */
  function go(d) {
    if (mode !== "pdf" && mode !== "ia") return;
    if (spread) {
      var k = pairIdx + d;
      if (k < 0 || k > maxPair()) return;
      window.flipGo($("flip-wrap"), d, function () { return snapSpread(d); }, function () {
        if (mode === "pdf") renderPair(k); else showPairIa(k);
      }, d === 1 ? "right" : "left");
      return;
    }
    var n = pageNum + d;
    if (n < 1 || n > pageCount) return;
    window.flipGo($("flip-wrap"), d, snap, function () {
      if (mode === "pdf") renderPdf(n); else showIa(n);
    });
  }

  function snap() {
    if (mode === "pdf") {
      if (canvas.style.display === "none" || !canvas.width) return null;
      var im = new Image();
      im.src = canvas.toDataURL("image/jpeg", 0.85);
      im.style.width = canvas.style.width;
      return im;
    }
    if (mode === "ia") {
      if (iaImg.style.display === "none" || !iaImg.naturalWidth) return null;
      var im2 = new Image();
      im2.src = iaImg.src;
      im2.style.width = iaImg.getBoundingClientRect().width + "px";
      im2.style.height = "auto";
      return im2;
    }
    return null;
  }

  function noReading(it) {
    mode = "none";
    var box = $("rd-status");
    box.style.display = "";
    box.querySelector(".msg").innerHTML =
      "本期暂未提供在线阅读版本。<br>可下载原版扫描 PDF 阅读（" +
      (it ? Math.round(it.size / 1e6) : "?") + " MB）。";
    box.querySelector(".rd-progress").style.display = "none";
  }

  document.addEventListener("DOMContentLoaded", function () {
    stage = $("rd-stage");
    canvas = $("rd-canvas");
    ctx = canvas.getContext("2d");
    thumbsBox = $("rd-thumbs");
    iaImg = $("rd-img");
    iaImg.addEventListener("load", function () {
      hideStatus();
      iaLayout();
      iaImg.classList.remove("flip-enter");
      void iaImg.offsetWidth;
      iaImg.classList.add("flip-enter");
    });
    iaImg.addEventListener("error", function () {
      if (iaVariant === "redirect" && !iaImg.dataset.tried) {
        iaImg.dataset.tried = "node";
        iaVariant = "node";
        iaImg.src = iaPageUrl(pageNum, "node");
        return;
      }
      status("第 " + pageNum + " 页加载失败，可尝试下一页或下载原版。");
    });
    iaImg.addEventListener("click", function () { go(1); });

    var id = new URLSearchParams(location.search).get("id") || "";
    fetch("data/issues.json").then(function (r) { return r.json(); }).then(function (data) {
      var it = data.find(function (x) { return x.id === id; }) || data[0];
      item = it;
      $("rtitle").textContent = it.title + (it.date ? "（" + it.date + "）" : "");
      document.title = it.title + " · 《軟體世界》杂志文献资料库";
      $("dl").href = DL_BASE + it.id + ".pdf";
      if (it.reading) {
        var sp = (window.Progress && id) ? window.Progress.load("sw", id) : null;
        if (sp && sp > 1) {
          it._startPage = sp;
        }
        startPdf(it);
      }
      else if (it.ia_path) {
        var sp2 = (window.Progress && id) ? window.Progress.load("sw", id) : null;
        if (sp2 && sp2 > 1) it._startPage = sp2;
        startIa(it);
      }
      else noReading(it);
    }).catch(function () { noReading(null); });

    $("prev").addEventListener("click", function () { go(-1); });
    $("next").addEventListener("click", function () { go(1); });
    $("mode").addEventListener("click", function () { setMode(!spread); });
    $("fs").addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else stage.requestFullscreen().catch(function () {});
    });
    $("rd-canvas-r").addEventListener("click", function () { go(1); });
    $("rd-canvas-l").addEventListener("click", function () { go(-1); });
    $("rd-img-r").addEventListener("click", function () { go(1); });
    $("rd-img-l").addEventListener("click", function () { go(-1); });
    $("pg").addEventListener("change", function () {
      var n = parseInt($("pg").value, 10);
      if (n >= 1 && n <= pageCount) {
        if (spread) {
          if (mode === "ia") showPairIa(pairOfPage(n)); else renderPair(pairOfPage(n));
        } else {
          if (mode === "ia") showIa(n); else renderPdf(n);
        }
      } else $("pg").value = spread ? pairPages(pairIdx)[0] : pageNum;
    });
    $("zoom").addEventListener("change", function () {
      zoomMode = $("zoom").value;
      if (spread) {
        if (mode === "ia") { /* 图片按 CSS 自适应 */ } else renderPair(pairIdx);
      } else if (mode === "ia") iaLayout(); else if (pdf) renderPdf(pageNum);
    });
    $("thumbs").addEventListener("click", function () {
      thumbsBox.classList.toggle("open");
      if (thumbsBox.classList.contains("open")) buildThumbs();
    });
    window.addEventListener("resize", function () {
      if (mode === "ia") iaLayout();
      else if (pdf && (zoomMode === "width" || zoomMode === "page")) renderPdf(pageNum);
    });
    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowLeft" || e.key === "PageUp") { go(-1); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { go(1); e.preventDefault(); }
      if (e.key === "Home") { if (mode === "ia") showIa(1); else renderPdf(1); }
      if (e.key === "End") { if (mode === "ia") showIa(pageCount); else renderPdf(pageCount); }
    });
    var tx = null;
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
