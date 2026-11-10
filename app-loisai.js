/* So tay loi sai: ghi lai cau lam sai (bai tap, bai AI, luyen noi), luyen lai va nho AI soan bai tu chinh loi sai.
   S.err: {tu: {n: so lan sai, ok: so lan dung lien tiep sau lan sai cuoi, last: ms, fixed: true khi dung 2 lan lien tiep,
                items: [{t: dang bai, p: de bai, g: ban tra loi, a: dap an, at: ms}] (giu 5 lan gan nhat)}} */
'use strict';

var ERR_FIX = 2; // dung lien tiep bao nhieu lan thi coi la da khac phuc
function errS() { S.err = S.err || {}; return S.err; }
function errActive() {
  var E = errS();
  return Object.keys(E).filter(function (w) { return !E[w].fixed && (BYW[w] || E[w].own); }).sort(function (a, b) { return E[b].last - E[a].last; });
}
function plain(html) { var d = document.createElement('div'); d.innerHTML = html || ''; d.querySelectorAll('button').forEach(function (b) { b.remove(); }); return d.textContent.replace(/\s+/g, ' ').trim(); }
function errAdd(w, it) {
  w = String(w || '').trim(); if (!w || (!BYW[w] && !it.own)) return;
  var E = errS(), e = E[w] || (E[w] = { n: 0, ok: 0, last: 0, items: [] });
  e.n++; e.ok = 0; e.fixed = false; e.last = Date.now(); if (it.own && !BYW[w]) e.own = 1;
  it.at = e.last; e.items.unshift(it); e.items = e.items.slice(0, 5);
  save();
}
function errRight(w) {
  var e = errS()[w]; if (!e || e.fixed) return;
  e.ok++; if (e.ok >= ERR_FIX) e.fixed = true;
  save();
}

// ---------- Ghi loi tu moi bai tap ----------
// Gan tu dang luyen vao cau hoi (bai thuong va bai AI)
var errMakeQ = makeQ;
makeQ = function (o, type) { var q = errMakeQ(o, type); if (q) q.w = o.w; return q; };
var errAiToQ = aiToQ;
aiToQ = function (x) { var q = errAiToQ(x); if (q && x && x.word) q.w = String(x.word); return q; };
// Nho cau tra loi hoc vien vua chon
var errPick = '';
document.addEventListener('click', function (e) {
  var o = e.target.closest('.opt'); if (o) errPick = o.dataset.v || '';
  if (e.target.closest('#checkOrder') && $('ans')) errPick = [].map.call($('ans').querySelectorAll('.tile'), function (t) { return t.textContent; }).join('');
}, true);
var errAnswered = answered;
answered = function (ok, q) {
  errAnswered(ok, q);
  if (!q.w) return;
  if (ok) errRight(q.w);
  else errAdd(q.w, { t: q.t, p: plain(q.p), g: errPick, a: q.a });
};


