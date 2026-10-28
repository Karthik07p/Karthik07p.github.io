/* Shared behaviour: theme toggle, Selected Work filter, slide viewers, scroll reveals. No dependencies. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // ---- theme: follows the system until the visitor picks one, then remembers it ----
  function current() {
    return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  var sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  document.querySelectorAll('.theme-btn').forEach(function (btn) {
    function paint() {
      var dark = current() === 'dark';
      btn.innerHTML = (dark ? sun : moon) + '<span>' + (dark ? 'Light' : 'Dark') + '</span>';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      paint();
    });
    paint();
  });

  // ---- Selected Work filter ----
  var group = document.getElementById('work-filter');
  if (group) {
    var rows = [].slice.call(document.querySelectorAll('#work [data-cats]'));
    var chips = [].slice.call(group.querySelectorAll('button[data-filter]'));
    var count = document.getElementById('work-count');
    function has(r, v) { return v === 'all' || r.dataset.cats.split(' ').indexOf(v) > -1; }
    // add the number of projects to each chip
    chips.forEach(function (b) {
      var n = rows.filter(function (r) { return has(r, b.dataset.filter); }).length;
      b.insertAdjacentHTML('beforeend', ' <i aria-hidden="true">' + n + '</i>');
      b.setAttribute('aria-label', b.textContent.replace(/\s*\d+$/, '') + ', ' + n + (n === 1 ? ' project' : ' projects'));
    });
    function apply(v) {
      var shown = 0;
      chips.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filter === v ? 'true' : 'false'); });
      rows.forEach(function (r) { var on = has(r, v); r.hidden = !on; if (on) shown++; });
      if (count) count.textContent = shown + (shown === 1 ? ' project' : ' projects');
    }
    chips.forEach(function (b) { b.addEventListener('click', function () { apply(b.dataset.filter); }); });
    // left/right arrows move between chips, like a toolbar
    group.addEventListener('keydown', function (e) {
      var i = chips.indexOf(document.activeElement);
      if (i < 0 || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      chips[(i + (e.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length].focus();
      e.preventDefault();
    });
    apply('all');
  }

  // ---- slide viewer: one slide at a time, arrows and keys ----
  document.querySelectorAll('.slides').forEach(function (box) {
    var imgs = [].slice.call(box.querySelectorAll('.slide'));
    var i = 0, label = box.querySelector('.slides-count');
    function show(n) {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) { im.hidden = k !== i; });
      if (label) label.textContent = (i + 1) + ' / ' + imgs.length;
    }
    box.querySelector('.prev').addEventListener('click', function () { show(i - 1); });
    box.querySelector('.next-s').addEventListener('click', function () { show(i + 1); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
    show(0);
  });

  // ---- ticker: repeat the list once so the loop is seamless ----
  document.querySelectorAll('.ticker ul').forEach(function (ul) {
    [].slice.call(ul.children).forEach(function (li) {
      var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.appendChild(c);
    });
  });

  // ---- reveal on scroll, and count numbers up the first time they show ----
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el) {
    var end = parseFloat(el.dataset.count), t0 = null, dur = 1100;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.firstChild.nodeValue = Math.round(end * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var items = document.querySelectorAll('.reveal, [data-count]');
  if (still || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.dataset.count) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
