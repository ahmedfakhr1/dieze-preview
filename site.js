(function () {
  'use strict';
  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '201225155550';

  /* header logo appears once the large hero logo has scrolled away */
  var hd = $('.hd');
  var heroLogo = $('[data-hero-logo]');
  if (hd && heroLogo && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      hd.classList.toggle('has-logo', !es[0].isIntersecting);
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(heroLogo);
  } else if (hd) {
    hd.classList.add('has-logo');
  }

  /* drawer */
  var drawer = $('.drawer');
  var burger = $('.burger');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    if (open) { drawer.removeAttribute('inert'); } else { drawer.setAttribute('inert', ''); }
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    d.body.style.overflow = open ? 'hidden' : '';
    if (open) { var x = $('.drawer-x'); if (x) x.focus(); } else if (burger && d.activeElement && drawer.contains(d.activeElement)) { burger.focus(); }
  }
  if (drawer) {
    drawer.setAttribute('inert', '');
    if (burger) burger.addEventListener('click', function () { setDrawer(true); });
    $$('[data-drawer-close]').forEach(function (el) { el.addEventListener('click', function () { setDrawer(false); }); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false); });
  }

  /* Arabic note */
  var dlg = $('#ar-dialog');
  $$('[data-ar]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (drawer && drawer.classList.contains('open')) setDrawer(false);
      if (dlg && dlg.showModal) { dlg.showModal(); } else if (dlg) { dlg.setAttribute('open', ''); }
    });
  });
  if (dlg) {
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { if (dlg.close) { dlg.close(); } else { dlg.removeAttribute('open'); } }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
  }

  /* text reveal (never inside an arch) */
  var rv = $$('.rv');
  if (rv.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
      rv.forEach(function (el) { io.observe(el); });
    } else {
      rv.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* bottom bar: hides on scroll down, over the booking section and over the footer */
  var bar = $('.bar');
  if (bar) {
    var over = 0, down = false, lastY = window.scrollY, tick = false;
    var hero = $('.hero');
    var heroIn = !!hero;
    var paint = function () { bar.classList.toggle('hide', over > 0 || down || heroIn); };
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { heroIn = es[0].intersectionRatio > 0.4; paint(); }, { threshold: [0, 0.2, 0.4, 0.6, 1] }).observe(hero);
    } else { heroIn = false; }
    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target.__in = e.isIntersecting; });
        over = $$('#book, .ft').filter(function (n) { return n.__in; }).length;
        paint();
      }, { rootMargin: '0px 0px -56px 0px' });
      $$('#book, .ft').forEach(function (n) { bio.observe(n); });
    }
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY, dy = y - lastY;
        if (Math.abs(dy) > 8) { down = dy > 0 && y > 160; lastY = y; paint(); }
        if (y < 80 && down) { down = false; paint(); }
        tick = false;
      });
    }, { passive: true });
  }

  /* forms to WhatsApp */
  function openWA(text) {
    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) { /* cross-origin */ } } else { window.location.href = url; }
  }
  function pretty(iso) {
    if (!iso) return '';
    var dt = new Date(iso + 'T12:00:00');
    if (isNaN(dt.getTime())) return iso;
    return dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function today() {
    var n = new Date();
    return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2);
  }
  function wire(form, cfg) {
    if (!form) return;
    var date = $('[name=date]', form);
    if (date) date.setAttribute('min', today());
    var guests = $('[name=guests]', form);
    $$('[data-step]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(guests.value, 10) || 1;
        v += parseInt(b.getAttribute('data-step'), 10);
        guests.value = Math.min(60, Math.max(1, v));
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      cfg.required.forEach(function (n) {
        var el = $('[name=' + n + ']', form);
        var f = el.closest('.f');
        var ok = !!el.value.trim();
        f.classList.toggle('bad', !ok);
        if (el.setAttribute) el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      var val = function (n) { var el = $('[name=' + n + ']', form); return el ? el.value.trim() : ''; };
      var checked = function (n) { var el = $('[name=' + n + ']:checked', form); return el ? el.value : ''; };
      openWA(cfg.message(val, checked));
    });
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { var f = el.closest('.f'); if (f) f.classList.remove('bad'); });
    });
  }
  wire($('#book-form'), {
    required: ['name', 'date', 'time'],
    message: function (v, c) {
      var lines = ['Hello Dieze, I would like to book a table.', 'Name: ' + v('name'), 'Date: ' + pretty(v('date')), 'Time: ' + v('time'),
        'Guests: ' + v('guests'), 'Seating: ' + c('where')];
      if (v('note')) lines.push('Note: ' + v('note'));
      return lines.join('\n');
    }
  });
  wire($('#event-form'), {
    required: ['name'],
    message: function (v, c) {
      var lines = ['Hello Dieze, I would like to ask about ' + (c('kind') === 'A private table' ? 'a private table.' : 'an event.'), 'Name: ' + v('name')];
      if (v('date')) lines.push('Date: ' + pretty(v('date')));
      lines.push('Guests: ' + v('guests'));
      if (v('note')) lines.push('Note: ' + v('note'));
      return lines.join('\n');
    }
  });

  /* menu chips: scroll spy */
  var chips = $$('.chip');
  var chipBox = $('.chips-in');
  if (chips.length && 'IntersectionObserver' in window) {
    var secs = $$('.msec');
    var vis = [];
    var setChip = function (id, scrollChip) {
      chips.forEach(function (c) {
        var on = c.getAttribute('data-chip') === id;
        c.classList.toggle('on', on);
        if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
        if (on && scrollChip && chipBox) {
          var left = c.offsetLeft - (chipBox.clientWidth - c.offsetWidth) / 2;
          chipBox.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    };
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = vis.indexOf(e.target);
        if (e.isIntersecting && i < 0) vis.push(e.target);
        if (!e.isIntersecting && i >= 0) vis.splice(i, 1);
      });
      if (!vis.length) return;
      vis.sort(function (a, b) { return secs.indexOf(a) - secs.indexOf(b); });
      setChip(vis[vis.length - 1].getAttribute('data-chip'), true);
    }, { rootMargin: '-150px 0px -62% 0px' });
    secs.forEach(function (s) { spy.observe(s); });
    chips.forEach(function (c) { c.addEventListener('click', function () { setChip(c.getAttribute('data-chip'), false); }); });
    setChip(chips[0].getAttribute('data-chip'), false);
  }
})();