// ---------- The tren tab On tap ----------
function errCardHtml() {
  var act = errActive(), E = errS(), fixed = Object.keys(E).filter(function (w) { return E[w].fixed; }).length;
  var h = '<div class="card err-card"><b>📕 Sổ tay lỗi sai</b>';
  var add = '<button class="btn block" id="errNew">＋ Tự ghi lỗi sai của mình</button>';
  if (!act.length) return h + '<div class="small muted" style="margin:4px 0 10px">' + (fixed ? '🎉 Bạn đã khắc phục hết ' + fixed + ' lỗi. ' : '') + 'Câu làm sai trong bài trắc nghiệm được tự ghi vào đây. Lỗi AI chỉ ra khi luyện nói, đặt câu: bấm “＋ Sổ lỗi” ở lỗi bạn muốn lưu. Bạn cũng có thể tự ghi lỗi gặp khi học.</div>' + add + '</div>';
  return h + '<div class="small muted" style="margin:4px 0 10px"><b>' + act.length + '</b> lỗi cần ôn' + (fixed ? ' · ' + fixed + ' đã khắc phục' : '') + '. Làm đúng ' + ERR_FIX + ' lần liên tiếp thì từ đó được tính là đã khắc phục.</div>' +
    '<div class="err-chips">' + act.slice(0, 12).map(function (w) { return '<button class="chip"' + (BYW[w] ? ' data-open="' + esc(w) + '"' : ' data-errlist="1"') + '>' + esc(w) + ' <span class="err-n">×' + E[w].n + '</span></button>'; }).join('') + '</div>' +
    '<div style="display:grid;gap:8px;margin-top:10px"><button class="btn block" id="errList">📖 Xem chi tiết lỗi sai</button>' + add +
    '<button class="btn block" id="errQuiz">🔁 Luyện lại các từ hay sai</button>' +
    (aiReady() ? '<button class="btn block primary" id="errAi">✨ AI tạo bài tập mới từ lỗi sai</button>' : '<div class="small muted">Thêm AI (Cài đặt → Khóa AI) để AI soạn bài riêng nhắm vào đúng lỗi của bạn.</div>') + '</div></div>';
}
function bindErrCard() {
  if ($('errNew')) $('errNew').onclick = function () { errForm(); };
  if (!$('errList')) return;
  $('errList').onclick = errListOpen;
  $('errQuiz').onclick = function () { var ws = errActive().filter(function (w) { return BYW[w]; }); if (!ws.length) return toast('Các lỗi tự ghi chưa có trong kho từ, hãy dùng nút AI tạo bài tập.'); startQuiz(shuffle(ws).slice(0, 10), 'mix'); };
  if ($('errAi')) $('errAi').onclick = aiErrQuiz;
}
document.addEventListener('click', function (e) { if (e.target.closest('[data-errlist]')) errListOpen(); });
var errReview = VIEWS.review;
VIEWS.review = function () {
  errReview();
  if (R.cur) return;
  var ai = $('view-review').querySelector('.ai-card');
  if (ai) ai.insertAdjacentHTML('beforebegin', errCardHtml()); else $('view-review').insertAdjacentHTML('beforeend', errCardHtml());
  bindErrCard();
};
function errRefresh() { if (document.querySelector('#view-review.active')) VIEWS.review(); }

// ---------- Tu ghi loi sai ----------
function errForm(pre) {
  pre = pre || {};
  openSheet('<h3 style="margin-top:4px">＋ Ghi lỗi sai của mình</h3><div class="small muted" style="margin-bottom:10px">Chỉ cần điền từ hay sai; các ô khác không bắt buộc.</div>' +
    '<div class="err-form"><label class="small">Từ / cụm từ hay dùng sai<input id="efW" placeholder="Ví dụ: 急剧" value="' + esc(pre.w || '') + '"></label>' +
    '<label class="small">Câu mình đã viết / nói sai<input id="efG" placeholder="Ví dụ: 我们要急剧讨论补救方案。" value="' + esc(pre.g || '') + '"></label>' +
    '<label class="small">Câu đúng<input id="efA" placeholder="Ví dụ: 我们要积极讨论补救方案。" value="' + esc(pre.a || '') + '"></label>' +
    '<label class="small">Vì sao sai / ghi chú cho mình<textarea id="efN" class="note" placeholder="Ví dụ: 急剧 chỉ dùng cho thay đổi nhanh (急剧增加); muốn nói “tích cực” dùng 积极.">' + esc(pre.why || '') + '</textarea></label></div>' +
    '<div class="row" style="margin-top:10px"><button class="btn primary grow" id="efSave">Lưu vào sổ lỗi</button><button class="btn" data-close>Hủy</button></div>');
  $('efSave').onclick = function () {
    var w = $('efW').value.trim(); if (!w) return toast('Hãy nhập từ hay dùng sai.');
    errAdd(w, { t: 'Tự ghi', p: '', g: $('efG').value.trim(), a: $('efA').value.trim(), why: $('efN').value.trim(), fix: 1, own: 1 });
    closeSheet(); toast('Đã lưu vào Sổ tay lỗi sai.'); errRefresh();
  };
}
// Nut "+ So loi" dat canh tung loi AI chi ra (hoc vien tu chon loi nao can luu)
var ERR_PEND = {};
function errBtn(w, it) {
  var k = 'e' + Math.random().toString(36).slice(2, 8); ERR_PEND[k] = { w: w, it: it };
  return '<button class="btn mini-btn" data-erradd="' + k + '">＋ Sổ lỗi</button>';
}
document.addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-erradd]'); if (!b) return;
  var p = ERR_PEND[b.dataset.erradd]; if (!p) return;
  p.it.own = 1; errAdd(p.w, p.it); delete ERR_PEND[b.dataset.erradd];
  b.textContent = '✓ Đã lưu'; b.disabled = true; toast('Đã lưu “' + p.w + '” vào Sổ tay lỗi sai.');
});

