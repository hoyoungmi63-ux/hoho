/* =========================================
   감사숲평생교육원 - 동작 스크립트 (외부 라이브러리 없음)
   ========================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 이메일 주소 조합 (스팸 수집 방지) ---------- */
  var mailUser = ['thanks', 'fore'].join('');
  var mailDomain = ['naver', 'com'].join('.');
  var mailAddress = mailUser + '@' + mailDomain;

  document.querySelectorAll('.js-email').forEach(function (el) {
    el.setAttribute('href', 'mailto:' + mailAddress);
  });
  document.querySelectorAll('.js-email-text').forEach(function (el) {
    el.textContent = mailAddress;
  });

  /* ---------- 2. 햄버거 메뉴 ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');

  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '메뉴 열기');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- 3. 스크롤하면 메뉴 아래 그림자 ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 4. 글자 타이핑 효과 ---------- */
  var typingEl = document.querySelector('.typing');
  if (typingEl && !reduceMotion) {
    var fullText = typingEl.getAttribute('data-text') || typingEl.textContent;
    // 화면 읽기 프로그램은 전체 문장을 한 번에 읽도록
    typingEl.parentNode.setAttribute('aria-label', fullText);
    typingEl.setAttribute('aria-hidden', 'true');
    typingEl.textContent = '';
    typingEl.classList.add('is-typing');

    var i = 0;
    var speed = 70; // 한 글자당 시간(밀리초)
    setTimeout(function typeNext() {
      typingEl.textContent = fullText.slice(0, i + 1);
      i++;
      if (i < fullText.length) {
        setTimeout(typeNext, speed);
      } else {
        setTimeout(function () { typingEl.classList.remove('is-typing'); }, 2400);
      }
    }, 500);
  }

  /* ---------- 5. 숫자 올라가기 ---------- */
  function formatNumber(n) {
    return n.toLocaleString('ko-KR');
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (reduceMotion) { el.textContent = formatNumber(target); return; }
    var duration = 1600;
    var start = null;
    function step(time) {
      if (start === null) start = time;
      var progress = Math.min((time - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // 끝에서 천천히
      el.textContent = formatNumber(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('.count');
  if (!reduceMotion) {
    counters.forEach(function (el) { el.textContent = '0'; });
  }

  /* ---------- 6. 스크롤하면 서서히 나타나기 ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    counters.forEach(countUp);
    return;
  }

  // 같은 줄의 카드들이 차례로 나타나도록 살짝씩 늦추기
  revealEls.forEach(function (el) {
    var siblings = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (c) {
      return c.classList.contains('reveal');
    }) : [];
    var index = siblings.indexOf(el);
    if (index > 0) el.style.transitionDelay = Math.min(index * 0.1, 0.4) + 's';
    el.addEventListener('transitionend', function clearDelay(e) {
      if (e.propertyName === 'opacity') {
        el.style.transitionDelay = '';
        el.removeEventListener('transitionend', clearDelay);
      }
    });
  });

  var revealObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function (el) { revealObserver.observe(el); });

  var countObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { countObserver.observe(el); });
})();
