/* Lich su luyen voi AI: luu bai tap AI va buoi luyen noi (cau hoi, cau tra loi, ket qua cham) vao S.aiHist,
   dong bo theo tai khoan. Tat app mo lai van lam tiep, xem lai, hoac lam lai dung bo cau hoi cu. */
'use strict';

var HIST_MAX = 30;
function histS() { S.aiHist = S.aiHist || []; return S.aiHist; }
function histAdd(e) {
  e.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); e.at = e.up = Date.now();
  var H = histS(); H.unshift(e); if (H.length > HIST_MAX) H.length = HIST_MAX;
  save(); return e;
}
function histGet(id) { return histS().filter(function (e) { return e.id === id; })[0] || null; }
function histTouch(e) { e.up = Date.now(); save(); }
var AI_QUIZ_MODES = { ai: 'Bài tập AI', aierr: 'Bài AI từ lỗi sai' };

// ---------- Bai tap AI: tu luu khi bat dau, sau moi cau va khi xong ----------
var histRenderQ = renderQ;
renderQ = function () {
  if (QZ && AI_QUIZ_MODES[QZ.mode] && !QZ.hid) QZ.hid = histAdd({ kind: 'quiz', mode: QZ.mode, ws: QZ.ws || [], qs: QZ.qs, res: [], picks: [] }).id;
  histRenderQ();
};
var histAnswered = answered;
answered = function (ok, q) {
  histAnswered(ok, q);
  var e = QZ && QZ.hid && histGet(QZ.hid); if (!e) return;
  e.res[QZ.i] = ok; e.picks[QZ.i] = errPick;
  if (e.res.filter(function (x) { return x != null; }).length >= e.qs.length) e.done = true;
  histTouch(e);
};
function quizResume(e) {
  var i = 0; while (i < e.qs.length && e.res[i] != null) i++;
  if (i >= e.qs.length) return histOpen(e.id);
  QZ = { qs: e.qs, i: i, res: e.res.slice(), ws: e.ws || [], mode: e.mode, hid: e.id };
  renderQ();
}
function quizRedo(e) { QZ = { qs: e.qs.map(function (q) { var c = Object.assign({}, q); if (c.opts) c.opts = shuffle(c.opts); if (c.tiles) c.tiles = shuffle(c.tiles); return c; }), i: 0, res: [], ws: e.ws || [], mode: e.mode }; renderQ(); }

// ---------- Tom tat mot muc ----------
function histInfo(e) {
  var n = e.qs.length;
  if (e.kind === 'quiz') {
    var got = e.res.filter(function (x) { return x != null; }), ok = got.filter(Boolean).length;
    return { icon: '📝', ten: AI_QUIZ_MODES[e.mode] || 'Bài tập AI', sub: n + ' câu', diem: got.length ? ok + '/' + got.length + ' đúng' : '', dang: got.length < n, lam: got.length };
  }
  var g = e.res.filter(function (x) { return x != null; }), avg = g.length ? Math.round(g.reduce(function (a, b) { return a + b; }, 0) / g.length * 10) / 10 : null;
  return { icon: e.reflex ? '⚡' : '🎤', ten: e.ten || 'Luyện nói · cấp ' + NOI_LV[e.lv].ten, sub: n + ' câu', diem: avg != null ? 'TB ' + avg + '/10' : '', dang: !e.done && g.length < n, lam: g.length };
}
function histRowHtml(e) {
  var f = histInfo(e);
  return '<button class="hist-row" data-hist="' + esc(e.id) + '"><span class="hist-ic">' + f.icon + '</span><span class="grow"><b>' + esc(f.ten) + '</b><span class="small muted"> · ' + f.sub + ' · ' + fmtAgo(e.up || e.at) + '</span>' +
    '<span class="small">' + (f.dang ? '<span class="hist-dang">Đang làm ' + f.lam + '/' + e.qs.length + '</span> ' : '') + (f.diem ? esc(f.diem) : '') + '</span></span><span class="hist-go">›</span></button>';
}

