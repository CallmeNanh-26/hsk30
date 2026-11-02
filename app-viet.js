/* Cach viet chu: thu tu net (hoat anh + tung buoc) va tap viet, dung thu vien Hanzi Writer (vendor/) */
'use strict';

// File du lieu net viet, nap khi mo chi tiet tu lan dau. Them cap moi: them ten file vao day.
var STROKE_FILES = ['data/net/hsk1.js', 'data/net/hsk2.js'];
var SV = { ready: null, writers: [], w: null };

function svLoad(src) {
  return new Promise(function (ok, bad) {
    var el = document.createElement('script');
    el.src = src + '?v=' + (window.HSK_VERSION || '1');
    el.onload = ok; el.onerror = bad;
    document.body.appendChild(el);
  });
}
function svReady() {
  if (!SV.ready) SV.ready = Promise.all(['vendor/hanzi-writer.min.js'].concat(STROKE_FILES).map(svLoad)).catch(function () { SV.ready = null; });
  return SV.ready;
}
function svChars(w) { return Array.from(w).filter(function (c) { return window.HSK_STROKES && HSK_STROKES[c]; }); }
function svColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

// Hinh tung buoc: net 1..k, net moi to mau son
function svSteps(c) {
  var st = HSK_STROKES[c].strokes;
  return st.map(function (x, k) {
    return '<svg viewBox="0 0 1024 1024" class="sv-step"><g transform="translate(0,900) scale(1,-1)">' +
      st.map(function (p, i) { return '<path d="' + p + '" class="' + (i < k ? 'old' : i === k ? 'new' : 'rest') + '"/>'; }).join('') +
      '</g><text x="40" y="1000">' + (k + 1) + '</text></svg>';
  }).join('');
}

function svHtml(w) {
  var cs = svChars(w);
  // Chi hien khi du du lieu cho moi chu Han trong tu (tranh hien thieu chu)
  if (!cs.length || cs.length !== Array.from(w).filter(function (c) { return /[㐀-鿿]/.test(c); }).length) return '';
  return '<h3>✍️ Cách viết</h3><div class="card sv-card">' +
    '<div class="sv-row">' + cs.map(function (c, i) {
      return '<div class="sv-ch"><div class="sv-box" id="svBox' + i + '"></div><div class="small muted">' + HSK_STROKES[c].strokes.length + ' nét</div></div>';
    }).join('') + '</div>' +
    '<div class="sv-msg small muted" id="svMsg">Bấm ▶ để xem thứ tự nét, hoặc ✏️ để tự viết.</div>' +
    '<div class="row sv-btns"><button class="btn" id="svPlay">▶ Xem viết</button><button class="btn" id="svQuiz">✏️ Tập viết</button><button class="btn ghost" id="svStep">Từng nét</button></div>' +
    '<div class="sv-steps" id="svSteps" hidden>' + cs.map(function (c) { return '<div class="sv-steprow"><span class="hz-s">' + c + '</span>' + svSteps(c) + '</div>'; }).join('') + '</div>' +
    '</div>';
}

function svMount(w) {
  var cs = svChars(w);
  SV.w = w;
  SV.writers = cs.map(function (c, i) {
    return HanziWriter.create('svBox' + i, c, {
      width: 104, height: 104, padding: 6, showOutline: true,
      strokeColor: svColor('--ink'), outlineColor: svColor('--line'),
      highlightColor: svColor('--seal'), drawingColor: svColor('--seal'), drawingWidth: 22,
      strokeAnimationSpeed: 1.1, delayBetweenStrokes: 220, showHintAfterMisses: 3,
      charDataLoader: function (ch, done) { done(HSK_STROKES[ch]); }
    });
  });
  var msg = $('svMsg');
  $('svPlay').onclick = function () {
    var i = 0;
    msg.textContent = 'Đang viết…';
    (function next() {
      if (SV.w !== w) return;
      if (i >= SV.writers.length) { msg.textContent = 'Xong. Bấm ▶ để xem lại.'; return; }
      SV.writers[i++].animateCharacter({ onComplete: next });
    })();
  };
  $('svQuiz').onclick = function () {
    var i = 0, miss = 0;
    msg.textContent = 'Viết lần lượt từng chữ vào ô, theo đúng thứ tự nét.';
    (function next() {
      if (SV.w !== w) return;
      if (i >= SV.writers.length) { document.querySelectorAll('.sv-box.on').forEach(function (b) { b.classList.remove('on'); }); msg.textContent = miss ? '👍 Viết xong, sai ' + miss + ' nét. Thử lại nhé!' : '🎉 Tuyệt vời, viết đúng hết!'; return; }
      SV.writers[i].quiz({
        onMistake: function () { miss++; },
        onComplete: function () { i++; next(); }
      });
      document.querySelectorAll('.sv-box').forEach(function (b, k) { b.classList.toggle('on', k === i); });
    })();
  };
  $('svStep').onclick = function () {
    var s = $('svSteps'); s.hidden = !s.hidden;
    this.textContent = s.hidden ? 'Từng nét' : 'Ẩn từng nét';
  };
}

// Chen muc "Cach viet" vao chi tiet tu, truoc phan cau vi du
var svOpenWord = openWord;
openWord = function (w) {
  svOpenWord(w);
  svReady().then(function () {
    var sh = $('sheet'), h3 = sh.querySelector('h3');
    var hz = sh.querySelector('.word-head .hz');
    if (!window.HanziWriter || !BYW[w] || !hz || hz.textContent !== BYW[w].w || !$('modal').classList.contains('open') || sh.querySelector('.sv-card')) return;
    var html = svHtml(w); if (!html) return;
    var box = document.createElement('div'); box.innerHTML = html;
    while (box.firstChild) sh.insertBefore(box.firstChild, h3);
    svMount(w);
  });
};
