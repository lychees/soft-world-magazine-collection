/* 离线支持 Service Worker：
   - 预缓存站点框架（页面/样式/脚本/数据 JSON）
   - 运行时缓存封面、軟體世界阅读版 PDF 与 archive.org 页面图片（含跨域 opaque 响应）
   策略：页面与数据 network-first；封面/图片/PDF stale-while-revalidate。 */
var SHELL = "sw-shell-v1";
var RUNTIME = "sw-runtime-v1";

var PRECACHE = [
  "./", "index.html", "about.html", "shelf.html",
  "popsoft.html", "dianruan.html", "diandian.html", "jiayou.html", "ucg.html",
  "zjimi.html", "gameday.html", "softstar.html", "zhangjiwang.html",
  "pkmplayer.html", "cfan.html", "mic.html", "koudaimi.html",
  "reader.html", "ia-reader.html",
  "assets/style.css", "assets/app.js", "assets/reader.js", "assets/ia-reader.js",
  "assets/mag-catalog.js", "assets/popsoft.js", "assets/global-search.js",
  "assets/collections.js", "assets/favs.js", "assets/progress.js",
  "assets/page-flip.js", "assets/theme.js",
  "assets/vendor/pdf.min.js", "assets/vendor/pdf.worker.min.js",
  "data/issues.json", "data/popsoft.json", "data/dianruan.json", "data/diandian.json",
  "data/jiayou.json", "data/ucg.json", "data/gameday.json", "data/softstar.json",
  "data/zhangjiwang.json", "data/pkmplayer.json", "data/cfan.json",
  "data/mic.json", "data/koudaimi.json"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(SHELL).then(function (c) { return c.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== SHELL && k !== RUNTIME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isPage(req) {
  return req.mode === "navigate" || req.destination === "document";
}

function isImageOrPdf(req) {
  return /\.(jpe?g|png|pdf)$/i.test(req.url) ||
    req.url.includes("view_archive.php") ||
    req.destination === "image";
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // 页面与数据：network-first，离线回退缓存
  if (isPage(req) || url.pathname.startsWith("/soft-world-magazine-collection/data/")) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(RUNTIME).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match("index.html");
        });
      })
    );
    return;
  }

  // 图片与 PDF（含跨域 opaque）：stale-while-revalidate
  if (isImageOrPdf(req)) {
    e.respondWith(
      caches.match(req).then(function (cached) {
        var fetching = fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(RUNTIME).then(function (c) { c.put(req, copy); });
          return res;
        }).catch(function () { return cached; });
        return cached || fetching;
      })
    );
    return;
  }

  // 其余资源：network-first
  e.respondWith(
    fetch(req).catch(function () { return caches.match(req); })
  );
});