// ---------- The tren tab On tap ----------
function histCardHtml() {
  var H = histS(); if (!H.length) return '';
  return '<div class="card hist-card"><b>🗂️ Bài luyện AI đã lưu</b><div class="small muted" style="margin:4px 0 8px">Câu hỏi AI tạo, câu trả lời và kết quả chấm được lưu lại' + (window.FB && FB.user ? ' theo tài khoản' : ' trên máy này') + '. Bấm để làm tiếp hoặc xem lại.</div>' +
    '<div class="hist-list">' + H.slice(0, 6).map(histRowHtml).join('') + '</div>' +
    (H.length > 6 ? '<button class="btn block ghost" id="histAll" style="margin-top:6px">Xem tất cả ' + H.length + ' bài</button>' : '') + '</div>';
}
var histReview = VIEWS.review;
VIEWS.review = function () {
  histReview();
  if (R.cur) return;
  var c = histCardHtml(); if (!c) return;
  var ai = $('view-review').querySelector('.ai-card');
  if (ai) ai.insertAdjacentHTML('afterend', c); else $('view-review').insertAdjacentHTML('beforeend', c);
  if ($('histAll')) $('histAll').onclick = function () { openSheet('<h3 style="margin-top:4px">🗂️ Bài luyện AI đã lưu</h3><div class="hist-list">' + histS().map(histRowHtml).join('') + '</div>'); };
};
document.addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-hist]'); if (!b) return;
  var e = histGet(b.dataset.hist); if (!e) return;
  if (histInfo(e).dang) return e.kind === 'quiz' ? quizResume(e) : noiResume(e);
  histOpen(e.id);
});

// ---------- Xem lai mot bai ----------
function histOpen(id) {
  var e = histGet(id); if (!e) return;
  var f = histInfo(e), h = '<h3 style="margin-top:4px">' + f.icon + ' ' + esc(f.ten) + '</h3><div class="small muted" style="margin-bottom:10px">' + new Date(e.at).toLocaleString('vi-VN') + (f.diem ? ' · ' + esc(f.diem) : '') + '</div>';
  if (e.kind === 'quiz') {
    h += e.qs.map(function (q, i) {
      var r = e.res[i], prompt = q.tiles ? (plain(q.p) || '') : plain(q.p);
      return '<div class="card hist-q"><div class="small muted">Câu ' + (i + 1) + ' · ' + esc(q.t) + '</div>' + (prompt ? '<div class="zh-mix">' + esc(prompt) + '</div>' : '') +
        (r == null ? '<div class="small muted">Chưa làm</div>' : (r ? '<div class="small">✅ <span class="zh">' + esc(q.a) + '</span></div>' :
          '<div class="small">❌ Bạn chọn: <span class="zh">' + esc(e.picks[i] || '—') + '</span></div><div class="small">✅ Đáp án: <span class="zh">' + esc(q.a) + '</span></div>')) +
        (q.note ? '<div class="small muted" style="white-space:pre-line;margin-top:4px">💡 ' + esc(q.note) + '</div>' : '') + '</div>';
    }).join('');
    h += '<div style="display:grid;gap:8px"><button class="btn block primary" id="histRedo">↻ Làm lại bộ câu hỏi này</button>';
  } else {
    h += e.qs.map(function (q, i) {
      var g = e.grade[i];
      return '<div class="card hist-q"><div class="small muted">Câu ' + (i + 1) + (g ? ' · ' + g.diem + '/10' : '') + '</div><div class="zh">' + esc(q.q) + '</div>' + (q.vi ? '<div class="small muted">' + esc(q.vi) + '</div>' : '') +
        '<div class="small" style="margin-top:4px">🗣️ Bạn trả lời: <span class="zh">' + esc(e.ans[i] || '—') + '</span></div>' +
        (g && g.sua && g.sua.zh && g.sua.zh !== e.ans[i] ? '<div class="small">✏️ Sửa: <span class="zh">' + esc(g.sua.zh) + '</span></div>' : '') +
        (g && g.goiy && g.goiy[0] ? '<div class="small">💡 Gợi ý: <span class="zh">' + esc(g.goiy[0].zh) + '</span></div>' : '') +
        '<button class="linkish small" data-noiat="' + i + '">Mở câu này</button></div>';
    }).join('');
    h += '<div style="display:grid;gap:8px"><button class="btn block primary" id="histRedo">↻ Luyện lại các câu hỏi này</button>';
  }
  h += '<button class="btn block ghost" id="histDel">Xóa bài này khỏi lịch sử</button></div>';
  openSheet(h);
  $('histRedo').onclick = function () { if (e.kind === 'quiz') quizRedo(e); else noiBegin(e.lv, e.qs, e.ws || []); };
  $('histDel').onclick = function () {
    askConfirm('Xóa bài này khỏi lịch sử? Sổ tay lỗi sai vẫn giữ nguyên.', 'Xóa', function () {
      var H = histS(); H.splice(H.indexOf(e), 1); save(); closeSheet(); if (document.querySelector('#view-review.active')) VIEWS.review();
    });
  };
  $('sheet').querySelectorAll('[data-noiat]').forEach(function (b) { b.onclick = function () { noiResume(e, +b.dataset.noiat); }; });
}
