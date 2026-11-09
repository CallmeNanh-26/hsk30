/* Luyen noi: tra loi cau hoi tu de den kho bang cach go hoac ghi am (chuyen giong noi thanh chu),
   AI cham, chi ra loi, sua cau va goi y cach tra loi tu nhien hon. Loi sai ghi vao So tay loi sai. */
'use strict';

var NOI = null;
var NOI_LV = [
  { ten: 'Dễ', mo: 'Câu hỏi ngắn, trả lời 1 câu đơn giản.', ai: 'câu hỏi đơn giản một ý về công việc hằng ngày, học viên chỉ cần trả lời 1 câu ngắn (khoảng 5–10 chữ)' },
  { ten: 'Vừa', mo: 'Câu hỏi tình huống, trả lời 1–2 câu hoàn chỉnh.', ai: 'câu hỏi tình huống cụ thể ở xưởng/kho/văn phòng, học viên phải trả lời 1–2 câu hoàn chỉnh có dùng từ cần luyện' },
  { ten: 'Khó', mo: 'Câu hỏi mở: giải thích, trình bày, đề xuất (3–4 câu).', ai: 'câu hỏi mở yêu cầu giải thích nguyên nhân, trình bày các bước, so sánh hoặc đưa ra đề xuất; học viên phải trả lời 3–4 câu, nên dùng các cặp liên từ như 因为…所以, 如果…就, 先…然后…最后, 虽然…但是' }
];

// ---------- Chon cap do ----------
function noiCardHtml() {
  var h = '<div class="card noi-card"><b>🎤 Luyện nói</b>';
  if (!knownWords().length) return h + '<div class="small muted" style="margin-top:4px">Đánh dấu vài từ đã học (hoặc vào một bài Chuyên đề) để luyện nói với các từ đó.</div></div>';
  return h + '<div class="small muted" style="margin:4px 0 10px">Trả lời câu hỏi bằng cách gõ hoặc ghi âm. ' + (aiReady() ? 'AI chấm, sửa lỗi và gợi ý cách nói hay hơn.' : 'Cần AI (Cài đặt → Khóa AI) để được chấm và cho cấp Vừa/Khó.') + '</div>' +
    '<div class="noi-lv">' + NOI_LV.map(function (l, i) { return '<button class="btn block' + (i === 0 ? ' primary' : '') + '" data-noilv="' + i + '"><b>' + l.ten + '</b><span class="small">' + l.mo + '</span></button>'; }).join('') + '</div></div>';
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-noilv]'); if (!b) return;
  var ws = b.dataset.noiws ? b.dataset.noiws.split(' ') : aiWords(12).map(function (o) { return o.w; });
  noiStart(+b.dataset.noilv, ws);
});
var noiReview = VIEWS.review;
VIEWS.review = function () {
  noiReview();
  if (R.cur) return;
  var ai = $('view-review').querySelector('.ai-card');
  if (ai) ai.insertAdjacentHTML('beforebegin', noiCardHtml()); else $('view-review').insertAdjacentHTML('beforeend', noiCardHtml());
};
// Nut luyen noi trong tung bai Chuyen de (dung tu cua bai)
var noiCd = VIEWS.chuyende;
VIEWS.chuyende = function () {
  noiCd();
  var q = $('cdQuiz'); if (!q) return;
  q.insertAdjacentHTML('afterend', '<button class="btn" id="cdNoi">🎤 Luyện nói</button>');
  $('cdNoi').onclick = function () {
    var ws = [].map.call($('view-chuyende').querySelectorAll('.item[data-w]'), function (x) { return x.dataset.w; }).filter(function (w) { return BYW[w]; });
    openSheet('<h3 style="margin-top:4px">🎤 Luyện nói với từ của bài</h3><div class="small muted" style="margin-bottom:10px">Chọn cấp độ câu hỏi.</div><div class="noi-lv">' +
      NOI_LV.map(function (l, i) { return '<button class="btn block" data-noilv="' + i + '" data-noiws="' + esc(ws.join(' ')) + '"><b>' + l.ten + '</b><span class="small">' + l.mo + '</span></button>'; }).join('') + '</div>');
  };
};

