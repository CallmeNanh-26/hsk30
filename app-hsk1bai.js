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

// ---------- Noi dung bai tap: chi dung tu cua bai do va cac bai truoc (data/hsk1-baitap.js) ----------
var BT = {}; // BT[n] = { c: [cau vi du], q: [hoi-dap] }
var BT_PUN = /[，。？！、：；,.?!:;\s]/g;
var BT_NAMES = ['王一飞', '白家月', '安妮', '陈天中', '李文', '王一雪', '刘明', '刘小雪', '刘小明', '杨同乐', '小语'];
(function () {
  var n = 0;
  String(window.HSK1_BT || '').split('\n').forEach(function (l) {
    if (/^# \d+/.test(l)) { n = +l.slice(2); BT[n] = { c: [], q: [] }; return; }
    var f = l.split('|'); if (!n) return;
    if (f[0] === 'c' && f.length >= 4) {
      var tk = f[1].split('/'), py = f[2].split('/');
      BT[n].c.push({ zh: tk.join(''), py: btPyJoin(py), vi: f[3], tk: tk, tpy: py, n: n });
    } else if (f[0] === 'q' && f.length >= 8) BT[n].q.push({ g: f[1], q: f[2], qpy: f[3], qvi: f[4], a: f[5], apy: f[6], avi: f[7], n: n });
  });
})();
function btPyJoin(a) { return a.join(' ').replace(/ ([,.?!:])/g, '$1'); }
// Tu duoc phep o bai n: tu cua bai 1..n + ten rieng
function btLv(w) { var ns = BAI.of[w]; return ns ? Math.min.apply(null, ns) : 99; }
function btScope(n) { return Object.keys(BAI.of).filter(function (w) { return btLv(w) <= n && BYW[w]; }); }
function btNames(n) {
  var out = BT_NAMES.slice(), T = window.HSK1_TEN || {};
  Object.keys(T).forEach(function (k) { if (+k <= n) out = out.concat(T[k]); });
  return out;
}
function btC(n) { return (BT[n] && BT[n].c) || []; }
function btQ(n) { return (BT[n] && BT[n].q) || []; }
function btUpTo(n, key) { var out = []; for (var k = 1; k <= n; k++) if (BT[k]) out = out.concat(BT[k][key]); return out; }
// Tu chinh cua cau (de ghi so loi): tu dau tien thuoc bai n
function btWordOf(c) { var n = c.n; for (var i = 0; i < c.tk.length; i++) { var t = c.tk[i].replace(BT_PUN, ''); if (BYW[t] && (BAI.of[t] || []).indexOf(n) >= 0) return t; } return ''; }
function btZhPy(zh, py) { return '<span class="zh">' + esc(zh) + '</span><div class="py bai-py">' + esc(py) + '</div>'; }
function btSay(zh, txt) { return '<button class="speak big-say" data-say="' + esc(zh) + '">🔊 ' + (txt || 'Nghe') + '</button> <button class="speak" data-say="' + esc(zh) + '" data-slow="1">🐢</button>'; }
function pick(a, n, not) { return shuffle(a.filter(function (x) { return not.indexOf(x) < 0; })).slice(0, n); }
// Phuong an nhieu cho cau hoi ve tu: uu tien tu cung bai, thieu thi lay tu bai truoc (khong lay tu bai sau)
function baiPool(n, w) {
  var ws = baiWords(n).filter(function (x) { return x !== w && meaning(BYW[x]) !== meaning(BYW[w]); });
  return ws.length >= 6 ? ws : ws.concat(btScope(n - 1).filter(function (x) { return x !== w && ws.indexOf(x) < 0; }));
}
function btPyMap(list) { var m = {}; list.forEach(function (x) { m[x[0]] = x[1]; }); return m; }

function qNgheTu(n, o) {
  var opts = shuffle([o.w].concat(pick(baiPool(n, o.w), 3, [o.w])));
  return { t: 'Nghe và chọn từ đúng', p: btSay(o.w), opts: opts, a: o.w, zh: 1, say: o.w, optPy: btPyMap(opts.map(function (w) { return [w, BYW[w].py]; })), after: o.w + ' – ' + o.py + ' – ' + meaning(o), w: o.w };
}
function qNgheNghia(n, o) {
  var opts = shuffle([meaning(o)].concat(pick(baiPool(n, o.w), 3, [o.w]).map(function (w) { return meaning(BYW[w]); })));
  return { t: 'Nghe và chọn nghĩa đúng', p: btSay(o.w), opts: opts, a: meaning(o), say: o.w, after: o.w + ' – ' + o.py, w: o.w };
}
// 3 nghia sai: cau khac cung bai, thieu thi lay o bai truoc
function btOtherVi(n, c) {
  var out = [];
  shuffle(btC(n)).concat(shuffle(btUpTo(n - 1, 'c'))).some(function (x) { if (x !== c && x.vi !== c.vi && out.indexOf(x.vi) < 0) out.push(x.vi); return out.length >= 3; });
  return out.length >= 3 ? out : null;
}
function qCau(n, c, listen) {
  var others = btOtherVi(n, c); if (!others) return null;
  return {
    t: listen ? 'Nghe câu và chọn nghĩa đúng' : 'Đọc câu và chọn nghĩa đúng',
    p: listen ? btSay(c.zh, 'Nghe câu') : btZhPy(c.zh, c.py) + ' <button class="mini-speak" data-say="' + esc(c.zh) + '">🔊</button>',
    opts: shuffle([c.vi].concat(others)), a: c.vi, say: listen ? c.zh : '', after: c.zh + ' – ' + c.py, w: btWordOf(c)
  };
}
// Hoi dap: chon cau tra loi phu hop (cau tra loi sai lay tu cau hoi khac nhom, cung bai hoac bai truoc)
function qHoiDap(n, x, listen) {
  var others = [];
  shuffle(btQ(n)).concat(shuffle(btUpTo(n - 1, 'q'))).some(function (y) {
    if (y !== x && y.a !== x.a && !(x.g && y.g === x.g) && !others.some(function (o) { return o.a === y.a; })) others.push(y);
    return others.length >= 3;
  });
  if (others.length < 3) return null;
  var all = [x].concat(others);
  return {
    t: listen ? 'Nghe câu hỏi và chọn câu trả lời phù hợp' : 'Đọc câu hỏi và chọn câu trả lời phù hợp',
    p: listen ? btSay(x.q, 'Nghe câu hỏi') : btZhPy(x.q, x.qpy) + ' <button class="mini-speak" data-say="' + esc(x.q) + '">🔊</button>',
    opts: shuffle(all.map(function (y) { return y.a; })), a: x.a, zh: 1, say: listen ? x.q : '',
    optPy: btPyMap(all.map(function (y) { return [y.a, y.apy]; })),
    after: x.q + ' → ' + x.a + '\n' + x.qpy + ' → ' + x.apy + '\n(' + x.qvi + ' → ' + x.avi + ')'
  };
}
// Dien tu: bo trong mot tu cua bai n trong cau, co nghia tieng Viet de khong mo ho
function qDien(n, c) {
  var idx = c.tk.map(function (t, i) { return i; }).filter(function (i) { var t = c.tk[i].replace(BT_PUN, ''); return BYW[t] && (BAI.of[t] || []).indexOf(n) >= 0; });
  if (!idx.length) return null;
  var i = idx[Math.floor(Math.random() * idx.length)], w = c.tk[i].replace(BT_PUN, '');
  var wrong = pick(baiPool(n, w), 3, [w].concat(c.tk.map(function (t) { return t.replace(BT_PUN, ''); })));
  if (wrong.length < 3) return null;
  var zh = c.tk.map(function (t, k) { return k === i ? t.replace(w, '＿＿') : t; }).join('');
  var py = btPyJoin(c.tpy.map(function (p, k) { return k === i ? p.replace(/[^,.?!:]+/, '＿＿') : p; }));
  var opts = shuffle([w].concat(wrong));
  return { t: 'Chọn từ điền vào chỗ trống', p: btZhPy(zh, py) + '<div class="small muted">' + esc(c.vi) + '</div>', opts: opts, a: w, zh: 1, optPy: btPyMap(opts.map(function (x) { return [x, BYW[x].py]; })), after: c.zh + ' – ' + c.py, w: w };
}
// Sap xep tu thanh cau (moi o co pinyin)
function qXep(n, c) {
  var tk = [], py = [];
  c.tk.forEach(function (t, k) { var z = t.replace(BT_PUN, ''); if (z) { tk.push(z); py.push(c.tpy[k].replace(/[,.?!:]/g, '')); } });
  if (tk.length < 3) return null;
  while (tk.length > 8) { var j = Math.floor(Math.random() * (tk.length - 1)); tk.splice(j, 2, tk[j] + tk[j + 1]); py.splice(j, 2, py[j] + ' ' + py[j + 1]); }
  var ord = shuffle(tk.map(function (_, k) { return k; }));
  return { t: 'Dịch sang tiếng Trung: sắp xếp các từ', p: esc(c.vi), tiles: ord.map(function (k) { return tk[k]; }), tilePy: ord.map(function (k) { return py[k]; }), a: tk.join(''), after: c.zh + ' – ' + c.py, w: btWordOf(c) };
}
function qDichTV(n, c) { var q = qCau(n, c, false); if (q) q.t = 'Dịch sang tiếng Việt: chọn câu dịch đúng'; return q; }

var BAI_KIND = {
  nghe: { ten: 'Nghe', make: function (n, k, w, c, x) { return [qNgheTu(n, BYW[w]), qNgheNghia(n, BYW[w]), qCau(n, c, true), x && qHoiDap(n, x, true)][k % 4]; } },
  doc: { ten: 'Đọc hiểu', make: function (n, k, w, c, x) { return [qCau(n, c, false), x && qHoiDap(n, x, false), qDien(n, c)][k % 3]; } },
  dich: { ten: 'Dịch', make: function (n, k, w, c, x) { return k % 2 === 0 ? qXep(n, c) || qDichTV(n, c) : qDichTV(n, c) || qXep(n, c); } }
};
function baiQuiz(n, kind) {
  var K = BAI_KIND[kind], ws = shuffle(baiWords(n)), cs = shuffle(btC(n)), xs = shuffle(btQ(n)), qs = [];
  for (var k = 0, tries = 0; qs.length < 8 && tries < 40; tries++) {
    var q = K.make(n, k, ws[k % ws.length], cs[k % cs.length], xs[k % xs.length]);
    k++; if (q) qs.push(q);
  }
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
  var q = QZ && QZ.qs[QZ.i], m = QZ && /^bai:(\d+):(\w+)$/.exec(QZ.mode || ''), t = $('sheet').querySelector('.q-title');
  if (m && t && t.textContent.indexOf('Bài ') < 0) t.insertAdjacentHTML('afterbegin', '<b>Bài ' + m[1] + ' · ' + BAI_KIND[m[2]].ten + '</b> · ');
  if (!q) return;
  // Pinyin hien bang data-py (CSS ::after) de khong lan vao noi dung dap an
  if (q.optPy) $('sheet').querySelectorAll('.opt').forEach(function (b) { var p = q.optPy[b.dataset.v]; if (p) b.setAttribute('data-py', p); });
  if (q.tilePy) {
    $('tiles').querySelectorAll('.tile').forEach(function (b) { b.setAttribute('data-py', q.tilePy[+b.dataset.k] || ''); });
    var put = function () { $('ans').querySelectorAll('.tile:not([data-py])').forEach(function (b) { var k = q.tiles.indexOf(b.textContent); if (k >= 0) b.setAttribute('data-py', q.tilePy[k]); }); };
    new MutationObserver(put).observe($('ans'), { childList: true });
  }
};

// ---------- Phan xa: nghe cau hoi, tra loi nhanh bang tieng Trung (noi hoac go) ----------
// Tach cau thanh tu trong pham vi bai (de goi y tu)
function btSeg(s, n) {
  var ok = btNames(n), sc = {}; btScope(n).forEach(function (w) { sc[w] = 1; });
  s = s.replace(BT_PUN, ''); var out = [];
  for (var i = 0; i < s.length;) {
    var got = 1;
    for (var L = Math.min(6, s.length - i); L > 1; L--) { var x = s.substr(i, L); if (sc[x] || ok.indexOf(x) >= 0) { got = L; break; } }
    out.push(s.substr(i, got)); i += got;
  }
  return out;
}
function baiReflex(n) {
  var qs = shuffle(btQ(n)).slice(0, 6).map(function (x) {
    var tu = [];
    btSeg(x.a, n).forEach(function (t) { var o = BYW[t]; if (o && (BAI.of[t] || []).indexOf(n) >= 0 && !tu.some(function (u) { return u.zh === t; })) tu.push({ zh: t, py: o.py, vi: meaning(o) }); });
    return { w: '', q: x.q, py: x.qpy, vi: x.qvi, goiy: 'Trả lời ngắn, nhanh, chỉ dùng từ đã học đến bài ' + n + '. Ý câu trả lời: ' + x.avi, tu: tu.slice(0, 4), mau: x.a, maupy: x.apy, mauvi: x.avi };
  });
  if (qs.length < 2) return toast('Bài này chưa đủ câu hỏi phản xạ.');
  NOI_UI.showPy = true;
  noiBegin(0, qs, baiWords(n));
  NOI.reflex = 15; NOI.ten = 'Bài ' + n + ' · Phản xạ'; NOI.bai = n; histTouch(NOI); noiRender();
}
// Danh sach tu cho AI cham phan xa: sua va goi y chi duoc dung tu nay
function baiScopeText(n) { return btScope(n).concat(btNames(n)).join('、'); }

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
