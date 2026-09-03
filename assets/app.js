/* 資格データ室 ── 動きの実装
   ・スクロールに直結した毎フレーム処理は書かない（P-22）。
     出る仕掛けは IntersectionObserver、視差は CSS の animation-timeline に任せる。
   ・[data-rv] は「高さゼロに切る」形にしない（clip-path: inset(0 0 100% 0) は
     画面に入った割合が必ず 0 になり、本文が一生出てこない事故になる）。
   ・JavaScript が動かない読者にも本文が見えるように、隠すのは js クラスが付いたときだけ。 */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');

  /* 画面の高さ（スマホでアドレスバーが伸縮しても揺れない値）。R-09／P-14 */
  function lvh() { root.style.setProperty('--stable-lvh', (window.innerHeight / 100) + 'px'); }
  lvh();
  var t = null;
  addEventListener('resize', function () { clearTimeout(t); t = setTimeout(lvh, 160); });

  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 見出しを1字ずつ出す（B-07。刻みは 26ms） */
  d.querySelectorAll('[data-ch]').forEach(function (el) {
    var frag = d.createDocumentFragment(), i = 0;
    el.querySelectorAll('.ph').forEach(function (ph) {
      var w = d.createElement('span');
      w.className = 'ph';
      Array.prototype.forEach.call(ph.textContent, function (c) {
        var s = d.createElement('span');
        s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = c;
        w.appendChild(s);
      });
      frag.appendChild(w);
    });
    if (frag.childNodes.length) { el.textContent = ''; el.appendChild(frag); }
  });

  /* 数字が 0 から実際の値まで数え上がる（D-19） */
  function countUp(el) {
    var goal = parseFloat(el.getAttribute('data-count'));
    var dec = (el.getAttribute('data-dec') | 0);
    var ms = 900, t0 = 0;
    if (still) { el.textContent = goal.toFixed(dec); return; }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (goal * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* 出る仕掛け。threshold は 0 にして、切り取られた要素でも必ず通知が来るようにする */
  var seen = new WeakSet();
  function turnOn(el) {
    if (seen.has(el)) return;
    seen.add(el);
    el.setAttribute('data-rv', 'in');
    el.querySelectorAll('[data-count]').forEach(countUp);
  }
  var targets = d.querySelectorAll('[data-rv]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { turnOn(e.target); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(turnOn);
  }
  /* 保険：2.4秒たっても出ていないものは、その場で出す（出る仕掛けの故障を読者に見せない） */
  setTimeout(function () {
    d.querySelectorAll('[data-rv]:not([data-rv="in"])').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 1.2) turnOn(el);
    });
  }, 2400);
})();
