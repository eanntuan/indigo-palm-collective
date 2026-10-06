(function () {
  var CORAL = '#FF385C';
  var css = '.ipr{background:#0B0F3B;color:#fff;padding:56px 0 64px;text-align:center;font-family:"Jost",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}'
  + '.ipr.ipr-clear{background:transparent}'
  + '.ipr *{box-sizing:border-box}'
  + '.ipr h2{font-family:"Jost",system-ui,sans-serif;font-weight:500;font-size:clamp(26px,3.6vw,46px);line-height:1.15;color:#fff;margin:0 16px 22px;letter-spacing:.2px}'
  + '.ipr-bigstars{display:flex;justify-content:center;gap:4px}'
  + '.ipr-bigstars svg{width:clamp(28px,3.2vw,40px);height:clamp(28px,3.2vw,40px);fill:' + CORAL + '}'
  + '.ipr-logo{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:6px;color:' + CORAL + '}'
  + '.ipr-logo svg{width:34px;height:34px}'
  + '.ipr-logo span{font-weight:600;font-size:34px;line-height:1;letter-spacing:-.5px;margin-top:-3px}'
  + '.ipr-sub{margin:10px 16px 36px;font-size:14px;color:rgba(255,255,255,.72)}'
  + '.ipr-wrap{position:relative;max-width:1400px;margin:0 auto;padding:0 28px}'
  + '.ipr-track{display:flex;gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:2px 0;scroll-behavior:smooth;align-items:stretch}'
  + '.ipr-track::-webkit-scrollbar{display:none}'
  + '.ipr-card{flex:0 0 calc((100% - 72px)/4);scroll-snap-align:start;background:#F4F4F4;color:#3b3b3b;border-radius:16px;padding:28px 30px 24px;text-align:left;display:flex;flex-direction:column;font-family:"Jost",system-ui,sans-serif}'
  + '.ipr-head{display:flex;align-items:center;gap:14px;position:relative}'
  + '.ipr-av{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:500;font-size:24px;flex:none}'
  + '.ipr-name{font-weight:600;font-size:19px;color:#111;line-height:1.2}.ipr-date{font-size:16px;color:#777;line-height:1.3;margin-top:2px}'
  + '.ipr-mark{position:absolute;right:0;top:2px;width:30px;height:30px;color:' + CORAL + '}'
  + '.ipr-cs{display:flex;align-items:center;gap:2px;margin:14px 0 14px}'
  + '.ipr-cs svg{width:20px;height:20px;fill:' + CORAL + '}'
  + '.ipr-cs .ipr-ver{width:20px;height:20px;margin-left:8px}'
  + '.ipr-text{font-size:17px;line-height:1.5;margin:0;color:#3b3b3b;white-space:pre-line;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}'
  + '.ipr-card.open .ipr-text{display:block;overflow:visible}'
  + '.ipr-more{align-self:flex-start;background:none;border:0;padding:4px 0;margin-top:auto;padding-top:14px;font:inherit;font-size:16px;color:#6b6b6b;cursor:pointer}'
  + '.ipr-more:hover{color:#111;text-decoration:underline}'
  + '.ipr-more.ipr-hide{visibility:hidden}'
  + '.ipr-btn{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;border:0;background:#fff;color:#222;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:0;z-index:2}'
  + '.ipr-btn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}'
  + '.ipr-btn[hidden]{display:none}'
  + '.ipr-prev{left:6px}.ipr-next{right:6px}'
  + '.ipr-btn:focus-visible,.ipr-more:focus-visible{outline:3px solid #6ea8ff;outline-offset:2px}'
  + '@media(max-width:1100px){.ipr-card{flex-basis:calc((100% - 24px)/2)}}'
  + '@media(max-width:640px){.ipr{padding:44px 0 48px}.ipr-wrap{padding:0 0 0 16px}.ipr-track{gap:14px;padding-right:16px;scroll-padding-left:0}.ipr-card{flex-basis:calc((100% - 16px)/1.15);padding:22px 20px 20px}.ipr-btn{display:none}}'
  + '@media(prefers-reduced-motion:reduce){.ipr-track{scroll-behavior:auto}}';
  var colors = ['#5B4B8A', '#B67550', '#4F7A67', '#325CD9', '#8B4513', '#A04668'];
  var HEAD = {'terra-luz': 'What Our Guests Say About Their Terra Luz Stay', 'cozy-cactus': 'What Our Guests Say About Their Cozy Cactus Stay',
    'the-sundune': 'What Our Guests Say About Their Palm Springs Stay', all: 'What Our Guests Say About Their Desert Vacation'};
  var NS = 'http://www.w3.org/2000/svg';
  var STAR = 'M12 1.8l3 6.8 7.4.7-5.6 4.9 1.7 7.3L12 17.7 5.5 21.5l1.7-7.3L1.6 9.3 9 8.6z';
  var MARK = 'M16 26.2c-2.6-3-5.6-7.400-5.600-11.200a5.600 5.600 0 0 1 11.200 0c0 3.800-3 8.200-5.600 11.200zM16 26.2c-1.800 1.900-3.800 3.300-5.800 3.300-2.800 0-4.800-2.200-4.800-4.800 0-1 .4-2 .8-3L12.200 6.400C13.300 3.800 14.600 2.600 16 2.600s2.700 1.200 3.800 3.800l6 15.300c.4 1 .8 2 .8 3 0 2.600-2 4.800-4.800 4.800-2 0-4-1.400-5.800-3.300z';

  function svg(vb, attrs, paths) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('aria-hidden', 'true');
    for (var k in attrs) s.setAttribute(k, attrs[k]);
    paths.forEach(function (p) { var e = document.createElementNS(NS, 'path'); for (var a in p) e.setAttribute(a, p[a]); s.appendChild(e); });
    return s;
  }
  function star() { return svg('0 0 24 24', {}, [{ d: STAR }]); }
  function stars(n, cls) { var d = el('div', cls); for (var i = 0; i < n; i++) d.appendChild(star()); return d; }
  function mark(cls) { var s = svg('0 0 32 32', { fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linejoin': 'round' }, [{ d: MARK }]); if (cls) s.setAttribute('class', cls); return s; }
  function verified() {
    var s = svg('0 0 24 24', { 'class': 'ipr-ver' }, [{ d: 'M12 1.5l2.5 2 3.200-.3 1.200 3 2.900 1.400-.7 3.100 1.400 2.900-2.300 2.200-.3 3.200-3.100.8-2 2.500L12 20.800l-3 1.500-1.600-2.700-3.200-.6-.2-3.200L1.800 13l1.300-2.900-.1-3.200 3-1.100L7.700 3.100l3.100.1z', fill: '#2F7BF5' }, { d: 'M7.700 12.300l3 3 5.600-6', fill: 'none', stroke: '#fff', 'stroke-width': '2.300', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }]);
    return s;
  }
  function arrow(dir) { return svg('0 0 24 24', {}, [{ d: dir < 0 ? 'M15 4l-8 8 8 8' : 'M9 4l8 8-8 8' }]); }
  function ago(iso) {
    var d = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5));
    function u(n, w) { return n + ' ' + w + (n === 1 ? '' : 's') + ' ago'; }
    if (d < 60) return u(Math.max(1, Math.round(d / 7)), 'week');
    if (d < 365) return u(Math.round(d / 30), 'month');
    return u(Math.floor(d / 365), 'year');
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  if (!document.getElementById('ipr-font')) {
    var lk = document.createElement('link'); lk.id = 'ipr-font'; lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@500;600&display=swap'; document.head.appendChild(lk);
  }

  fetch('/_content/reviews.json').then(function (r) { return r.json(); }).then(function (data) {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.querySelectorAll('[data-reviews]').forEach(function (host) {
      var key = host.getAttribute('data-reviews'), props = key === 'all' ? Object.keys(data) : [key];
      var list = [];
      props.forEach(function (p) { if (data[p] && data[p].reviews.length) list = list.concat(data[p].reviews); });
      if (!list.length) return;
      list.sort(function (a, b) { return b.date.localeCompare(a.date); });
      list = list.slice(0, 12);
      var sec = el('section', 'ipr' + (host.hasAttribute('data-transparent') ? ' ipr-clear' : ''));
      sec.setAttribute('aria-label', 'Guest reviews');
      sec.appendChild(el('h2', '', host.getAttribute('data-heading') || HEAD[key]));
      var bs = stars(5, 'ipr-bigstars'); bs.setAttribute('role', 'img'); bs.setAttribute('aria-label', '5 out of 5 stars'); sec.appendChild(bs);
      var logo = el('div', 'ipr-logo'); logo.appendChild(mark()); logo.appendChild(el('span', '', 'airbnb')); sec.appendChild(logo);
      var s = data[key] && data[key].summary;
      if (!s) { var n = 0, sum = 0; Object.keys(data).forEach(function (k) { var x = data[k].summary; n += x.count; sum += x.count * parseFloat(x.rating); }); s = { rating: (sum / n).toFixed(2), count: n }; }
      sec.appendChild(el('p', 'ipr-sub', s.rating + ' stars from ' + s.count + ' reviews on Airbnb'));
      var wrap = el('div', 'ipr-wrap'), track = el('div', 'ipr-track'), mores = [];
      track.setAttribute('tabindex', '0'); track.setAttribute('role', 'region'); track.setAttribute('aria-label', 'Guest reviews, scroll horizontally');
      list.forEach(function (r, i) {
        var c = el('article', 'ipr-card'), h = el('div', 'ipr-head');
        var av = el('div', 'ipr-av', r.name[0].toUpperCase()); av.style.background = colors[i % colors.length];
        var who = el('div'); who.appendChild(el('div', 'ipr-name', r.name)); who.appendChild(el('div', 'ipr-date', ago(r.date)));
        h.appendChild(av); h.appendChild(who); h.appendChild(mark('ipr-mark')); c.appendChild(h);
        var cs = stars(5, 'ipr-cs'); cs.appendChild(verified()); cs.setAttribute('role', 'img'); cs.setAttribute('aria-label', '5 out of 5 stars, verified Airbnb review'); c.appendChild(cs);
        var tx = el('p', 'ipr-text', r.text); c.appendChild(tx);
        var more = el('button', 'ipr-more', 'Read more'); more.type = 'button'; more.setAttribute('aria-expanded', 'false');
        more.onclick = function () { var o = c.classList.toggle('open'); more.textContent = o ? 'Show less' : 'Read more'; more.setAttribute('aria-expanded', o); };
        mores.push([tx, more, c]); c.appendChild(more); track.appendChild(c);
      });
      var prev = el('button', 'ipr-btn ipr-prev'), next = el('button', 'ipr-btn ipr-next');
      [[prev, -1, 'Previous reviews'], [next, 1, 'Next reviews']].forEach(function (b) {
        b[0].type = 'button'; b[0].setAttribute('aria-label', b[2]); b[0].appendChild(arrow(b[1]));
        b[0].onclick = function () { track.scrollBy({ left: b[1] * track.clientWidth * 0.8 }); };
        wrap.appendChild(b[0]);
      });
      function sync() {
        prev.hidden = track.scrollLeft < 8;
        next.hidden = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
        mores.forEach(function (m) { if (!m[2].classList.contains('open')) m[1].classList.toggle('ipr-hide', m[0].scrollHeight <= m[0].clientHeight + 1); });
      }
      track.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync);
      wrap.appendChild(track); sec.appendChild(wrap); host.replaceWith(sec);
      sync(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    });
  }).catch(function () {});
})();
