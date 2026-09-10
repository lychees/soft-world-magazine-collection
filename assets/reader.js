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
  var stage, canvas, ctx, thumbsBox, rendering = false, pendingPage = null;

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

  function renderPdf(num) {
    if (!pdf) return;
    if (rendering) { pendingPage = num; return; }
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
      canvas.classList.remove("flip-enter");
      void canvas.offsetWidth;
      canvas.classList.add("flip-enter");
      var cur = thumbsBox.querySelector("canvas.cur");
      if (cur) cur.classList.remove("cur");
      var t = thumbsBox.children[num - 1];
      if (t) { t.classList.add("cur"); t.scrollIntoView({ block: "nearest" }); }
      rendering = false;
      if (pendingPage != null) { var p = pendingPage; pendingPage = null; renderPdf(p); }
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
      renderPdf(1);
    }).catch(function (e) {
      status("加载失败：" + e.message + "。可改用下载原版阅读。");
    });
  }

  /* ================= IA 图片模式 ================= */
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
    showIa(1);
  }

  /* ================= 公共 ================= */
  function go(d) {
    if (mode !== "pdf" && mode !== "ia") return;
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
      if (it.reading) startPdf(it);
      else if (it.ia_path) startIa(it);
      else noReading(it);
    }).catch(function () { noReading(null); });

    $("prev").addEventListener("click", function () { go(-1); });
    $("next").addEventListener("click", function () { go(1); });
    $("pg").addEventListener("change", function () {
      var n = parseInt($("pg").value, 10);
      if (n >= 1 && n <= pageCount) {
        if (mode === "ia") showIa(n); else renderPdf(n);
      } else $("pg").value = pageNum;
    });
    $("zoom").addEventListener("change", function () {
      zoomMode = $("zoom").value;
      if (mode === "ia") iaLayout(); else if (pdf) renderPdf(pageNum);
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
    stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (tx == null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      tx = null;
    }, { passive: true });
  });
})();
