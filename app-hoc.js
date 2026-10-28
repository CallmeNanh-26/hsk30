/* Doi chieu HSK 3.0 - phan hoc: tien do, flashcard, bai tap, cai dat */
'use strict';

// ---------- Tien do & lo trinh ----------
function levelStats() {
  var st = {};
  LEVELS.forEach(function (l) { st[l] = { total: 0, known: 0 }; });
  WORDS.forEach(function (o) { if (st[o.lv]) { st[o.lv].total++; if (isKnown(o.w)) st[o.lv].known++; } });
  var cT = 0, cK = 0;
  LEVELS.forEach(function (l) { cT += st[l].total; cK += st[l].known; st[l].cumTotal = cT; st[l].cumKnown = cK; });
  return st;
}
function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
var openLv = null;
VIEWS.progress = function () {
  var st = levelStats(), el = $('view-progress');
  var target = LEVELS.filter(function (l) { return pct(st[l].cumKnown, st[l].cumTotal) < 90; })[0];
  var anyKnown = Object.keys(S.known).length > 0;
  var msg;
  if (!anyKnown) msg = 'Bạn chưa đánh dấu từ nào. Vào <b>Tra từ</b>, tìm và bấm ✓ ở những từ đã học trong khóa — trang sẽ tự đối chiếu với HSK 3.0.';
  else if (!target) msg = 'Tuyệt vời! Bạn đã nắm trên 90% từ vựng <b>HSK 1–6</b>.';
  else {
    var s = st[target], miss = s.cumTotal - s.cumKnown;
    msg = 'Bạn đã nắm khoảng <b>' + pct(s.cumKnown, s.cumTotal) + '% HSK ' + target + '</b>' + (target > 1 ? ' (tính cả HSK ' + (target > 2 ? '1–' + (target - 1) : '1') + ')' : '') +
      ', còn thiếu <b>' + miss + '</b> từ.';
    var below = LEVELS.filter(function (l) { return l < target && st[l].known < st[l].total; });
    if (below.length) msg += '<div class="small muted" style="margin-top:6px">Lưu ý: còn từ chưa học ở ' + below.map(function (l) { return 'HSK ' + l + ' (' + (st[l].total - st[l].known) + ')'; }).join(', ') + '.</div>';
  }
  var h = '<div class="card"><div class="big-msg">' + msg + '</div>' +
    '<div class="row" style="margin-top:12px"><button class="btn" id="copyReport">📋 Sao chép kết quả gửi giáo viên</button></div></div>';

  h += curveHtml();
  h += '<h3>Theo từng cấp</h3><div class="card">';
  LEVELS.forEach(function (l) {
    var s = st[l], p = pct(s.known, s.total), pc = pct(s.cumKnown, s.cumTotal);
    h += '<div class="lvrow" data-lvrow="' + l + '"><div class="top"><span><b>HSK ' + l + '</b> <span class="muted small">' + s.known + '/' + s.total + ' từ của cấp này</span></span><span><b>' + p + '%</b></span></div>' +
      '<div class="bar"><span style="width:' + p + '%"></span></div>' +
      '<div class="small muted" style="margin-top:3px">' + (l > 1 ? 'Tích lũy HSK 1–' + l + ': ' + s.cumKnown + '/' + s.cumTotal + ' (' + pc + '%) · ' : '') + 'bấm để xem từ còn thiếu</div>';
    if (openLv === l) h += missingHtml(l);
    h += '</div>';
  });
  h += '</div>';

  var extra = WORDS.filter(function (o) { return !o.lv; });
  if (extra.length) h += '<div class="card small">Từ chuyên ngành ngoài HSK đã học: <b>' + extra.filter(function (o) { return isKnown(o.w); }).length + '/' + extra.length + '</b></div>';

  // Lo trinh
  var per = S.perDay || 10;
  h += '<h3>Lộ trình gợi ý</h3><div class="card"><div class="row small" style="margin-bottom:8px">Mỗi ngày học <select id="perDay">' +
    [5, 10, 15, 20, 30].map(function (n) { return '<option' + (n === per ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select> từ mới</div>';
  var n = 0, days = 0;
  LEVELS.forEach(function (l) {
    var s = st[l], miss = s.total - s.known;
    n++;
    if (!miss) { h += '<div class="step done"><div class="n">✓</div><div>Hoàn thành <b>HSK ' + l + '</b></div></div>'; return; }
    var d = Math.ceil(miss / per); days += d;
    var pri = WORDS.filter(function (o) { return o.lv === l && !isKnown(o.w) && (o.tags.indexOf('Công xưởng') >= 0 || o.tags.indexOf('Thương mại') >= 0); }).length;
    h += '<div class="step"><div class="n">' + n + '</div><div><b>HSK ' + l + '</b>: học ' + miss + ' từ còn thiếu ≈ <b>' + d + ' ngày</b>' +
      (pri ? '<div class="small muted">Ưu tiên ' + pri + ' từ có nhãn Công xưởng / Thương mại — dùng được ngay ở nơi làm việc.</div>' : '') +
      '<div class="small muted">Hết bước này: tổng cộng khoảng ' + days + ' ngày (~' + Math.ceil(days / 30) + ' tháng).</div></div></div>';
  });
  h += '<div class="small muted" style="margin-top:8px">Mẹo: mỗi ngày học từ mới xong thì đánh dấu ✓, rồi vào <b>Ôn tập</b> lật flashcard các thẻ đến hạn để nhớ lâu.</div></div>';
  el.innerHTML = h;

  $('perDay').onchange = function () { S.perDay = +this.value; save(); VIEWS.progress(); };
  $('copyReport').onclick = function () { copyText(reportText(st)); };
  el.querySelectorAll('[data-lvrow]').forEach(function (r) {
    r.addEventListener('click', function (e) {
      if (e.target.closest('[data-open]') || e.target.closest('[data-goto]')) return;
      var l = +r.dataset.lvrow; openLv = openLv === l ? null : l; VIEWS.progress();
      var t = document.querySelector('[data-lvrow="' + l + '"]'); if (t) t.scrollIntoView({ block: 'start' });
    });
  });
  el.querySelectorAll('[data-goto]').forEach(function (b) {
    b.onclick = function () { F.lv = b.dataset.goto; F.st = 'unknown'; F.tag = ''; F.q = ''; $('q').value = ''; renderChips(); show('search'); };
  });
};
function missingHtml(l) {
  var miss = WORDS.filter(function (o) { return o.lv === l && !isKnown(o.w); });
  if (!miss.length) return '<div class="small" style="margin-top:8px">Bạn đã học hết từ HSK ' + l + ' 🎉</div>';
  miss.sort(function (a, b) { return (b.tags.length > 0) - (a.tags.length > 0); });
  return '<div style="margin-top:10px"><div class="small muted" style="margin-bottom:6px">Còn thiếu ' + miss.length + ' từ (từ có nhãn chủ đề xếp trước). Bấm vào từ để xem chi tiết:</div><div class="missing">' +
    miss.slice(0, 400).map(function (o) { return '<button data-open="' + esc(o.w) + '">' + esc(o.w) + '</button>'; }).join('') +
    '</div><button class="btn" style="margin-top:10px" data-goto="' + l + '">Mở danh sách để đánh dấu nhanh →</button></div>';
}
function reportText(st) {
  var lines = ['KẾT QUẢ ĐỐI CHIẾU HSK 3.0' + (S.name ? ' – ' + S.name : ''), 'Ngày: ' + new Date().toLocaleDateString('vi-VN')];
  LEVELS.forEach(function (l) { var s = st[l]; lines.push('HSK ' + l + ': ' + s.known + '/' + s.total + ' (' + pct(s.known, s.total) + '%), tích lũy ' + pct(s.cumKnown, s.cumTotal) + '%'); });
  lines.push('Tổng số từ đã học: ' + Object.keys(S.known).length);
  return lines.join('\n');
}
function copyText(t) {
  var fallback = function () {
    openSheet('<b>Sao chép nội dung dưới đây</b><textarea id="copyBox" style="margin-top:8px">' + esc(t) + '</textarea><div class="small muted">Nhấn giữ (điện thoại) hoặc Ctrl+C (máy tính) để sao chép.</div>');
    var b = $('copyBox'); b.focus(); b.select();
  };
  try {
    navigator.clipboard.writeText(t).then(function () { toast('Đã sao chép. Dán vào Zalo/Messenger để gửi.'); }, fallback);
  } catch (e) { fallback(); }
}

// ---------- On tap: flashcard (lap lai ngat quang) ----------
var R = { lv: 'all', front: 'hz', queue: [], cur: null, flipped: false, done: 0 };
function knownWords() {
  return Object.keys(S.known).map(function (w) { return BYW[w]; }).filter(function (o) { return o && (R.lv === 'all' || String(o.lv || 0) === R.lv); });
}
function isDue(w) { return ebDue(w); }
VIEWS.review = function () {
  if (R.cur) return renderCard();
  var ks = knownWords(), due = ks.filter(function (o) { return isDue(o.w); }), master = ks.filter(function (o) { return (S.eb[o.w] || [0])[0] >= MASTER; });
  var lvOpts = [['all', 'Tất cả cấp']].concat(LEVELS.map(function (l) { return [String(l), 'HSK ' + l]; })).concat([['0', 'Ngoài HSK']]);
  var h = '<div class="stat"><div><b>' + ks.length + '</b><span class="small muted">đã đánh dấu</span></div><div><b>' + due.length + '</b><span class="small muted">cần ôn hôm nay</span></div><div><b>' + master.length + '</b><span class="small muted">đã thuộc</span></div></div>';
  h += '<div class="card" style="margin-top:12px"><div class="row small" style="margin-bottom:10px">Ôn từ: <select id="rLv">' + lvOpts.map(function (x) { return '<option value="' + x[0] + '"' + (R.lv === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
    ' Mặt trước: <select id="rFront"><option value="hz">Chữ Hán</option><option value="vi">Nghĩa tiếng Việt</option><option value="audio">Nghe</option></select></div>';
  if (!ks.length) h += '<div class="empty">Chưa có từ nào được đánh dấu.<br>Vào <b>Tra từ</b> và bấm ✓ ở từ đã học để tạo bộ flashcard.</div>';
  else h += '<div style="display:grid;gap:8px"><button class="btn block primary" id="startDue"' + (due.length ? '' : ' disabled') + '>🃏 Ôn thẻ đến hạn (' + due.length + ')</button>' +
    '<button class="btn block" id="startAll">Ôn tất cả ' + ks.length + ' thẻ</button>' +
    '<button class="btn block" id="startQuiz">✍️ Làm bài tập trắc nghiệm (10 câu)</button></div>';
  h += '</div><div class="small muted">Lịch ôn theo đường cong lãng quên Ebbinghaus: 20 phút → 1 giờ → 1 → 2 → 4 → 7 → 15 → 30 ngày. Thẻ “Nhớ rồi” lên mốc tiếp theo; thẻ “Chưa nhớ” được ôn lại ngay trong lượt và lùi về mốc đầu.</div>';
  h += aiCardHtml();
  $('view-review').innerHTML = h;
  bindAiCard();
  $('rFront').value = R.front;
  $('rLv').onchange = function () { R.lv = this.value; VIEWS.review(); };
  $('rFront').onchange = function () { R.front = this.value; };
  if (ks.length) {
    $('startDue').onclick = function () { startCards(due); };
    $('startAll').onclick = function () { startCards(ks); };
    $('startQuiz').onclick = function () { startQuiz(shuffle(ks).slice(0, 10).map(function (o) { return o.w; }), 'mix'); };
  }
};
function startCards(list) { R.queue = shuffle(list.map(function (o) { return o.w; })); R.done = 0; nextCard(); }
function nextCard() { R.cur = R.queue.shift() || null; R.flipped = false; if (!R.cur) { toast('Hoàn thành lượt ôn! Đã ôn ' + R.done + ' thẻ.'); } lastDue = dueList().length; renderRemind(); VIEWS.review(); }
function renderCard() {
  var o = BYW[R.cur], e = o.ex[0];
  var front = R.front === 'vi' ? '<div style="font-size:22px">' + esc(meaning(o)) + '</div>' :
    R.front === 'audio' ? '<button class="speak" style="font-size:22px;padding:14px 22px" data-say="' + esc(o.w) + '">🔊 Nghe lại</button>' :
      '<div class="hz">' + esc(o.w) + '</div>';
  var back = '<div class="hz">' + esc(o.w) + '</div><div style="color:var(--brand);font-size:20px">' + esc(o.py) + '</div><div style="font-size:17px;margin:6px 0">' + esc(meaning(o)) + '</div>' +
    (e ? '<div class="zh" style="font-size:16px;margin-top:8px">' + esc(e.zh) + '</div><div class="small muted">' + esc(e.vi) + '</div>' : '') +
    (S.notes[o.w] ? '<div class="fc-note">📝 ' + esc(S.notes[o.w]) + '</div>' : '') +
    '<button class="speak" style="margin-top:10px" data-say="' + esc(o.w) + '">🔊</button>';
  $('view-review').innerHTML = '<div class="row"><span class="grow small muted">Còn ' + (R.queue.length + 1) + ' thẻ · đã ôn ' + R.done + '</span><button class="btn ghost" id="stopCards">Dừng</button></div>' +
    '<div class="fc-wrap"><div class="fc' + (R.flipped ? ' flip' : '') + '" id="fc"><div class="face">' + front + '<div class="hint">Chạm để lật thẻ</div></div><div class="face back">' + back + '</div></div></div>' +
    '<div class="fc-actions"><button class="btn block" id="again">😕 Chưa nhớ</button><button class="btn block ok" id="good">😀 Nhớ rồi</button></div>';
  if (R.front === 'audio' && !R.flipped) speak(o.w);
  $('fc').onclick = function (ev) { if (ev.target.closest('[data-say]')) return; R.flipped = !R.flipped; this.classList.toggle('flip', R.flipped); };
  $('stopCards').onclick = function () { R.cur = null; R.queue = []; renderRemind(); VIEWS.review(); };
  $('again').onclick = function () { if (isKnown(o.w)) ebAgain(o.w); R.queue.splice(Math.min(3, R.queue.length), 0, o.w); R.done++; nextCard(); };
  $('good').onclick = function () { if (isKnown(o.w)) ebGood(o.w); R.done++; nextCard(); };
}

// ---------- Bai tap ----------
function pool(o, n, test) {
  var same = WORDS.filter(function (x) { return x !== o && x.lv === o.lv && test(x); });
  if (same.length < n) same = same.concat(WORDS.filter(function (x) { return x !== o && x.lv !== o.lv && test(x); }));
  return shuffle(same).slice(0, n);
}
function segment(s) {
  var t = s.replace(/[，。？！、：；“”‘’（）《》,.?!:;"'()\s→]/g, ''), out = [];
  for (var i = 0; i < t.length;) {
    var len = Math.min(4, t.length - i), got = 1;
    for (; len > 1; len--) if (BYW[t.substr(i, len)]) { got = len; break; }
    out.push(t.substr(i, got)); i += got;
  }
  while (out.length > 7) { var j = Math.floor(Math.random() * (out.length - 1)); out.splice(j, 2, out[j] + out[j + 1]); }
  return { tiles: out, answer: t };
}
function makeQ(o, type) {
  var m = function (x) { return meaning(x); };
  switch (type) {
    case 'meaning': return { t: 'Chọn nghĩa đúng', p: '<span class="zh">' + esc(o.w) + '</span> <button class="mini-speak" data-say="' + esc(o.w) + '">🔊</button>', opts: shuffle([m(o)].concat(pool(o, 3, function (x) { return m(x) !== m(o) && (x.vi || x.en); }).map(m))), a: m(o) };
    case 'reverse': return { t: 'Chọn chữ Hán có nghĩa', p: esc(m(o)), opts: shuffle([o.w].concat(pool(o, 3, function () { return true; }).map(function (x) { return x.w; }))), a: o.w, zh: 1 };
    case 'pinyin': return { t: 'Chọn pinyin đúng', p: '<span class="zh">' + esc(o.w) + '</span>', opts: shuffle([o.py].concat(pool(o, 3, function (x) { return x.py !== o.py; }).map(function (x) { return x.py; }))), a: o.py };
    case 'listen': return { t: 'Nghe và chọn từ đúng', p: '<button class="speak" style="font-size:20px;padding:10px 18px" data-say="' + esc(o.w) + '">🔊 Nghe</button> <button class="speak" data-say="' + esc(o.w) + '" data-slow="1">🐢</button>', opts: shuffle([o.w].concat(pool(o, 3, function (x) { return x.w.length === o.w.length || Math.random() < .3; }).map(function (x) { return x.w; }))), a: o.w, zh: 1, say: o.w };
    case 'listenMeaning': return { t: 'Nghe và chọn nghĩa đúng', p: '<button class="speak" style="font-size:20px;padding:10px 18px" data-say="' + esc(o.w) + '">🔊 Nghe</button> <button class="speak" data-say="' + esc(o.w) + '" data-slow="1">🐢</button>', opts: shuffle([m(o)].concat(pool(o, 3, function (x) { return m(x) !== m(o) && x.vi; }).map(m))), a: m(o), say: o.w, after: o.w + ' – ' + o.py };
    case 'fill':
      var e = o.ex.filter(function (x) { return x.zh.indexOf(o.w) >= 0; })[0];
      return { t: 'Chọn từ điền vào chỗ trống', p: '<span class="zh">' + esc(e.zh.split(o.w).join('＿＿')) + '</span><div class="small muted">' + esc(e.vi) + '</div>', opts: shuffle([o.w].concat(pool(o, 3, function (x) { return e.zh.indexOf(x.w) < 0; }).map(function (x) { return x.w; }))), a: o.w, zh: 1, after: e.zh };
    case 'order':
      var e2 = o.ex[1] || o.ex[0], sg = segment(e2.zh);
      return { t: 'Dịch sang tiếng Trung: sắp xếp các từ', p: esc(e2.vi), tiles: shuffle(sg.tiles), a: sg.answer, after: e2.zh };
    case 'qa':
      var others = pool(o, 3, function (x) { return x.qa && x.qa.a !== o.qa.a; }).map(function (x) { return x.qa.a; });
      return { t: 'Nghe câu hỏi và chọn câu trả lời phù hợp', p: '<span class="zh">' + esc(o.qa.q) + '</span> <button class="mini-speak" data-say="' + esc(o.qa.q) + '">🔊</button><div class="small muted">' + esc(o.qa.qvi) + '</div>', opts: shuffle([o.qa.a].concat(others)), a: o.qa.a, zh: 1, say: o.qa.q };
  }
}
function typesFor(o) {
  var hasFill = o.ex.some(function (x) { return x.zh.indexOf(o.w) >= 0; });
  var t = ['meaning', 'listen'];
  t.push(hasFill ? 'fill' : 'pinyin');
  t.push(o.ex.length && segment((o.ex[1] || o.ex[0]).zh).tiles.length > 2 ? 'order' : 'reverse');
  var hasQa = o.qa && WORDS.filter(function (x) { return x.qa; }).length > 4;
  if (hasQa) t.push('qa');
  else ['pinyin', 'reverse', 'listenMeaning'].forEach(function (x) { if (t.length < 5 && t.indexOf(x) < 0) t.push(x); });
  return t;
}
var QZ = null;
function startQuiz(ws, mode) {
  var qs = [];
  if (mode === 'single') { var o = BYW[ws[0]]; qs = typesFor(o).map(function (t) { return makeQ(o, t); }); }
  else ws.forEach(function (w) { var o = BYW[w], ts = typesFor(o); qs.push(makeQ(o, ts[Math.floor(Math.random() * ts.length)])); });
  QZ = { qs: qs, i: 0, res: [], ws: ws, mode: mode };
  renderQ();
}
function renderQ() {
  var q = QZ.qs[QZ.i];
  var dots = '<div class="dots">' + QZ.qs.map(function (_, k) { return '<span class="' + (k === QZ.i ? 'cur' : QZ.res[k] === true ? 'ok' : QZ.res[k] === false ? 'no' : '') + '"></span>'; }).join('') + '</div>';
  var h = dots + '<div class="q-title">Câu ' + (QZ.i + 1) + '/' + QZ.qs.length + ' · ' + q.t + '</div><div class="q-prompt">' + q.p + '</div>';
  if (q.tiles) h += '<div class="answer-line" id="ans"></div><div class="tiles" id="tiles">' + q.tiles.map(function (t, k) { return '<button class="tile" data-k="' + k + '">' + esc(t) + '</button>'; }).join('') + '</div><button class="btn block primary" id="checkOrder" style="margin-top:12px">Kiểm tra</button>';
  else h += '<div class="opts">' + q.opts.map(function (x) { return '<button class="opt' + (q.zh ? ' zhopt' : '') + '" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>';
  h += '<div id="fb"></div>';
  openSheet(h);
  if (q.say) setTimeout(function () { speak(q.say); }, 250);
  if (q.tiles) {
    var picked = [];
    var draw = function () {
      $('ans').innerHTML = picked.map(function (k, idx) { return '<button class="tile" data-u="' + idx + '">' + esc(q.tiles[k]) + '</button>'; }).join('');
      $('tiles').querySelectorAll('.tile').forEach(function (b) { b.style.visibility = picked.indexOf(+b.dataset.k) >= 0 ? 'hidden' : ''; });
    };
    $('tiles').onclick = function (e) { var b = e.target.closest('.tile'); if (b && QZ.res[QZ.i] === undefined) { picked.push(+b.dataset.k); draw(); } };
    $('ans').onclick = function (e) { var b = e.target.closest('.tile'); if (b && QZ.res[QZ.i] === undefined) { picked.splice(+b.dataset.u, 1); draw(); } };
    $('checkOrder').onclick = function () {
      if (QZ.res[QZ.i] !== undefined) return nextQ();
      var ok = picked.map(function (k) { return q.tiles[k]; }).join('') === q.a;
      answered(ok, q); this.textContent = 'Câu tiếp →';
    };
  } else {
    $('sheet').querySelector('.opts').onclick = function (e) {
      var b = e.target.closest('.opt'); if (!b || QZ.res[QZ.i] !== undefined) return;
      var ok = b.dataset.v === q.a;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) this.querySelectorAll('.opt').forEach(function (x) { if (x.dataset.v === q.a) x.classList.add('right'); });
      answered(ok, q);
    };
  }
}
function answered(ok, q) {
  QZ.res[QZ.i] = ok;
  var extra = q.after ? '<div class="zh" style="margin-top:6px">' + esc(q.after) + ' <button class="mini-speak" data-say="' + esc(q.after) + '">🔊</button></div>' : '';
  $('fb').innerHTML = '<div class="feedback ' + (ok ? 'good' : 'bad') + '">' + (ok ? '✓ Chính xác!' : '✗ Chưa đúng. Đáp án: <b class="zh">' + esc(q.a) + '</b>') + extra + (q.note ? '<div class="small" style="margin-top:6px;white-space:pre-line">💡 ' + esc(q.note) + '</div>' : '') + '</div>' +
    (q.tiles ? '' : '<button class="btn block primary" style="margin-top:10px" id="nextQ">Câu tiếp →</button>');
  if ($('nextQ')) $('nextQ').onclick = nextQ;
}
function nextQ() {
  QZ.i++;
  if (QZ.i < QZ.qs.length) return renderQ();
  var n = QZ.res.filter(Boolean).length, all = QZ.qs.length, single = QZ.mode === 'single' ? QZ.ws[0] : null;
  var h = '<div class="word-head"><div style="font-size:48px">' + (n === all ? '🎉' : n >= all / 2 ? '👍' : '💪') + '</div><div class="big-msg">Đúng <b>' + n + '/' + all + '</b> câu</div></div><div style="display:grid;gap:8px;margin-top:12px">' +
    '<button class="btn block primary" id="redo">Làm lại</button>';
  if (single && !isKnown(single) && n >= 4) h += '<button class="btn block ok" data-toggle="' + esc(single) + '">Đánh dấu “' + esc(single) + '” là ĐÃ HỌC</button>';
  if (single) h += '<button class="btn block" data-open="' + esc(single) + '">Quay lại từ ' + esc(single) + '</button>';
  h += '</div>';
  openSheet(h);
  $('redo').onclick = function () { if (QZ.mode === 'ai') return aiQuiz(); startQuiz(QZ.mode === 'single' ? QZ.ws : shuffle(QZ.ws), QZ.mode); };
}

// ---------- Cai dat ----------
VIEWS.more = function () {
  var h = '<div class="card"><b>Tên học viên</b><div class="row" style="margin-top:6px"><input id="stName" class="grow" style="padding:9px;border:1px solid var(--line);border-radius:10px;background:var(--card)" placeholder="Nhập tên của bạn" value="' + esc(S.name) + '"><button class="btn" id="saveName">Lưu</button></div></div>';
  h += remindSettingsHtml();
  h += '<div class="card"><b>Sao lưu & chuyển máy</b><div class="small muted" style="margin:4px 0 8px">Tiến độ, từ của tôi và ghi chú được lưu ngay trên trình duyệt của máy này. Muốn dùng trên máy khác (điện thoại ↔ máy tính), hãy sao lưu rồi khôi phục ở máy kia.</div>' +
    '<div class="row"><button class="btn primary" id="exportCode">📋 Sao chép mã sao lưu</button><button class="btn" id="exportFile">⬇️ Tải file sao lưu</button></div>' +
    '<div style="margin-top:10px"><textarea id="importBox" placeholder="Dán mã sao lưu vào đây…"></textarea><div class="row" style="margin-top:6px"><button class="btn primary" id="importBtn">Khôi phục từ mã</button><label class="btn">Chọn file sao lưu<input type="file" id="importFile" accept=".json,.txt" hidden></label></div></div></div>';
  h += '<div class="card"><b>Giao diện</b><div class="row" style="margin-top:6px"><button class="btn" data-theme="">Theo máy</button><button class="btn" data-theme="light">Sáng</button><button class="btn" data-theme="dark">Tối</button></div></div>';
  h += '<div class="card"><b>Phát âm</b><div class="small muted" style="margin-top:4px">Giọng đọc dùng bộ đọc có sẵn của thiết bị. ' + (zhVoice ? 'Đã tìm thấy giọng tiếng Trung: <b>' + esc(zhVoice.name) + '</b>.' : 'Chưa tìm thấy giọng tiếng Trung. Android: Cài đặt → Ngôn ngữ → Chuyển văn bản thành giọng nói → tải gói tiếng Trung. iPhone: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Trung. Windows: Cài đặt → Thời gian & ngôn ngữ → thêm Tiếng Trung (giản thể).') + '</div><button class="btn" style="margin-top:8px" data-say="你好，欢迎学习汉语">🔊 Thử giọng đọc</button></div>';
  h += '<div class="card"><details><summary>Hướng dẫn cho giáo viên: bổ sung từ vựng</summary><div class="small" style="margin-top:8px">' +
    '<p>Cách 1 – file <code>data/bo-sung.js</code>: mỗi dòng một từ, các cột cách nhau bằng <code>|</code>:<br><code>tu|pinyin|cap|nhan|nghia|cau1|pinyin1|dich1|cau2|pinyin2|dich2|cau hoi|dich cau hoi|tra loi</code></p>' +
    '<p>Cách 2 – file Excel: lưu thành <code>data/bo-sung.csv</code> (CSV UTF-8) với đúng 14 cột như trên, dòng đầu là tiêu đề.</p>' +
    '<p>Từ đã có trong HSK sẽ được bổ sung nhãn/ví dụ; từ mới sẽ được thêm vào danh sách (cấp để trống = “Ngoài HSK”). Nhãn chủ đề khai báo trong <code>data/nhan.js</code>.</p></div></details></div>';
  h += '<div class="card small muted">Dữ liệu: danh sách từ HSK 3.0 cấp 1–6 theo 新版HSK考试大纲 (2025) – ' + WORDS.filter(function (o) { return typeof o.lv === 'number' && o.lv > 0; }).length + ' từ. Nghĩa tiếng Anh dự phòng từ CC-CEDICT.' +
    '<div style="margin-top:8px"><button class="btn" id="resetAll">Xóa toàn bộ tiến độ trên máy này</button></div></div>';
  $('view-more').innerHTML = h;
  $('saveName').onclick = function () { S.name = $('stName').value.trim(); save(); updateSub(); toast('Đã lưu tên.'); };
  $('exportFile').onclick = function () { downloadFile('hsk-tien-do-' + (S.name || 'hoc-vien').replace(/\s+/g, '-') + '.json', JSON.stringify(S), 'application/json'); };
  bindRemindSettings();
  $('exportCode').onclick = function () { copyText(btoa(unescape(encodeURIComponent(JSON.stringify(S))))); };
  $('importBtn').onclick = function () { importData($('importBox').value.trim()); };
  $('importFile').onchange = function () { var f = this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { importData(r.result); }; r.readAsText(f); };
  $('view-more').querySelectorAll('[data-theme]').forEach(function (b) {
    b.onclick = function () { setTheme(b.dataset.theme); };
  });
  $('resetAll').onclick = function () { askConfirm('Xóa toàn bộ từ đã đánh dấu và lịch ôn trên máy này?', 'Xóa tiến độ', function () { S.known = {}; S.srs = {}; S.eb = {}; save(); renderRemind(); updateSub(); toast('Đã xóa.'); }); };
};
function importData(t) {
  if (!t) return toast('Chưa có dữ liệu.');
  try {
    var o = t.charAt(0) === '{' ? JSON.parse(t) : JSON.parse(decodeURIComponent(escape(atob(t))));
    if (!o.known) throw 0;
    askConfirm('Khôi phục ' + Object.keys(o.known).length + ' từ đã học? Tiến độ hiện có trên máy này được giữ và gộp chung.', 'Khôi phục', function () {
      Object.assign(S.known, o.known); Object.assign(S.srs, o.srs || {}); Object.assign(S.eb, o.eb || {}); ebSpread(Object.keys(o.known)); renderRemind(); if (o.name && !S.name) S.name = o.name;
      Object.assign(S.mine, o.mine || {}); Object.assign(S.notes, o.notes || {}); applyMine(); touch(); renderChips();
      save(); updateSub(); toast('Đã khôi phục.'); VIEWS.more();
    });
  } catch (e) { toast('Mã sao lưu không hợp lệ.'); }
}
function setTheme(t) {
  if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  try { localStorage.setItem('hsk30.theme', t); } catch (e) { }
}
try { setTheme(localStorage.getItem('hsk30.theme') || ''); } catch (e) { }

boot();