function fmtAgo(ms) {
  var m = Math.round((Date.now() - ms) / 60000);
  return m < 1 ? 'vừa xong' : m < 60 ? m + ' phút trước' : m < 1440 ? Math.round(m / 60) + ' giờ trước' : Math.round(m / 1440) + ' ngày trước';
}
function errListOpen() {
  var E = errS(), act = errActive();
  var h = '<h3 style="margin-top:4px">📕 Sổ tay lỗi sai</h3><div class="row" style="margin-bottom:10px"><span class="small muted grow">Xếp theo lần sai gần nhất. Bấm vào chữ Hán để xem lại từ.</span><button class="btn" id="errNew2">＋ Tự ghi lỗi</button></div>';
  h += act.map(function (w) {
    var o = BYW[w], e = E[w];
    return '<div class="card err-item"><div class="row"><span class="grow">' + (o ? '<button class="linkish zh" data-open="' + esc(w) + '" style="font-size:20px">' + esc(w) + '</button> <span class="py">' + esc(o.py) + '</span><div class="small">' + esc(meaning(o)) + '</div>' :
      '<span class="zh" style="font-size:20px">' + esc(w) + '</span><div class="small muted">Chưa có trong kho từ' + (typeof addWordOpen === 'function' && /[㐀-鿿]/.test(w) ? ' · <button class="linkish" data-addword="' + esc(w) + '">＋ Thêm vào kho từ</button>' : '') + '</div>') + '</span>' +
      '<span class="small muted" style="text-align:right">Sai ' + e.n + ' lần<br>' + fmtAgo(e.last) + '</span></div>' +
      e.items.slice(0, 3).map(function (it) {
        return '<div class="err-row small"><div class="muted">' + esc(it.t || '') + '</div>' + (it.p ? '<div>' + esc(it.p) + '</div>' : '') +
          (it.g ? '<div>❌ ' + (it.fix ? 'Câu sai' : 'Bạn trả lời') + ': <span class="zh">' + esc(it.g) + '</span></div>' : '') + (it.a ? '<div>✅ ' + (it.fix ? 'Nên nói' : 'Đáp án') + ': <span class="zh">' + esc(it.a) + '</span></div>' : '') + (it.why ? '<div class="muted" style="white-space:pre-line">💡 ' + esc(it.why) + '</div>' : '') + '</div>';
      }).join('') +
      '<div class="row" style="margin-top:6px">' + (o ? '<button class="btn" data-practice="' + esc(w) + '">Luyện từ này</button>' : '') + '<button class="btn ghost" data-errdel="' + esc(w) + '">Đã hiểu, xóa khỏi sổ</button></div></div>';
  }).join('') || '<div class="empty">Sổ lỗi đang trống.</div>';
  openSheet(h);
  $('errNew2').onclick = function () { errForm(); };
  $('sheet').querySelectorAll('[data-errdel]').forEach(function (b) {
    b.onclick = function () { var e = E[b.dataset.errdel]; if (e) { e.fixed = true; save(); } errListOpen(); errRefresh(); };
  });
}

