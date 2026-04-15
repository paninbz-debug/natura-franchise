/* =====================================================
   A/B SPLIT · 50/50 · Cookie-persistent

   Подключить: <script src="ab.js"></script> в <head> index.html

   Логика:
   - Новый пользователь → 50% шанс редиректа на /b.html
   - Результат запоминается в cookie на 30 дней
   - Повторный визит → всегда тот же вариант
   - UTM-метки и параметры пробрасываются
   - В Метрике/GA4 → параметр ab_variant: A или B

   Чтобы отключить A/B тест:
   - Удалите <script src="ab.js"></script> из index.html
   - Или удалите файл ab.js
   ===================================================== */

(function(){
  'use strict';

  // Don't run on b.html (it's already variant B)
  if (window.location.pathname.endsWith('/b.html')) return;

  // Check existing cookie
  var match = document.cookie.match(/natura_ab=([AB])/);
  if (match) {
    if (match[1] === 'B') {
      window.location.replace(window.location.href.replace(/index\.html$|$/, 'b.html').replace(/\/b\.html$/, '/b.html'));
    }
    return;
  }

  // Assign variant: 50/50
  var variant = Math.random() < 0.5 ? 'A' : 'B';

  // Set cookie for 30 days
  var expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = 'natura_ab=' + variant + '; expires=' + expires + '; path=/; SameSite=Lax';

  // Push to dataLayer for analytics
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'ab_variant': variant });

  // Redirect B visitors
  if (variant === 'B') {
    var url = window.location.href;
    // Replace index.html or add b.html
    if (url.match(/index\.html/)) {
      url = url.replace('index.html', 'b.html');
    } else {
      // url ends with / or without filename
      url = url.replace(/\/?$/, '/b.html');
    }
    window.location.replace(url);
  }
})();
