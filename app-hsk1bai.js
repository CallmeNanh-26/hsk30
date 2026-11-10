/* HSK 1 theo bai (giao trinh 新HSK教程1, 15 bai): o tab Tra tu, chon HSK 1 se co them hang "Theo bai".
   Moi bai: danh sach tu (giu thu tu cua sach) + bai tap Nghe, Doc hieu, Dich, Phan xa (tra loi bang tieng Trung), Viet chu Han.
   Van giu muc "Tong hop" = toan bo tu HSK 1 nhu truoc. */
'use strict';

var BAI = { tu: {}, of: {}, cur: '' }; // tu[so] = [tu...], of[tu] = [so...]
(function () {
  String(window.HSK1_TU || '').split('\n').forEach(function (l) {
    var f = l.split('|'); if (!f[0] || !f[1]) return;
    var ns = f[1].split(',').map(Number);
    BAI.of[f[0]] = ns;
    ns.forEach(function (n) { (BAI.tu[n] = BAI.tu[n] || []).push(f[0]); });
  });
})();
function baiInfo(n) { return (window.HSK1_BAI || []).filter(function (b) { return b.so === n; })[0]; }
function baiWords(n) { return (BAI.tu[n] || []).filter(function (w) { return BYW[w]; }); }

// ---------- Hang chon bai ----------
var baiChipsFn = renderChips;
renderChips = function () {
  baiChipsFn();
  var box = $('baiChips');
  if (!box) { box = document.createElement('div'); box.id = 'baiChips'; box.className = 'chips bai-chips'; $('lvChips').insertAdjacentElement('afterend', box); }
  if (F.lv !== '1' || !window.HSK1_BAI) { box.innerHTML = ''; box.hidden = true; BAI.cur = ''; return; }
  box.hidden = false;
  box.innerHTML = '<span class="muted small" style="align-self:center">📚 Theo bài:</span><button class="chip' + (!BAI.cur ? ' on' : '') + '" data-bai="">Tổng hợp</button>' +
    HSK1_BAI.map(function (b) { return '<button class="chip' + (String(b.so) === BAI.cur ? ' on' : '') + '" data-bai="' + b.so + '" title="' + esc(b.zh + ' – ' + b.vi) + '">Bài ' + b.so + '</button>'; }).join('');
};
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-bai]'); if (!b) return;
  BAI.cur = b.dataset.bai; F.limit = 400; renderChips(); renderResults(); window.scrollTo(0, 0);
});
// Loc theo bai: lay tu cua bai (ke ca tu ngoai cap 1 ma sach dung), giu thu tu trong sach
var baiFiltered = filtered;
filtered = function () {
  if (F.lv !== '1' || !BAI.cur) return baiFiltered();
  var lv = F.lv; F.lv = 'all';
  var res = baiFiltered(); F.lv = lv;
  var list = BAI.tu[+BAI.cur] || [], pos = {};
  list.forEach(function (w, i) { pos[w] = i; });
  return res.filter(function (o) { return pos[o.w] != null; }).sort(function (a, b) { return pos[a.w] - pos[b.w]; });
};
var baiResults = renderResults;
renderResults = function () {
  baiResults();
  var old = $('baiCard'); if (old) old.remove();
  if (F.lv !== '1' || !BAI.cur) return;
  $('view-search').querySelector('.toolbar').insertAdjacentHTML('beforebegin', baiCardHtml(+BAI.cur));
  // Danh dau tu da hoc o bai truoc
  $('results').querySelectorAll('.item[data-w]').forEach(function (it) {
    var ns = BAI.of[it.dataset.w] || [], first = ns[0];
    if (first && first < +BAI.cur) it.querySelector('.main > div').insertAdjacentHTML('beforeend', '<span class="lv bai-old">ôn từ bài ' + first + '</span>');
  });
};

