/* 在线阅读器：PDF.js 单页渲染，支持缩放/缩略图/键盘与触摸导航 */
(function () {
  var CDN = [
    ["assets/vendor/pdf.min.js", "assets/vendor/pdf.worker.min.js"],
    ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
     "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"],
    ["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
     "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"]
  ];
  var DL_BASE = "https://github.com/lychees/soft-world-magazine-collection/releases/download/magazines/";

  var pdf = null, pageNum = 1, pageCount = 0, zoomMode = "width", item = null;
  var stage, canvas, ctx, thumbsBox, rendering = false, pendingPage = null;

  function $(id) { return document.getElementById(id); }

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
  }

  function hideStatus() {
    $("rd-status").style.display = "none";
    canvas.style.display = "";
  }

  function viewportScale(page) {
    var base = page.getViewport({ scale: 1 });
    if (zoomMode === "width") {
      return (stage.clientWidth - 28) / base.width;
    }
    if (zoomMode === "page") {
      var sw = (stage.clientWidth - 28) / base.width;
      var sh = (stage.clientHeight - 28) / base.height;
      return Math.min(sw, sh);
    }
    return parseFloat(zoomMode);
  }

  function render(num) {
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
      document.title = item.title + " · 《軟體世界》杂志文献资料库";
      var cur = thumbsBox.querySelector("canvas.cur");
      if (cur) cur.classList.remove("cur");
      var t = thumbsBox.children[num - 1];
      if (t) { t.classList.add("cur"); t.scrollIntoView({ block: "nearest" }); }
      rendering = false;
      if (pendingPage != null) { var p = pendingPage; pendingPage = null; render(p); }
    }).catch(function (e) {
      rendering = false;
      status("页面渲染失败：" + e.message);
    });
  }

  function go(delta) {
    var n = pageNum + delta;
    if (n < 1 || n > pageCount) return;
    render(n);
  }

  function buildThumbs() {
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= pageCount; i++) {
      (function (n) {
        var c = document.createElement("canvas");
        c.title = "第 " + n + " 页";
        c.addEventListener("click", function () { render(n); });
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

  function start(it) {
    item = it;
    $("rtitle").textContent = it.title + (it.date ? "（" + it.date + "）" : "");
    $("dl").href = DL_BASE + it.id + ".pdf";
    status("正在加载 PDF……", 0);
    loadPdfJs(0).then(function () {
      var task = window.pdfjsLib.getDocument({
        url: "pdfs/" + it.id + ".pdf",
        rangeChunkSize: 1048576
      });
      task.onProgress = function (p) {
        if (p.total) status("正在加载 PDF……（" + Math.round(p.loaded / 1048576) + " / " + Math.round(p.total / 1048576) + " MB）", p.loaded / p.total);
        else status("正在加载 PDF……（" + Math.round(p.loaded / 1048576) + " MB）");
      };
      return task.promise;
    }).then(function (doc) {
      pdf = doc;
      pageCount = doc.numPages;
      $("pgtotal").textContent = "/ " + pageCount;
      hideStatus();
      render(1);
      buildThumbs();
    }).catch(function (e) {
      status("加载失败：" + e.message + "。可改用下载原版阅读。");
    });
  }

  function noReading(it) {
    $("rtitle").textContent = it ? it.title : "未知期刊";
    var box = $("rd-status");
    box.style.display = "";
    box.querySelector(".msg").innerHTML =
      "本期暂未提供在线阅读版本。<br>可下载原版扫描 PDF 阅读（" +
      (it ? Math.round(it.size / 1e6) : "?") + " MB）。";
    box.querySelector(".rd-progress").style.display = "none";
    canvas.style.display = "none";
    if (it) $("dl").href = DL_BASE + it.id + ".pdf";
  }

  document.addEventListener("DOMContentLoaded", function () {
    stage = $("rd-stage");
    canvas = $("rd-canvas");
    ctx = canvas.getContext("2d");
    thumbsBox = $("rd-thumbs");

    var id = new URLSearchParams(location.search).get("id") || "";
    fetch("data/issues.json").then(function (r) { return r.json(); }).then(function (data) {
      var it = data.find(function (x) { return x.id === id; }) || data[0];
      if (it && it.reading) start(it); else noReading(it);
    }).catch(function () { noReading(null); });

    $("prev").addEventListener("click", function () { go(-1); });
    $("next").addEventListener("click", function () { go(1); });
    $("pg").addEventListener("change", function () {
      var n = parseInt($("pg").value, 10);
      if (n >= 1 && n <= pageCount) render(n); else $("pg").value = pageNum;
    });
    $("zoom").addEventListener("change", function () {
      zoomMode = $("zoom").value;
      render(pageNum);
    });
    $("thumbs").addEventListener("click", function () {
      thumbsBox.classList.toggle("open");
    });
    window.addEventListener("resize", function () {
      if (pdf && (zoomMode === "width" || zoomMode === "page")) render(pageNum);
    });
    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowLeft" || e.key === "PageUp") { go(-1); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { go(1); e.preventDefault(); }
      if (e.key === "Home") render(1);
      if (e.key === "End") render(pageCount);
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