// ---------- Lay cau hoi ----------
function noiStart(lv, ws) {
  if (AI.busy) return;
  ws = shuffle(ws.filter(function (w) { return BYW[w]; }));
  // Cap De: dung cau hoi co san trong du lieu tu; thieu thi nho AI
  if (lv === 0) {
    var qs = ws.filter(function (w) { return BYW[w].qa; }).slice(0, 5).map(function (w) {
      var o = BYW[w]; return { w: w, q: o.qa.q, py: '', vi: o.qa.qvi, goiy: 'Dùng từ ' + w + ' (' + meaning(o) + ').', mau: o.qa.a, maupy: '', mauvi: '' };
    });
    if (qs.length >= 3 || !aiReady()) {
      if (!qs.length) return toast('Các từ này chưa có câu hỏi mẫu. Hãy thêm khóa AI để AI soạn câu hỏi.');
      return noiBegin(lv, qs, ws);
    }
  }
  if (!aiReady()) {
    return openSheet('<h3 style="margin-top:4px">🎤 Luyện nói – cấp ' + NOI_LV[lv].ten + '</h3><div class="small" style="margin:6px 0 12px">Cấp này cần AI để soạn câu hỏi và chấm bài.</div>' +
      (window.claude ? '<a class="btn block primary" href="' + APP_URL + '" target="_blank" rel="noopener">Mở link GitHub để dùng AI ↗</a>' : '<button class="btn block primary" id="noiKey">🔑 Hướng dẫn lấy khóa AI miễn phí</button>'));
  }
  var os = ws.slice(0, 6).map(function (w) { return BYW[w]; });
  AI.busy = true; aiLoading('AI đang soạn câu hỏi luyện nói…');
  var prompt = 'Bạn là giáo viên tiếng Trung luyện nói cho học viên người Việt. ' + CONTEXT + '\nTrình độ: khoảng ' + lvHint(os) + ' (câu hỏi có thể khó hơn một chút).\n' +
    'Các từ cần luyện:\n' + wordList(os) + '\n\n' +
    'Hãy soạn đúng 5 câu hỏi bằng tiếng Trung, mỗi câu gắn với một từ trong danh sách. Cấp độ: ' + NOI_LV[lv].ai + '. Câu hỏi phải tự nhiên, đúng ngữ pháp, giống câu người Trung Quốc thật sự hỏi trong công việc.\n' +
    'Trả về DUY NHẤT JSON {"qs":[{"word":"từ được luyện","q":"câu hỏi tiếng Trung","py":"pinyin câu hỏi","vi":"nghĩa tiếng Việt","goiy":"gợi ý ngắn bằng tiếng Việt nên trả lời ý gì","mau":"một câu trả lời mẫu tiếng Trung đúng cấp độ","maupy":"pinyin câu mẫu","mauvi":"nghĩa câu mẫu"}]}. Không dùng dấu | trong nội dung.';
  AI.fn.json(prompt, { modelTier: 'default', cache: false }).then(function (d) {
    AI.busy = false;
    var qs = ((d && d.qs) || []).filter(function (x) { return x && x.q; }).map(function (x) {
      return { w: BYW[x.word] ? x.word : '', q: String(x.q), py: x.py || '', vi: x.vi || '', goiy: x.goiy || '', mau: x.mau || '', maupy: x.maupy || '', mauvi: x.mauvi || '' };
    });
    if (qs.length < 2) return aiFail('AI chưa soạn được câu hỏi, thử lại nhé.', function () { noiStart(lv, ws); });
    noiBegin(lv, qs, ws);
  }, function (e) { AI.busy = false; aiFail(aiErr(e), function () { noiStart(lv, ws); }); });
}
document.addEventListener('click', function (e) { if (e.target.closest('#noiKey')) keyGuide(); });
function noiBegin(lv, qs, ws) { NOI = { lv: lv, qs: qs, ws: ws, i: 0, res: [], showPy: false }; noiRender(); }