// ---------- The bai hoc ----------
function baiCardHtml(n) {
  var b = baiInfo(n), ws = baiWords(n), learned = ws.filter(isKnown).length, ten = (window.HSK1_TEN || {})[n] || [];
  return '<div class="card bai-card" id="baiCard"><div class="small muted">新HSK教程1 · Bài ' + n + '/15</div>' +
    '<div class="bai-title"><span class="zh">' + esc(b.zh) + '</span> <button class="mini-speak" data-say="' + esc(b.zh) + '">🔊</button></div><div>' + esc(b.vi) + '</div>' +
    (b.ngu.length ? '<div class="bai-ngu small"><b>Ngữ pháp:</b> ' + b.ngu.map(esc).join(' · ') + '</div>' : '') +
    (ten.length ? '<div class="small muted">Tên riêng trong bài: <span class="zh">' + ten.map(esc).join('、') + '</span></div>' : '') +
    '<div class="bai-prog small"><span>' + ws.length + ' từ · đã học ' + learned + '</span><span class="bar"><i style="width:' + (ws.length ? Math.round(learned / ws.length * 100) : 0) + '%"></i></span></div>' +
    '<div class="bai-acts">' +
    '<button class="btn" data-bx="cards">🃏 Flashcard</button>' +
    '<button class="btn" data-bx="nghe">🎧 Nghe</button>' +
    '<button class="btn" data-bx="doc">📖 Đọc hiểu</button>' +
    '<button class="btn" data-bx="dich">🔤 Dịch</button>' +
    '<button class="btn" data-bx="px">⚡ Phản xạ</button>' +
    '<button class="btn" data-bx="viet">✍️ Viết chữ Hán</button>' +
    '<button class="btn ghost" data-bx="all">✓ Đánh dấu cả bài</button></div></div>';
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-bx]'); if (!b || !BAI.cur) return;
  var n = +BAI.cur, ws = baiWords(n), k = b.dataset.bx;
  if (k === 'cards') { R.lv = 'all'; show('review'); return startCards(ws.map(function (w) { return BYW[w]; })); }
  if (k === 'all') { ws.forEach(function (w) { setKnown(w, true); }); updateSub(); renderResults(); return toast('Đã đánh dấu ' + ws.length + ' từ của bài ' + n + '.'); }
  if (k === 'px') return baiReflex(n);
  if (k === 'viet') return baiWrite(n);
  baiQuiz(n, k);
});

