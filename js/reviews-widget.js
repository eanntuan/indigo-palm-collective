(function () {
  var css = '.ipr{background:#1E0B3A;color:#F5F3EE;padding:64px 0;text-align:center;font-family:"Work Sans",system-ui,sans-serif}'
  + '.ipr h2{font-family:"Cormorant Garamond",serif;font-weight:600;font-size:clamp(28px,4vw,42px);color:#FEAD26;margin:0 16px 16px}'
  + '.ipr-stars{color:#FEAD26;letter-spacing:3px;font-size:32px;line-height:1}'
  + '.ipr-sub{margin:8px 0 32px;font-size:15px;opacity:.85}'
  + '.ipr-wrap{position:relative;max-width:1240px;margin:0 auto;padding:0 56px}'
  + '.ipr-track{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:4px 0}'
  + '.ipr-track::-webkit-scrollbar{display:none}'
  + '.ipr-card{flex:0 0 calc((100% - 60px)/4);min-width:260px;scroll-snap-align:start;background:#F5F3EE;color:#2b2233;border-radius:16px;padding:22px;text-align:left;box-sizing:border-box}'
  + '.ipr-head{display:flex;align-items:center;gap:12px}'
  + '.ipr-av{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:18px;flex:none}'
  + '.ipr-name{font-weight:600;font-size:16px}.ipr-date{font-size:13px;color:#777}'
  + '.ipr-cs{color:#FEAD26;font-size:18px;letter-spacing:2px;margin:12px 0 8px}'
  + '.ipr-text{font-size:15px;line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}'
  + '.ipr-card.open .ipr-text{display:block}'
  + '.ipr-more{background:none;border:0;padding:0;margin-top:10px;font:inherit;font-size:14px;color:#777;cursor:pointer;text-decoration:underline}'
  + '.ipr-btn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:#F5F3EE;color:#1E0B3A;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}'
  + '.ipr-prev{left:6px}.ipr-next{right:6px}'
  + '@media(max-width:1000px){.ipr-card{flex-basis:calc((100% - 20px)/2)}}'
  + '@media(max-width:640px){.ipr-wrap{padding:0 16px}.ipr-card{flex-basis:85%}.ipr-btn{display:none}}';
  var colors = ['#4B0082', '#B67550', '#607c67', '#325CD9', '#8B4513'];
  var HEAD = {'terra-luz': 'What guests say after Terra Luz', 'cozy-cactus': 'What guests say after the Cozy Cactus',
    'the-sundune': 'What guests say after the Sundune', all: 'What our guests say about their desert stay'};

  function ago(iso) {
    var d = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5));
    if (d < 14) return 'This week';
    if (d < 60) return Math.round(d / 7) + ' weeks ago';
    if (d < 365) return Math.round(d / 30) + ' months ago';
    return Math.round(d / 365) + (d < 548 ? ' year ago' : ' years ago');
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  fetch('/_content/reviews.json').then(function (r) { return r.json(); }).then(function (data) {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.querySelectorAll('[data-reviews]').forEach(function (host) {
      var key = host.getAttribute('data-reviews'), props = key === 'all' ? Object.keys(data) : [key];
      var list = [], ratings = [];
      props.forEach(function (p) { if (data[p] && data[p].reviews.length) { list = list.concat(data[p].reviews); ratings.push(parseFloat(data[p].summary.rating)); } });
      if (!list.length) return;
      list.sort(function (a, b) { return b.date.localeCompare(a.date); });
      list = list.slice(0, 12);
      var sec = el('section', 'ipr');
      sec.appendChild(el('h2', '', host.getAttribute('data-heading') || HEAD[key]));
      sec.appendChild(el('div', 'ipr-stars', '★★★★★'));
      var s = data[key] && data[key].summary;
      if (!s) { var all = Object.keys(data).map(function (k) { return data[k].summary; }), n = 0, sum = 0; all.forEach(function (x) { n += x.count; sum += x.count * parseFloat(x.rating); }); s = { rating: (sum / n).toFixed(2), count: n }; }
      sec.appendChild(el('p', 'ipr-sub', s.rating + ' stars from ' + s.count + ' reviews on Airbnb'));
      var wrap = el('div', 'ipr-wrap'), track = el('div', 'ipr-track');
      list.forEach(function (r, i) {
        var c = el('article', 'ipr-card'), h = el('div', 'ipr-head');
        var av = el('div', 'ipr-av', r.name[0].toUpperCase()); av.style.background = colors[i % colors.length];
        var who = el('div'); who.appendChild(el('div', 'ipr-name', r.name)); who.appendChild(el('div', 'ipr-date', ago(r.date)));
        h.appendChild(av); h.appendChild(who); c.appendChild(h);
        c.appendChild(el('div', 'ipr-cs', '★★★★★')); c.appendChild(el('p', 'ipr-text', r.text));
        var more = el('button', 'ipr-more', 'Read more'); more.type = 'button';
        more.onclick = function () { c.classList.toggle('open'); more.textContent = c.classList.contains('open') ? 'Show less' : 'Read more'; };
        c.appendChild(more); track.appendChild(c);
      });
      [['ipr-prev', '‹', -1, 'Previous reviews'], ['ipr-next', '›', 1, 'Next reviews']].forEach(function (b) {
        var btn = el('button', 'ipr-btn ' + b[0], b[1]); btn.type = 'button'; btn.setAttribute('aria-label', b[3]);
        btn.onclick = function () { track.scrollBy({ left: b[2] * track.clientWidth * 0.8, behavior: 'smooth' }); };
        wrap.appendChild(btn);
      });
      wrap.appendChild(track); sec.appendChild(wrap); host.replaceWith(sec);
    });
  }).catch(function () {});
})();
