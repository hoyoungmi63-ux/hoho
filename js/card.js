/* =========================================
   나의 디지털 명함 (외부 라이브러리 없음)
   명함 내용을 바꾸려면 아래 INFO 와 index.html 의 '나의 디지털 명함' 부분을 함께 고쳐 주세요.
   ========================================= */
(function () {
  'use strict';

  var INFO = {
    org: '감사숲평생교육원',
    slogan: '감사 한 줄이 삶을 바꿔요',
    familyName: '호',
    givenName: '영미',
    title: '원장',
    role: '감사교육 전문가 · 평생교육 기획자',
    phone: '010-2166-1141',
    email: ['thanks', 'fore'].join('') + '@' + ['naver', 'com'].join('.'),
    site: 'https://thanksfore.netlify.app/',
    blog: 'https://blog.naver.com/thanksfore',
    city: '인천시',
    district: '부평구',
    street: '충선로203번길 24 4층 405-3호',
    photo: 'images/profile.jpg',
    fileName: 'gamsasup-hoyoungmi-card'
  };
  var FULL_NAME = INFO.familyName + INFO.givenName;
  var SITE_LABEL = INFO.site.replace(/^https?:\/\//, '').replace(/\/$/, '');
  var ADDRESS = [INFO.city, INFO.district, INFO.street].join(' ');

  var dialog = document.getElementById('bizcard');
  var openBtn = document.querySelector('.bizcard-open');
  if (!dialog || !openBtn) return;
  if (typeof dialog.showModal !== 'function' || typeof window.makeQr !== 'function') {
    openBtn.style.display = 'none';   // 아주 오래된 브라우저
    return;
  }

  var wrap = dialog.querySelector('.bizcard-wrap');
  var msg = dialog.querySelector('.bizcard-msg');
  var preview = dialog.querySelector('.bizcard-preview');
  var previewImg = dialog.querySelector('.bizcard-preview-img');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ua = navigator.userAgent;
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  // 카카오톡·네이버·인스타그램 등 앱 안 브라우저는 파일 저장을 막는 경우가 많아요
  var isInApp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|\bLine\//i.test(ua);

  /* ---------- 1. 열기·닫기 ---------- */
  var closing = 0;
  function openCard() {
    if (dialog.open) return;
    msg.textContent = '';
    preview.hidden = true;
    dialog.showModal();
    dialog.scrollTop = 0;
    document.documentElement.classList.add('bizcard-lock');
    prepareImage().catch(function () { /* 저장 버튼을 누를 때 다시 시도 */ });
    preparePhoto().catch(function () { /* 사진 없이도 연락처는 저장 가능 */ });
  }

  function finishClose() {
    clearTimeout(closing);
    closing = 0;
    dialog.classList.remove('is-closing');
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('bizcard-lock');
    openBtn.focus({ preventScroll: true });
  }

  function closeCard() {
    if (!dialog.open || closing) return;
    if (reduceMotion) { finishClose(); return; }
    dialog.classList.add('is-closing');
    closing = setTimeout(finishClose, 300);
  }

  openBtn.addEventListener('click', openCard);
  dialog.querySelector('.bizcard-close').addEventListener('click', closeCard);
  dialog.addEventListener('click', function (e) { if (!wrap.contains(e.target)) closeCard(); });
  dialog.addEventListener('cancel', function (e) {
    e.preventDefault();
    if (!preview.hidden) hidePreview(); else closeCard();
  });

  /* ---------- 2. QR코드 ---------- */
  var qr = window.makeQr(INFO.site);

  // 둘레에 흰 여백 4칸을 포함해서 그려요 (여백이 있어야 잘 읽혀요)
  function drawQr(ctx, x, y, size) {
    var total = qr.length + 8;
    var cell = Math.floor(size / total);
    var offset = Math.floor((size - cell * qr.length) / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#2B1A0F';
    qr.forEach(function (row, r) {
      row.forEach(function (dark, c) {
        if (dark) ctx.fillRect(x + offset + c * cell, y + offset + r * cell, cell, cell);
      });
    });
  }

  var qrCanvas = dialog.querySelector('.bizcard-qr-canvas');
  drawQr(qrCanvas.getContext('2d'), 0, 0, qrCanvas.width);

  /* ---------- 3. 명함 이미지 그리기 (1080×1350) ---------- */
  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('사진을 불러오지 못했어요.')); };
      img.src = src;
    });
  }

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var all = Object.keys(INFO).map(function (k) { return INFO[k]; }).join('') + '홈페이지 QR';
    var fonts = Promise.all(['400', '500', '700', '900'].map(function (w) {
      return document.fonts.load(w + ' 40px "Noto Sans KR"', all);
    }));
    var limit = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    return Promise.race([fonts, limit]).catch(function () { /* 기본 글꼴로 그리기 */ });
  }

  // 사진에서 정사각형으로 자를 부분 (얼굴 위주)
  function cropOf(img) {
    var side = Math.min(img.naturalWidth, img.naturalHeight);
    return { x: (img.naturalWidth - side) / 2, y: (img.naturalHeight - side) * 0.15, side: side };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function circle(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function text(ctx, str, x, y, weight, size, color, align) {
    ctx.font = weight + ' ' + size + 'px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
    return ctx.measureText(str).width;
  }

  // 화면 명함과 같은 아이콘 모양을 그대로 사용
  function icon(ctx, svg, x, y, size) {
    ctx.save();
    ctx.translate(x, y - size / 2);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = '#B85A1A';
    ctx.fill(new Path2D(svg.querySelector('path').getAttribute('d')));
    ctx.restore();
  }

  function drawCard(photo) {
    var W = 1080, H = 1350;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FBF6EF';
    ctx.fillRect(0, 0, W, H);

    // 위쪽 주황 띠
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, 370);
    ctx.clip();
    var g = ctx.createLinearGradient(0, 0, W, 370);
    g.addColorStop(0, '#8A3F0C'); g.addColorStop(0.6, '#B85A1A'); g.addColorStop(1, '#C96A20');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 370);
    circle(ctx, 80, 20, 290, 'rgba(255,255,255,0.09)');
    circle(ctx, 980, 390, 230, 'rgba(255,255,255,0.09)');
    ctx.restore();
    text(ctx, INFO.org, W / 2, 100, 900, 62, '#FFFFFF');
    text(ctx, INFO.slogan, W / 2, 172, 400, 36, '#FFFFFF');

    // 동그란 사진
    circle(ctx, W / 2, 390, 176, '#FBF6EF');
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, 390, 160, 0, Math.PI * 2);
    ctx.clip();
    var c = cropOf(photo);
    ctx.drawImage(photo, c.x, c.y, c.side, c.side, W / 2 - 160, 230, 320, 320);
    ctx.restore();

    // 이름과 직함 (두 글자 크기를 합쳐서 가운데 맞춤)
    ctx.font = '900 100px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    var nameW = ctx.measureText(FULL_NAME).width;
    ctx.font = '700 54px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    var titleW = ctx.measureText(INFO.title).width;
    var left = (W - nameW - 24 - titleW) / 2;
    text(ctx, FULL_NAME, left, 644, 900, 100, '#3B2A1E', 'left');
    text(ctx, INFO.title, left + nameW + 24, 660, 700, 54, '#B85A1A', 'left');
    text(ctx, INFO.role, W / 2, 736, 400, 38, '#6B5442');

    ctx.fillStyle = '#E9D8C0';
    ctx.fillRect(80, 796, W - 160, 3);

    // 연락처
    var icons = dialog.querySelectorAll('.bizcard-list svg');
    [[INFO.phone, 700, 48], [INFO.email, 500, 37], [SITE_LABEL, 500, 37]].forEach(function (row, n) {
      var y = 900 + n * 104;
      icon(ctx, icons[n], 84, y, 52);
      text(ctx, row[0], 156, y, row[1], row[2], '#3B2A1E', 'left');
    });

    // QR코드
    var qrSize = 333, qx = W - 80 - qrSize, qy = 832;
    ctx.save();
    ctx.shadowColor = 'rgba(59,42,30,0.14)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;
    roundRect(ctx, qx - 8, qy - 8, qrSize + 16, qrSize + 16, 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
    drawQr(ctx, qx, qy, qrSize);
    text(ctx, '홈페이지 QR', qx + qrSize / 2, qy + qrSize + 40, 700, 32, '#96470F');

    // 주소
    ctx.fillStyle = '#F4EADB';
    ctx.fillRect(0, H - 110, W, 110);
    ctx.font = '400 36px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    var addrW = ctx.measureText(ADDRESS).width;
    var ax = (W - addrW - 56) / 2;
    icon(ctx, dialog.querySelector('.bizcard-addr svg'), ax, H - 55, 44);
    text(ctx, ADDRESS, ax + 56, H - 55, 400, 36, '#3B2A1E', 'left');
    return canvas;
  }

  var imageReady = null;   // 한 번 만들면 다시 사용
  function prepareImage() {
    if (!imageReady) {
      imageReady = Promise.all([loadImage(INFO.photo), loadFonts()]).then(function (r) {
        var canvas = drawCard(r[0]);
        return new Promise(function (resolve, reject) {
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('이미지를 만들지 못했어요.')); return; }
            resolve({ blob: blob, canvas: canvas });
          }, 'image/png');
        });
      });
      imageReady.catch(function () { imageReady = null; });
    }
    return imageReady;
  }

  /* ---------- 4. 저장 ---------- */
  function say(str) { msg.textContent = str; }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
  }

  function showPreview(canvas) {
    previewImg.src = canvas.toDataURL('image/png');
    preview.hidden = false;
    dialog.scrollTop = 0;
    preview.querySelector('button').focus({ preventScroll: true });
  }

  function hidePreview() {
    preview.hidden = true;
    dialog.querySelector('[data-card="image"]').focus({ preventScroll: true });
  }

  function saveImage() {
    return prepareImage().then(function (r) {
      if (isInApp) { showPreview(r.canvas); return; }
      if (isIOS) {
        // 아이폰: 공유 창에서 '이미지 저장'을 누르면 사진첩에 저장돼요
        var file = new File([r.blob], INFO.fileName + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          return navigator.share({ files: [file] }).catch(function (err) {
            if (err && err.name === 'AbortError') return;
            showPreview(r.canvas);
          });
        }
        showPreview(r.canvas);
        return;
      }
      download(r.blob, INFO.fileName + '.png');
      say('명함 이미지를 저장했어요. 다운로드 폴더를 확인해 주세요.');
    });
  }

  // 연락처(vCard 3.0)에 넣을 작은 사진
  var photoReady = null;
  function preparePhoto() {
    if (!photoReady) {
      photoReady = loadImage(INFO.photo).then(function (img) {
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 320;
        var c = cropOf(img);
        canvas.getContext('2d').drawImage(img, c.x, c.y, c.side, c.side, 0, 0, 320, 320);
        return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      });
      photoReady.catch(function () { photoReady = null; });
    }
    return photoReady;
  }

  function esc(v) { return v.replace(/\\/g, '\\\\').replace(/([;,])/g, '\\$1'); }

  function makeVcard(photo) {
    var lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:' + esc(INFO.familyName) + ';' + esc(INFO.givenName) + ';;;',
      'FN:' + esc(FULL_NAME),
      'ORG:' + esc(INFO.org),
      'TITLE:' + esc(INFO.title),
      'TEL;TYPE=CELL,VOICE:' + INFO.phone,
      'EMAIL;TYPE=INTERNET:' + INFO.email,
      'URL:' + INFO.site,
      'URL:' + INFO.blog,
      'ADR;TYPE=WORK:;;' + esc(INFO.street) + ';' + esc(INFO.district) + ';' + esc(INFO.city) + ';;',
      'NOTE:' + esc(INFO.role)
    ];
    if (photo) {
      // 긴 줄은 75글자마다 나누고 다음 줄을 빈칸으로 시작 (vCard 규칙)
      var line = 'PHOTO;ENCODING=b;TYPE=JPEG:' + photo;
      var parts = [line.slice(0, 75)];
      for (var i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74));
      lines.push(parts.join('\r\n'));
    }
    lines.push('END:VCARD', '');
    return lines.join('\r\n');
  }

  function saveContact() {
    if (isInApp) {
      // 앱 안 브라우저는 미리 올려 둔 연락처 파일을 바로 열기
      say('연락처 파일이 열리지 않으면, 메뉴(⋮)에서 다른 브라우저로 열어 주세요.');
      window.location.href = 'contact.vcf';
      return Promise.resolve();
    }
    return preparePhoto().catch(function () { return ''; }).then(function (photo) {
      download(new Blob([makeVcard(photo)], { type: 'text/vcard;charset=utf-8' }), INFO.fileName + '.vcf');
      say('연락처 파일을 저장했어요. 파일을 열면 연락처에 추가돼요.');
    });
  }

  dialog.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-card]');
    if (!btn) return;
    var kind = btn.getAttribute('data-card');
    if (kind === 'preview-close') { hidePreview(); return; }
    btn.disabled = true;
    say('');
    (kind === 'image' ? saveImage() : saveContact()).catch(function () {
      say('저장하지 못했어요. 잠시 후 다시 눌러 주세요.');
    }).then(function () { btn.disabled = false; });
  });
})();