// ---------- Bai tap Nghe / Doc hieu / Dich ----------
function pick(a, n, not) { return shuffle(a.filter(function (x) { return not.indexOf(x) < 0; })).slice(0, n); }
function exOf(o) { return (o.ex || []).filter(function (x) { return x.zh && x.vi; }); }
// Phuong an nhieu: uu tien tu cung bai, thieu thi lay tu HSK 1 khac
function baiPool(n, w) { var ws = baiWords(n).filter(function (x) { return x !== w; }); return ws.length >= 6 ? ws : ws.concat(WORDS.filter(function (o) { return o.lv === 1 && o.w !== w; }).map(function (o) { return o.w; })); }
function qNgheTu(n, o) {
  var opts = shuffle([o.w].concat(pick(baiPool(n, o.w), 3, [o.w])));
  return { t: 'Nghe và chọn từ đúng', p: '<button class="speak big-say" data-say="' + esc(o.w) + '">🔊 Nghe</button> <button class="speak" data-say="' + esc(o.w) + '" data-slow="1">🐢</button>', opts: opts, a: o.w, zh: 1, say: o.w, after: o.w + ' – ' + o.py + ' – ' + meaning(o), w: o.w };
}
function qNgheNghia(n, o) {
  var opts = shuffle([meaning(o)].concat(pick(baiPool(n, o.w), 3, [o.w]).map(function (w) { return meaning(BYW[w]); })));
  return { t: 'Nghe và chọn nghĩa đúng', p: '<button class="speak big-say" data-say="' + esc(o.w) + '">🔊 Nghe</button> <button class="speak" data-say="' + esc(o.w) + '" data-slow="1">🐢</button>', opts: opts, a: meaning(o), say: o.w, after: o.w + ' – ' + o.py, w: o.w };
}
// Cau: nghe (hoac doc) mot cau vi du, chon nghia dung trong 4 cau
function qCau(n, o, listen) {
  var e = exOf(o)[0]; if (!e) return null;
  var others = [];
  shuffle(baiPool(n, o.w)).some(function (w) { var x = exOf(BYW[w])[0]; if (x && x.vi !== e.vi && others.indexOf(x.vi) < 0) others.push(x.vi); return others.length >= 3; });
  if (others.length < 3) return null;
  return listen ?
    { t: 'Nghe câu và chọn nghĩa đúng', p: '<button class="speak big-say" data-say="' + esc(e.zh) + '">🔊 Nghe câu</button> <button class="speak" data-say="' + esc(e.zh) + '" data-slow="1">🐢</button>', opts: shuffle([e.vi].concat(others)), a: e.vi, say: e.zh, after: e.zh + ' – ' + e.py, w: o.w } :
    { t: 'Đọc câu và chọn nghĩa đúng', p: '<span class="zh">' + esc(e.zh) + '</span>', opts: shuffle([e.vi].concat(others)), a: e.vi, after: e.zh + ' – ' + e.py, w: o.w };
}
// Hoi dap: doc cau hoi, chon cau tra loi phu hop (cac cau tra loi khac lay tu cung bai)
function qHoiDap(n, o) {
  if (!o.qa) return null;
  var others = pick(baiPool(n, o.w), 6, []).map(function (w) { return BYW[w].qa && BYW[w].qa.a; }).filter(function (a) { return a && a !== o.qa.a; }).slice(0, 3);
  if (others.length < 3) return null;
  return { t: 'Đọc câu hỏi và chọn câu trả lời phù hợp', p: '<span class="zh">' + esc(o.qa.q) + '</span>', opts: shuffle([o.qa.a].concat(others)), a: o.qa.a, zh: 1, after: o.qa.q + ' → ' + o.qa.a + (o.qa.qvi ? '\n(' + o.qa.qvi + ')' : ''), w: o.w };
}
function qDichVT(o) {
  var e = exOf(o)[1] || exOf(o)[0]; if (!e) return null;
  var sg = segment(e.zh); if (sg.tiles.length < 3) return null;
  return { t: 'Dịch sang tiếng Trung: sắp xếp các từ', p: esc(e.vi), tiles: shuffle(sg.tiles), a: sg.answer, after: e.zh + ' – ' + e.py, w: o.w };
}
function qDichTV(n, o) {
  var e = exOf(o)[1] || exOf(o)[0]; if (!e) return null;
  var q = qCau(n, Object.assign({}, o, { ex: [e] }), false); if (q) q.t = 'Dịch sang tiếng Việt: chọn câu dịch đúng';
  return q;
}
var BAI_KIND = {
  nghe: { ten: 'Nghe', make: function (n, o, k) { return k % 3 === 2 ? qCau(n, o, true) || qNgheTu(n, o) : k % 3 === 1 ? qNgheNghia(n, o) : qNgheTu(n, o); } },
  doc: { ten: 'Đọc hiểu', make: function (n, o, k) { return k % 3 === 0 ? qCau(n, o, false) : k % 3 === 1 ? qHoiDap(n, o) || qCau(n, o, false) : (typesFor(o).indexOf('fill') >= 0 ? Object.assign(makeQ(o, 'fill'), { w: o.w }) : qCau(n, o, false)); } },
  dich: { ten: 'Dịch', make: function (n, o, k) { return k % 2 === 0 ? qDichVT(o) || qDichTV(n, o) : qDichTV(n, o) || qDichVT(o); } }
};
function baiQuiz(n, kind) {
  var K = BAI_KIND[kind], ws = shuffle(baiWords(n)), qs = [];
  for (var i = 0; i < ws.length && qs.length < 8; i++) { var q = K.make(n, BYW[ws[i]], qs.length); if (q) qs.push(q); }
  if (qs.length < 3) return toast('Bài này chưa đủ câu cho dạng ' + K.ten + '.');
  QZ = { qs: qs, i: 0, res: [], ws: ws, mode: 'bai:' + n + ':' + kind };
  renderQ();
}
// "Lam lai" sau bai tap theo bai: ra bo cau moi cung dang
var baiStart = startQuiz;
startQuiz = function (ws, mode) { var m = /^bai:(\d+):(\w+)$/.exec(mode || ''); if (m) return baiQuiz(+m[1], m[2]); return baiStart(ws, mode); };
var baiRenderQ = renderQ;
renderQ = function () {
  baiRenderQ();
  var m = QZ && /^bai:(\d+):(\w+)$/.exec(QZ.mode || ''), t = $('sheet').querySelector('.q-title');
  if (m && t && t.textContent.indexOf('Bài ') < 0) t.insertAdjacentHTML('afterbegin', '<b>Bài ' + m[1] + ' · ' + BAI_KIND[m[2]].ten + '</b> · ');
};

