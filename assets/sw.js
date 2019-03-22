/* eslint no-restricted-globals:0 */
const cacheName = "restreview-v2";
const fallbackImage = "img/picture-not-available.jpg";
const itemToCatch = [
  "favicon.ico",
  "/",
  fallbackImage,
  "index.html",
  "restaurant.html",
  "css/styles.css",
  "js/dbhelper.js",
  "js/main.js",
  "js/restaurant_info.js",
  "restaurants",
  "img/icons/icon-72x72.png",
  "img/icons/icon-96x96.png",
  "img/icons/icon-128x128.png",
  "img/icons/icon-144x144.png",
  "img/icons/icon-152x152.png",
  "img/icons/icon-192x192.png",
  "img/icons/icon-384x384.png",
  "img/icons/icon-512x512.png"
];

self.addEventListener("install", event => {
  event.waitUntill(
    caches.open(cacheName).then(cache => cache.addAll(itemToCatch))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      if (res) {
        return res;
      }
      return fetch(event.request)
        .then(response =>
          caches.open(cacheName).then(cache => {
            cache.put(event.request.url, response.clone());
            return response;
          })
        )
        .catch(error => {
          if (event.request.url.endsWith(".jpg")) {
            return caches.match(fallbackImage);
          }
          if (event.request.url.indexOf("restaurant.html") > -1) {
            return caches.match("restaurant.html");
          }
          return error;
        });
    })
  );
});
