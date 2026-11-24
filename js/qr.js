/* =========================================
   QR코드 만들기 (외부 라이브러리 없음)
   - 버전 3(29×29칸), 오류 복구 M(약 15%) 고정
   - 영문 주소 기준 42글자까지 넣을 수 있어요.
   사용법: var 칸들 = window.makeQr('https://...');  // 칸들[줄][칸] === true 면 검은 칸
   ========================================= */
(function () {
  'use strict';

  var SIZE = 29;          // 버전 3
  var DATA_WORDS = 44;    // 버전 3-M 데이터 코드워드
  var EC_WORDS = 26;      // 버전 3-M 오류 복구 코드워드

  /* ---------- GF(256) 곱셈 ---------- */
  function gfMul(a, b) {
    var r = 0;
    for (var i = 7; i >= 0; i--) {
      r = (r << 1) ^ ((r >>> 7) * 0x11d);
      r ^= ((b >>> i) & 1) * a;
    }
    return r & 0xff;
  }

  /* ---------- 리드-솔로몬 오류 복구 코드 ---------- */
  function ecWords(data) {
    var gen = [], i, j, root = 1;
    for (i = 0; i < EC_WORDS; i++) gen.push(0);
    gen[EC_WORDS - 1] = 1;
    for (i = 0; i < EC_WORDS; i++) {
      for (j = 0; j < EC_WORDS; j++) {
        gen[j] = gfMul(gen[j], root);
        if (j + 1 < EC_WORDS) gen[j] ^= gen[j + 1];
      }
      root = gfMul(root, 2);
    }
    var rem = [];
    for (i = 0; i < EC_WORDS; i++) rem.push(0);
    data.forEach(function (b) {
      var factor = b ^ rem.shift();
      rem.push(0);
      for (var k = 0; k < EC_WORDS; k++) rem[k] ^= gfMul(gen[k], factor);
    });
    return rem;
  }

  /* ---------- 글자 → 코드워드 ---------- */
  function encode(text) {
    var bytes = Array.prototype.slice.call(new TextEncoder().encode(text));
    if (bytes.length > 42) throw new Error('QR에 넣을 주소가 너무 길어요.');
    var bits = [];
    function push(value, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    }
    push(4, 4);               // 바이트 모드
    push(bytes.length, 8);
    bytes.forEach(function (b) { push(b, 8); });
    push(0, Math.min(4, DATA_WORDS * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    var words = [];
    for (var i = 0; i < bits.length; i += 8) {
      words.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    }
    for (var pad = 0xec; words.length < DATA_WORDS; pad ^= 0xec ^ 0x11) words.push(pad);
    return words.concat(ecWords(words));
  }

  function grid(value) {
    var g = [];
    for (var y = 0; y < SIZE; y++) {
      g.push([]);
      for (var x = 0; x < SIZE; x++) g[y].push(value);
    }
    return g;
  }

  var MASKS = [
    function (x, y) { return (x + y) % 2 === 0; },
    function (x, y) { return y % 2 === 0; },
    function (x) { return x % 3 === 0; },
    function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
    function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
    function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
    function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }
  ];

  /* ---------- 읽기 쉬운 무늬인지 점수 매기기 (낮을수록 좋음) ---------- */
  function penalty(m) {
    var score = 0, x, y, dark = 0;
    function line(get) {
      var run = 1, s = '', i;
      for (i = 0; i < SIZE; i++) {
        s += get(i) ? '1' : '0';
        if (i > 0 && get(i) === get(i - 1)) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score++;
        } else run = 1;
      }
      ['10111010000', '00001011101'].forEach(function (p) {
        for (var at = s.indexOf(p); at !== -1; at = s.indexOf(p, at + 1)) score += 40;
      });
    }
    for (y = 0; y < SIZE; y++) {
      (function (row) {
        line(function (i) { return m[row][i]; });
        line(function (i) { return m[i][row]; });
      })(y);
    }
    for (y = 0; y < SIZE; y++) {
      for (x = 0; x < SIZE; x++) {
        if (m[y][x]) dark++;
        if (x + 1 < SIZE && y + 1 < SIZE && m[y][x] === m[y][x + 1] &&
            m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) score += 3;
      }
    }
    return score + Math.floor(Math.abs(dark * 20 - SIZE * SIZE * 10) / (SIZE * SIZE)) * 10;
  }

  window.makeQr = function (text) {
    var m = grid(false), fixed = grid(false), i, x, y;

    function set(px, py, dark) { m[py][px] = dark; fixed[py][px] = true; }

    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) {
        for (var dx = -4; dx <= 4; dx++) {
          var px = cx + dx, py = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
          if (px >= 0 && py >= 0 && px < SIZE && py < SIZE) set(px, py, d !== 2 && d !== 4);
        }
      }
    }

    function format(mask) {
      var data = mask;              // 오류 복구 M = 00
      var rem = data, b;
      for (b = 0; b < 10; b++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((data << 10) | rem) ^ 0x5412;
      function bit(n) { return ((bits >>> n) & 1) === 1; }
      for (b = 0; b <= 5; b++) set(8, b, bit(b));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (b = 9; b < 15; b++) set(14 - b, 8, bit(b));
      for (b = 0; b < 8; b++) set(SIZE - 1 - b, 8, bit(b));
      for (b = 8; b < 15; b++) set(8, SIZE - 15 + b, bit(b));
      set(8, SIZE - 8, true);
    }

    // 고정 무늬: 점선, 모서리 큰 네모 3개, 작은 네모 1개
    for (i = 0; i < SIZE; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    finder(3, 3); finder(SIZE - 4, 3); finder(3, SIZE - 4);
    for (y = -2; y <= 2; y++) {
      for (x = -2; x <= 2; x++) set(22 + x, 22 + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }
    format(0);

    // 데이터를 지그재그로 채우기
    var words = encode(text), n = 0;
    for (var right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var v = 0; v < SIZE; v++) {
        for (var j = 0; j < 2; j++) {
          x = right - j;
          y = ((right + 1) & 2) === 0 ? SIZE - 1 - v : v;
          if (!fixed[y][x] && n < words.length * 8) {
            m[y][x] = ((words[n >>> 3] >>> (7 - (n & 7))) & 1) === 1;
            n++;
          }
        }
      }
    }

    function applyMask(k) {
      for (var my = 0; my < SIZE; my++) {
        for (var mx = 0; mx < SIZE; mx++) {
          if (!fixed[my][mx] && MASKS[k](mx, my)) m[my][mx] = !m[my][mx];
        }
      }
    }

    var best = 0, bestScore = Infinity;
    for (i = 0; i < 8; i++) {
      applyMask(i); format(i);
      var s = penalty(m);
      if (s < bestScore) { best = i; bestScore = s; }
      applyMask(i);   // 되돌리기
    }
    applyMask(best); format(best);
    return m;
  };
})();
