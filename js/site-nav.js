// Mobile menu behavior for nav.ip-nav (same logic as the homepage inline script).
(function () {
  var toggle = document.getElementById('mobileMenuToggle');
  var close = document.getElementById('mobileMenuClose');
  var menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;
  function closeMenu() {
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    menu.classList.remove('active');
  }
  toggle.addEventListener('click', function () {
    var open = toggle.classList.toggle('active');
    menu.classList.toggle('active');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  if (close) close.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !toggle.contains(e.target) && !(close && close.contains(e.target)) && menu.classList.contains('active')) closeMenu();
  });
})();
