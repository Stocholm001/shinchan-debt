// Service Worker — แผนบริหารหนี้ชินจัง (PWA)
// กลยุทธ์: ไฟล์ของแอปเอง = network-first (ดึงของใหม่ก่อน ถ้าออฟไลน์ค่อยใช้แคช)
// -> เวลา push โค้ดใหม่ขึ้น GitHub Pages เครื่องจะเห็นเวอร์ชันล่าสุดเสมอ
// คำขอข้ามโดเมน (Firebase, gstatic, Google Fonts) = ปล่อยผ่าน ไม่แตะ ไม่แคช
// *** เวลาแก้แอปแล้วอยากบังคับล้างแคชเก่า ให้เพิ่มเลขเวอร์ชันด้านล่าง ***
const CACHE = 'shinchan-debt-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // ใช้ allSettled กันไฟล์ใดหายแล้วพังทั้งชุด
    await Promise.allSettled(APP_SHELL.map((u) => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // เขียนข้อมูล (POST ฯลฯ) ปล่อยผ่าน
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // ข้ามโดเมน (Firebase/CDN/ฟอนต์) ปล่อยผ่าน

  // same-origin: network-first, fallback cache, สุดท้าย fallback index.html
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      return cached || (await caches.match('./index.html'));
    }
  })());
});