// ---------- Man hinh tra loi ----------
function noiRender(prev) {
  var q = NOI.qs[NOI.i];
  var dots = '<div class="dots">' + NOI.qs.map(function (_, k) { var r = NOI.res[k]; return '<span class="' + (k === NOI.i ? 'cur' : r == null ? '' : r >= 7 ? 'ok' : 'no') + '"></span>'; }).join('') + '</div>';
  var h = dots + '<div class="q-title">🎤 Câu ' + (NOI.i + 1) + '/' + NOI.qs.length + ' · Cấp ' + NOI_LV[NOI.lv].ten + '</div>' +
    '<div class="q-prompt noi-q"><span class="zh">' + esc(q.q) + '</span> <button class="mini-speak" data-say="' + esc(q.q) + '">🔊</button> <button class="mini-speak" data-say="' + esc(q.q) + '" data-slow="1">🐢</button>' +
    (q.py ? '<div class="py noi-py"' + (NOI.showPy ? '' : ' hidden') + '>' + esc(q.py) + '</div>' : '') +
    '<div class="small muted noi-vi" hidden>' + esc(q.vi) + '</div></div>' +
    '<div class="row small" style="margin-bottom:8px">' + (q.py ? '<button class="btn ghost" id="noiPy">Pinyin</button>' : '') + '<button class="btn ghost" id="noiVi">Nghĩa</button>' + (q.goiy ? '<button class="btn ghost" id="noiHint">💡 Gợi ý</button>' : '') + '</div>' +
    '<div class="small noi-hint" hidden>💡 ' + esc(q.goiy) + '</div>' +
    '<textarea id="noiIn" class="note" placeholder="Gõ câu trả lời bằng tiếng Trung, hoặc bấm 🎤 để nói…">' + esc(prev || '') + '</textarea>' +
    '<div class="row" style="margin-top:8px"><button class="btn rec" id="noiRec">🎤 Ghi âm</button><button class="btn primary grow" id="noiGo">' + (aiReady() ? 'Chấm bài' : 'Xem câu mẫu') + '</button></div>' +
    '<div class="small muted" id="noiRecMsg" style="margin-top:4px"></div><div id="noiOut"></div>';
  openSheet(h);
  setTimeout(function () { speak(q.q); }, 250);
  if ($('noiPy')) $('noiPy').onclick = function () { NOI.showPy = !NOI.showPy; $('sheet').querySelector('.noi-py').hidden = !NOI.showPy; };
  $('noiVi').onclick = function () { var v = $('sheet').querySelector('.noi-vi'); v.hidden = !v.hidden; };
  if ($('noiHint')) $('noiHint').onclick = function () { var v = $('sheet').querySelector('.noi-hint'); v.hidden = !v.hidden; };
  $('noiRec').onclick = noiRecToggle;
  $('noiGo').onclick = function () {
    noiRecStop();
    var v = $('noiIn').value.trim();
    if (!aiReady()) return noiShowSample(v);
    if (!v) return toast('Hãy gõ hoặc nói câu trả lời trước.');
    noiCheck(q, v);
  };
}

// ---------- Ghi am -> chu (nhan dang giong noi cua trinh duyet) ----------
var noiSR = null, noiRecOn = false;
function noiRecToggle() { if (noiRecOn) return noiRecStop(); noiRecStart(); }
function noiRecStart() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    $('noiRecMsg').innerHTML = 'Trình duyệt này chưa ghi âm thành chữ được. Hãy dùng <b>Chrome</b>, hoặc bấm biểu tượng 🎤 trên <b>bàn phím điện thoại</b> (chọn bàn phím tiếng Trung) để nói vào ô trả lời.';
    return;
  }
  var box = $('noiIn'), base = box.value ? box.value.replace(/\s+$/, '') + ' ' : '';
  noiSR = new SR(); noiSR.lang = 'zh-CN'; noiSR.interimResults = true; noiSR.continuous = true;
  noiSR.onresult = function (ev) {
    var t = ''; for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
    if ($('noiIn')) $('noiIn').value = base + t;
  };
  noiSR.onerror = function (ev) {
    var m = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? 'Trình duyệt chưa cho dùng micro. Bấm biểu tượng 🔒 cạnh địa chỉ trang → cho phép Micro, rồi thử lại.' :
      ev.error === 'no-speech' ? 'Chưa nghe thấy tiếng nói, thử nói to và gần micro hơn.' : ev.error === 'network' ? 'Nhận dạng giọng nói cần mạng internet.' : 'Không ghi âm được (' + ev.error + ').';
    if ($('noiRecMsg')) $('noiRecMsg').textContent = m;
  };
  noiSR.onend = function () { noiRecOn = false; if ($('noiRec')) { $('noiRec').classList.remove('on'); $('noiRec').textContent = '🎤 Ghi âm'; } };
  try { noiSR.start(); } catch (e) { return; }
  noiRecOn = true; $('noiRec').classList.add('on'); $('noiRec').textContent = '⏹ Dừng'; $('noiRecMsg').textContent = 'Đang nghe… nói tiếng Trung rồi bấm Dừng.';
}
function noiRecStop() { if (noiSR && noiRecOn) { try { noiSR.stop(); } catch (e) { } } }
var noiClose = closeSheet;
closeSheet = function () { noiRecStop(); noiClose(); };