// ---------- AI soan bai tu loi sai ----------
function errContext(ws) {
  var E = errS();
  return ws.map(function (w) {
    var o = BYW[w] || { py: '', vi: '(lỗi tự ghi)' }, e = E[w];
    return '- ' + w + ' (' + o.py + '): ' + meaning(o) + ' – sai ' + e.n + ' lần. ' + e.items.slice(0, 2).map(function (it) {
      return '[' + (it.t || '') + '] đề: "' + (it.p || '').slice(0, 80) + '"' + (it.g ? ', học viên trả lời "' + it.g + '"' : '') + ', đáp án "' + it.a + '"';
    }).join('; ');
  }).join('\n');
}
function aiErrQuiz() {
  if (AI.busy) return;
  var ws = errActive().slice(0, 8); if (!ws.length) return toast('Sổ lỗi đang trống.');
  AI.busy = true; aiLoading('AI đang soạn bài nhắm vào lỗi sai của bạn…');
  var os = ws.map(function (w) { return BYW[w]; }).filter(Boolean);
  var prompt = 'Bạn là giáo viên tiếng Trung. ' + CONTEXT + '\nTrình độ: khoảng ' + lvHint(os) + '.\n' +
    'Dưới đây là các từ học viên hay làm sai và lỗi cụ thể của họ:\n' + errContext(ws) + '\n\n' +
    'Hãy soạn đúng 8 câu hỏi MỚI (không lặp lại đề cũ) nhắm đúng vào chỗ học viên nhầm: nếu họ nhầm hai từ với nhau thì cho phương án gây nhầm đó; nếu sai trật tự câu thì cho bài sắp xếp; nếu hiểu sai nghĩa thì cho bài chọn nghĩa trong ngữ cảnh. Mỗi từ ít nhất một câu. Dạng câu:\n' +
    '- "ngucanh": câu tiếng Trung có chỗ trống ＿＿, chọn từ đúng trong 4 từ.\n' +
    '- "dich": cho câu tiếng Việt, chọn câu tiếng Trung dịch đúng trong 4 câu.\n' +
    '- "nghia": cho câu tiếng Trung, chọn nghĩa tiếng Việt đúng trong 4 câu.\n' +
    '- "dungsai": cho 4 câu tiếng Trung dùng cùng một từ, chọn câu dùng từ ĐÚNG.\n' +
    '- "sapxep": cho câu tiếng Trung ngắn (6–12 chữ) đã chia thành 3–6 cụm từ.\n' +
    'Trả về DUY NHẤT JSON dạng {"qs":[...]}, mỗi phần tử:\n' +
    '{"type":"ngucanh|dich|nghia|dungsai|sapxep","word":"từ được luyện (đúng như trong danh sách)","q":"đề bài","opts":["4 lựa chọn, bỏ trống với sapxep"],"a":"đáp án đúng, giống hệt một phần tử trong opts","parts":["các cụm theo đúng thứ tự, chỉ với sapxep"],"zh":"câu tiếng Trung hoàn chỉnh","py":"pinyin của zh","vi":"nghĩa tiếng Việt của zh","note":"giải thích ngắn bằng tiếng Việt, nói rõ vì sao học viên hay nhầm và cách phân biệt"}\n' +
    'Không dùng dấu | trong nội dung.';
  AI.fn.json(prompt, { modelTier: 'default', cache: false }).then(function (d) {
    AI.busy = false;
    var qs = ((d && d.qs) || []).map(aiToQ).filter(Boolean);
    if (qs.length < 3) return aiFail('AI chưa soạn được bài phù hợp, thử lại nhé.', aiErrQuiz);
    QZ = { qs: qs, i: 0, res: [], ws: ws, mode: 'aierr' };
    renderQ();
  }, function (e) { AI.busy = false; aiFail(aiErr(e), aiErrQuiz); });
}
// Nut "Lam lai" sau bai AI tu loi sai: soan lai bai moi tu loi sai
var errStartQuiz = startQuiz;
startQuiz = function (ws, mode) { if (mode === 'aierr') return aiErrQuiz(); return errStartQuiz(ws, mode); };
