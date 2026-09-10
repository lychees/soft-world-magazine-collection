/* 书页翻转效果：在当前页面上覆盖一层复制品，绕书脊旋转飞出，新页面在下方显现。
   pageFlip(wrap, dir, snapshot) -> Promise；dir=1 向后翻（下一页），-1 向前翻（上一页）。 */
(function () {
  var DURATION = 460;
  var flipping = false, queued = 0;

  function ensureStyle() {
    if (document.getElementById("flip-style")) return;
    var st = document.createElement("style");
    st.id = "flip-style";
    st.textContent =
      ".flip-wrap{position:relative;display:inline-block;perspective:1500px;}" +
      ".flip-overlay{position:absolute;top:0;transform-style:preserve-3d;" +
      "backface-visibility:hidden;pointer-events:none;z-index:20;" +
      "box-shadow:0 6px 30px rgba(0,0,0,.5);background:#fff;}" +
      ".flip-overlay img,.flip-overlay canvas{display:block;}" +
      ".flip-enter{animation:flipEnter .38s ease-out;}" +
      "@keyframes flipEnter{from{opacity:.25;filter:brightness(.92)}to{opacity:1;filter:brightness(1)}}";
    document.head.appendChild(st);
  }

  /* snapshot: 返回代表当前页面的元素（img 或 canvas 副本），可为 null（首次加载不翻页） */
  function pageFlip(wrap, dir, snapshotEl) {
    ensureStyle();
    return new Promise(function (resolve) {
      if (!snapshotEl) { flipping = false; resolve(); return; }
      var ov = document.createElement("div");
      ov.className = "flip-overlay";
      ov.style[dir === 1 ? "left" : "right"] = "0";
      ov.style.transformOrigin = dir === 1 ? "left center" : "right center";
      ov.appendChild(snapshotEl);
      wrap.appendChild(ov);

      var started = false;
      function start() {
        if (started) return;
        started = true;
        ov.getBoundingClientRect(); // reflow
        ov.style.transition = "transform " + DURATION + "ms cubic-bezier(.3,.1,.4,1), opacity " + DURATION + "ms ease-in";
        ov.style.transform = "rotateY(" + (dir === 1 ? -82 : 82) + "deg)";
        ov.style.opacity = "0.12";
        setTimeout(function () { ov.remove(); flipping = false; resolve(); }, DURATION + 20);
      }
      // 等快照图像解码，避免白闪；最长等待 180ms
      var im = ov.querySelector("img");
      var timer = setTimeout(start, 180);
      function startOnce() { clearTimeout(timer); start(); }
      if (im) {
        if (im.decode) im.decode().then(startOnce, startOnce);
        else if (im.complete) startOnce();
        else { im.onload = startOnce; im.onerror = startOnce; }
      } else {
        startOnce();
      }
    });
  }

  /* 统一入口：执行翻页动画，同时在底层切换到新页。
     dir=1/-1；snapshotFn() 取当前页快照元素；switchFn() 切换新页面内容。 */
  window.flipGo = function (wrap, dir, snapshotFn, switchFn) {
    if (flipping) { queued = dir; return Promise.resolve(); }
    if (!snapshotFn()) { switchFn(); return Promise.resolve(); }
    flipping = true;
    var p = pageFlip(wrap, dir, snapshotFn());
    switchFn();
    return p.then(function () {
      if (queued) {
        var q = queued;
        queued = 0;
        return window.flipGo(wrap, q, snapshotFn, switchFn);
      }
    });
  };
})();