// ---------- AI cham ----------
function noiCheck(q, ans) {
  if (AI.busy) return;
  AI.busy = true; AI.note = ''; $('noiGo').disabled = true; $('noiOut').innerHTML = '<div class="small muted" style="margin-top:10px" id="aiStat">✨ AI đang chấm…</div>';
  var o = BYW[q.w];
  var prompt = 'Bạn là giáo viên tiếng Trung chấm bài luyện nói của học viên người Việt. ' + CONTEXT + '\n' +
    'Cấp độ câu hỏi: ' + NOI_LV[NOI.lv].ten + ' – ' + NOI_LV[NOI.lv].ai + '.\nCâu hỏi: ' + q.q + (q.vi ? ' (' + q.vi + ')' : '') + '\n' +
    (o ? 'Từ cần luyện: ' + o.w + ' (' + o.py + '): ' + meaning(o) + '\n' : '') +
    'Câu trả lời của học viên: ' + ans + '\n\n' +
    'Lưu ý: câu trả lời có thể được chuyển từ giọng nói sang chữ nên có thể sai chữ đồng âm; nếu lỗi chỉ do chữ đồng âm thì nhắc nhẹ trong nhận xét, không trừ nhiều điểm. Nếu học viên trả lời bằng tiếng Việt hoặc pinyin, hãy chỉ cách nói bằng tiếng Trung.\n' +
    'Chấm theo: trả lời đúng ý câu hỏi, đúng ngữ pháp, dùng từ đúng và tự nhiên, độ đầy đủ so với cấp độ.\n' +
    'Trả về DUY NHẤT JSON: {"diem":0-10,"dungy":true/false,"nhanxet":"nhận xét ngắn, động viên, bằng tiếng Việt","loi":[{"sai":"phần sai trong câu học viên","dung":"cách sửa","giaithich":"giải thích ngắn bằng tiếng Việt"}],"sua":{"zh":"câu trả lời của học viên sau khi sửa, giữ ý của học viên","py":"pinyin","vi":"nghĩa"},"goiy":[{"zh":"cách trả lời tự nhiên hoặc hay hơn, đúng trình độ","py":"pinyin","vi":"nghĩa"}]}\n' +
    'loi để mảng rỗng nếu không có lỗi. goiy gồm 1–2 câu.';
  AI.fn.json(prompt, { modelTier: 'default' }).then(function (d) {
    AI.busy = false; if (!$('noiOut')) return; $('noiGo').disabled = false;
    var sc = Math.max(0, Math.min(10, Math.round(+d.diem || 0))), loi = (d.loi || []).filter(function (x) { return x && x.dung; });
    NOI.res[NOI.i] = sc;
    var sua = d.sua && d.sua.zh ? d.sua : null;
    if (q.w && (sc < 7 || loi.length)) errAdd(q.w, { t: 'Luyện nói', p: q.q, g: ans, a: sua ? sua.zh : (q.mau || ''), fix: 1, why: loi.length ? loi[0].giaithich || '' : d.nhanxet || '' });
    else if (q.w && sc >= 8) errRight(q.w);
    $('noiOut').innerHTML = '<div class="feedback ' + (sc >= 7 ? 'good' : 'bad') + '" style="margin-top:10px"><span class="noi-score">' + sc + '/10</span> ' + esc(d.nhanxet || '') + '</div>' +
      (loi.length ? '<div class="card" style="margin-top:8px"><b class="small">Lỗi cần sửa</b>' + loi.map(function (x) {
        return '<div class="err-row small"><span class="zh">❌ ' + esc(x.sai || '') + '</span> → <span class="zh">✅ ' + esc(x.dung) + '</span>' + (x.giaithich ? '<div class="muted">' + esc(x.giaithich) + '</div>' : '') + '</div>';
      }).join('') + '</div>' : '') +
      (sua && sua.zh !== ans ? '<div class="card" style="margin-top:8px"><b class="small">Câu của bạn sau khi sửa</b>' + exHtml({ zh: sua.zh, py: sua.py || '', vi: sua.vi || '' }) + '</div>' : '') +
      ((d.goiy || []).length ? '<div class="card" style="margin-top:8px"><b class="small">💡 Cách trả lời hay hơn</b>' + d.goiy.filter(function (g) { return g && g.zh; }).map(function (g) { return exHtml({ zh: g.zh, py: g.py || '', vi: g.vi || '' }); }).join('') + '</div>' : '') +
      noiNavHtml();
    noiBindNav(ans);
  }, function (e) {
    AI.busy = false; if (!$('noiOut')) return; $('noiGo').disabled = false;
    // AI loi: van cho xem cau mau va di tiep, khong bi ket o cau nay
    $('noiOut').innerHTML = '<div class="feedback bad" style="margin-top:10px">' + esc(aiErr(e)) + '<div style="margin-top:8px"><button class="btn primary" id="noiRetry">↻ Thử chấm lại</button></div></div>' +
      (q.mau ? '<div class="card" style="margin-top:8px"><b class="small">Trong lúc chờ, tham khảo câu trả lời mẫu</b>' + exHtml({ zh: q.mau, py: q.maupy || '', vi: q.mauvi || '' }) + '</div>' : '') + noiNavHtml();
    $('noiRetry').onclick = function () { noiCheck(q, ans); };
    noiBindNav(ans);
  });
}
function noiShowSample(ans) {
  var q = NOI.qs[NOI.i];
  $('noiOut').innerHTML = '<div class="card" style="margin-top:10px"><b class="small">Câu trả lời mẫu</b>' + exHtml({ zh: q.mau, py: q.maupy, vi: q.mauvi }) +
    '<div class="small muted">So sánh với câu của bạn. Thêm khóa AI (Cài đặt → Khóa AI) để được chấm và sửa lỗi.</div></div>' + noiNavHtml();
  noiBindNav(ans);
}
function noiNavHtml() {
  var last = NOI.i >= NOI.qs.length - 1;
  return '<div class="row" style="margin-top:10px"><button class="btn grow" id="noiAgain">↺ Trả lời lại</button><button class="btn primary grow" id="noiNext">' + (last ? 'Xem kết quả' : 'Câu tiếp →') + '</button></div>';
}
function noiBindNav(ans) {
  $('noiAgain').onclick = function () { noiRender(ans); };
  $('noiNext').onclick = function () { NOI.i++; if (NOI.i < NOI.qs.length) noiRender(); else noiDone(); };
}
function noiDone() {
  var got = NOI.res.filter(function (x) { return x != null; }), avg = got.length ? Math.round(got.reduce(function (a, b) { return a + b; }, 0) / got.length * 10) / 10 : null;
  openSheet('<div class="word-head"><div style="font-size:48px">' + (avg == null ? '🎤' : avg >= 8 ? '🎉' : avg >= 6 ? '👍' : '💪') + '</div><div class="big-msg">' + (avg == null ? 'Hoàn thành ' + NOI.qs.length + ' câu' : 'Điểm trung bình <b>' + avg + '/10</b>') + '</div>' +
    (got.some(function (x) { return x < 7; }) ? '<div class="small muted">Các câu chưa tốt đã được ghi vào Sổ tay lỗi sai.</div>' : '') + '</div>' +
    '<div style="display:grid;gap:8px;margin-top:12px">' + NOI_LV.map(function (l, i) { return '<button class="btn block' + (i === NOI.lv ? ' primary' : '') + '" data-noilv="' + i + '" data-noiws="' + esc(NOI.ws.join(' ')) + '">Luyện tiếp cấp ' + l.ten + '</button>'; }).join('') + '<button class="btn block ghost" data-close>Đóng</button></div>');
}
