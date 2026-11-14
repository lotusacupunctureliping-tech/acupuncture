// Service worker for the booking app (scope /book). Network first, cache fallback for offline.
var CACHE='lotus-book-v1';
var ASSETS=['/book.html','/style.css?v=pink30','/book.css?v=1','/book.js?v=1','/header-logo.png','/images/app/icon-192.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);if(u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(CACHE).then(function(ca){ca.put(e.request,c)});return r}).catch(function(){return caches.match(e.request,{ignoreSearch:false}).then(function(m){return m||caches.match('/book.html')})}));
});