// ---------- Phan xa: nghe cau hoi, tra loi nhanh bang tieng Trung (noi hoac go) ----------
function baiReflex(n) {
  var qs = shuffle(baiWords(n).filter(function (w) { return BYW[w].qa; })).slice(0, 6).map(function (w) {
    var o = BYW[w];
    return { w: w, q: o.qa.q, py: '', vi: o.qa.qvi, goiy: 'Trả lời ngắn, nhanh, dùng từ ' + w + ' (' + meaning(o) + ').', tu: noiHintWords(w, o.qa.a), mau: o.qa.a, maupy: '', mauvi: '' };
  });
  if (qs.length < 2) return toast('Bài này chưa đủ câu hỏi phản xạ.');
  noiBegin(0, qs, baiWords(n));
  NOI.reflex = 15; NOI.ten = 'Bài ' + n + ' · Phản xạ'; histTouch(NOI); noiRender();
}

// ---------- Viet chu Han: tung chu trong bai, xem thu tu net roi tu viet ----------
var BW = { cs: [], i: 0, n: 0, miss: {}, writer: null };
function baiChars(n) {
  var out = [];
  baiWords(n).forEach(function (w) { Array.from(w).forEach(function (c) { if (/[㐀-鿿]/.test(c) && out.indexOf(c) < 0) out.push(c); }); });
  return out;
}
function baiWrite(n) {
  var cs = baiChars(n);
  BW = { cs: cs, i: 0, n: n, miss: {}, done: {}, writer: null };
  svReady().then(function () {
    BW.cs = cs.filter(function (c) { return window.HSK_STROKES && HSK_STROKES[c]; });
    if (!window.HanziWriter || !BW.cs.length) return toast('Chưa tải được dữ liệu nét chữ, thử lại sau.');
    bwRender();
  });
}
function bwWordFor(c) { var ws = baiWords(BW.n).filter(function (w) { return w.indexOf(c) >= 0; }); return BYW[ws[0]] || null; }
function bwRender() {
  var c = BW.cs[BW.i], o = bwWordFor(c), total = BW.cs.length, st = HSK_STROKES[c].strokes.length;
  openSheet('<div class="dots">' + BW.cs.map(function (x, k) { return '<span class="' + (k === BW.i ? 'cur' : BW.done[x] ? (BW.miss[x] ? 'no' : 'ok') : '') + '"></span>'; }).join('') + '</div>' +
    '<div class="noi-nav"><button class="wnav-b" id="bwPrev"' + (BW.i <= 0 ? ' disabled' : '') + ' aria-label="Chữ trước">‹</button><div class="q-title grow"><b>Bài ' + BW.n + ' · Viết chữ Hán</b> · Chữ ' + (BW.i + 1) + '/' + total + '</div><button class="wnav-b" id="bwNext"' + (BW.i >= total - 1 ? ' disabled' : '') + ' aria-label="Chữ sau">›</button></div>' +
    '<div class="bw-wrap"><div class="bw-box" id="bwBox"></div><div class="bw-info">' +
    (o ? '<div class="small muted">Trong từ</div><div class="zh" style="font-size:22px">' + esc(o.w) + '</div><div class="py">' + esc(o.py) + '</div><div class="small">' + esc(meaning(o)) + '</div>' : '') +
    '<div class="small muted" style="margin-top:6px">' + st + ' nét</div><button class="mini-speak" data-say="' + esc(o ? o.w : c) + '">🔊</button></div></div>' +
    '<div class="sv-msg small" id="bwMsg">Bấm ▶ xem thứ tự nét, rồi ✏️ tự viết vào ô.</div>' +
    '<div class="row sv-btns"><button class="btn" id="bwPlay">▶ Xem viết</button><button class="btn primary" id="bwQuiz">✏️ Tự viết</button><button class="btn ghost" id="bwSteps">Từng nét</button></div>' +
    '<div class="sv-steps" id="bwStepBox" hidden><div class="sv-steprow"><span class="hz-s">' + c + '</span>' + svSteps(c) + '</div></div>');
  BW.writer = HanziWriter.create('bwBox', c, {
    width: 200, height: 200, padding: 10, showOutline: true,
    strokeColor: svColor('--ink'), outlineColor: svColor('--line'), highlightColor: svColor('--seal'), drawingColor: svColor('--seal'), drawingWidth: 26,
    strokeAnimationSpeed: 1, delayBetweenStrokes: 250, showHintAfterMisses: 2,
    charDataLoader: function (ch, done) { done(HSK_STROKES[ch]); }
  });
  var me = c;
  $('bwPlay').onclick = function () { $('bwMsg').textContent = 'Đang viết…'; BW.writer.animateCharacter({ onComplete: function () { if (BW.cs[BW.i] === me && $('bwMsg')) $('bwMsg').textContent = 'Bấm ✏️ để tự viết.'; } }); };
  $('bwQuiz').onclick = function () {
    var miss = 0; $('bwMsg').textContent = 'Viết theo đúng thứ tự nét. Sai 2 lần sẽ có gợi ý.';
    BW.writer.quiz({
      onMistake: function () { miss++; },
      onComplete: function () {
        if (BW.cs[BW.i] !== me) return;
        BW.done[me] = 1; BW.miss[me] = miss;
        S.viet = S.viet || {}; var v = S.viet[me] || (S.viet[me] = { n: 0, ok: 0 }); v.n++; if (!miss) v.ok++; save();
        var last = BW.i >= BW.cs.length - 1;
        $('bwMsg').innerHTML = (miss ? '👍 Viết xong, sai ' + miss + ' nét. Viết lại cho nhớ nhé!' : '🎉 Đúng hết các nét!') +
          ' <button class="btn primary" id="bwGo">' + (last ? 'Xem kết quả' : 'Chữ tiếp →') + '</button>';
        $('bwGo').onclick = function () { if (last) bwDone(); else { BW.i++; bwRender(); } };
      }
    });
  };
  $('bwSteps').onclick = function () { var s = $('bwStepBox'); s.hidden = !s.hidden; };
  $('bwPrev').onclick = function () { BW.i--; bwRender(); };
  $('bwNext').onclick = function () { BW.i++; bwRender(); };
}
function bwDone() {
  var done = BW.cs.filter(function (c) { return BW.done[c]; }), bad = done.filter(function (c) { return BW.miss[c]; });
  openSheet('<div class="word-head"><div style="font-size:48px">' + (bad.length ? '💪' : '🎉') + '</div><div class="big-msg">Đã viết ' + done.length + '/' + BW.cs.length + ' chữ của bài ' + BW.n + '</div>' +
    (bad.length ? '<div class="small">Chữ còn sai nét: <span class="zh" style="font-size:20px">' + bad.join(' ') + '</span></div>' : '<div class="small muted">Không sai nét nào, giỏi quá!</div>') + '</div>' +
    '<div style="display:grid;gap:8px;margin-top:12px">' + (bad.length ? '<button class="btn block primary" id="bwBad">✏️ Viết lại các chữ còn sai</button>' : '') +
    '<button class="btn block" id="bwAgain">↻ Viết lại cả bài</button><button class="btn block ghost" data-close>Đóng</button></div>');
  if ($('bwBad')) $('bwBad').onclick = function () { BW = { cs: bad, i: 0, n: BW.n, miss: {}, done: {}, writer: null }; bwRender(); };
  $('bwAgain').onclick = function () { baiWrite(BW.n); };
}
