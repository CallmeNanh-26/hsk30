/* Luyen tap voi AI (chi co khi mo bang link Claude): bai tap moi, hoi thoai, cham cau tu viet */
'use strict';

var AI = { fn: null, off: false, busy: false, chat: null };
function initAI() {
  if (!window.claude || typeof claude.use !== 'function') return;
  claude.use('sample').then(function (f) {
    AI.fn = f || null;
    if (AI.fn && document.querySelector('#view-review.active') && !R.cur) VIEWS.review();
  }).catch(function () { });
}
function aiReady() { return !!AI.fn && !AI.off; }
function aiErr(e) {
  var c = e && e.code;
  if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') {
    AI.off = true; if (document.querySelector('#view-review.active')) VIEWS.review();
    return 'Bạn chưa cho phép trang dùng Claude nên phần AI tạm ẩn. Mở lại trang để bật.';
  }
  if (c === 'rate_limited') return 'Đã dùng hết lượt Claude tạm thời. Hãy thử lại sau ít phút.';
  if (c === 'session_expired') return 'Phiên đăng nhập Claude đã hết, hãy đăng nhập lại.';
  if (c === 'refused') return 'AI không trả lời được nội dung này, hãy thử cách khác.';
  if (c === 'invalid_json') return 'AI trả lời sai định dạng, bấm thử lại nhé.';
  return 'Chưa kết nối được AI, bấm thử lại.';
}
// Tu de luyen: uu tien tu den han, roi tu moi hoc gan day
function aiWords(n) {
  var ks = knownWords();
  var due = shuffle(ks.filter(function (o) { return isDue(o.w); })), rest = shuffle(ks.filter(function (o) { return !isDue(o.w); }));
  return due.concat(rest).slice(0, n);
}
function wordList(ws) { return ws.map(function (o) { return o.w + ' (' + o.py + '): ' + meaning(o); }).join('\n'); }
function lvHint(ws) {
  var l = ws.map(function (o) { return typeof o.lv === 'number' ? o.lv : 0; }).filter(Boolean).sort();
  return l.length ? 'HSK ' + l[Math.floor(l.length / 2)] : 'HSK 2';
}
var CONTEXT = 'Người học là công nhân/nhân viên người Việt làm trong nhà máy và công ty thương mại của Trung Quốc. Ưu tiên tình huống ở xưởng, kho, giao hàng, gặp khách hàng.';

// ---------- The tren tab On tap ----------
var CLAUDE_URL = 'https://claude.ai/artifact/KRoXbf4SFPgmp4vqdJLBau';
function aiCardHtml() {
  if (!knownWords().length) return '';
  if (!window.claude) return '<div class="card small"><b>✨ Luyện với AI</b><div class="muted" style="margin-top:4px">Bài tập AI, luyện hội thoại và chấm câu chỉ có khi mở app bằng link Claude (cần tài khoản claude.ai). Tiến độ ở đây không tự chuyển sang, hãy dùng mã sao lưu ở Cài đặt.</div>' +
    '<a class="btn" style="margin-top:8px" href="' + CLAUDE_URL + '" target="_blank" rel="noopener">Mở link Claude</a></div>';
  if (!aiReady()) return '';
  return '<div class="card ai-card"><b>✨ Luyện với AI</b><div class="small muted" style="margin:4px 0 10px">AI tạo bài mới mỗi lần từ chính các từ bạn đã học (ưu tiên từ đến hạn ôn). Dùng lượt Claude của tài khoản bạn.</div>' +
    '<div style="display:grid;gap:8px"><button class="btn block primary" id="aiQuiz">✨ Bài tập AI (8 câu mới)</button>' +
    '<button class="btn block" id="aiChat">💬 Luyện hội thoại tiếng Trung</button>' +
    '<button class="btn block" id="aiWrite">✍️ Tự đặt câu – AI chấm</button></div></div>';
}
function bindAiCard() {
  if (!$('aiQuiz')) return;
  $('aiQuiz').onclick = aiQuiz;
  $('aiChat').onclick = function () { chatSetup(); };
  $('aiWrite').onclick = function () { writeSetup(); };
}
function aiLoading(msg) { openSheet('<div class="word-head"><div class="ai-spin">✨</div><div class="big-msg">' + esc(msg) + '</div><div class="small muted">Thường mất 10–30 giây.</div></div>'); }
function aiFail(msg, retry) {
  openSheet('<div class="big-msg" style="margin:8px 0 14px">' + esc(msg) + '</div><div class="row">' + (retry ? '<button class="btn primary grow" id="aiRetry">Thử lại</button>' : '') + '<button class="btn grow" data-close>Đóng</button></div>');
  if (retry && $('aiRetry')) $('aiRetry').onclick = retry;
}

// ---------- 1. Bai tap AI ----------
function aiQuiz() {
  if (AI.busy) return;
  var ws = aiWords(8); if (!ws.length) return;
  AI.busy = true; aiLoading('AI đang soạn bài tập cho bạn…');
  var prompt = 'Bạn là giáo viên tiếng Trung. ' + CONTEXT + '\nTrình độ: khoảng ' + lvHint(ws) + '. Chỉ dùng từ vựng đơn giản quanh trình độ này.\n' +
    'Danh sách từ người học vừa học:\n' + wordList(ws) + '\n\n' +
    'Hãy soạn đúng 8 câu hỏi, mỗi câu dùng 1 từ trong danh sách (dùng mỗi từ ít nhất một lần nếu được), đa dạng các dạng sau:\n' +
    '- "ngucanh": câu tiếng Trung có chỗ trống ＿＿, chọn từ đúng trong 4 từ.\n' +
    '- "dich": cho câu tiếng Việt, chọn câu tiếng Trung dịch đúng trong 4 câu.\n' +
    '- "nghia": cho câu tiếng Trung, chọn nghĩa tiếng Việt đúng trong 4 câu.\n' +
    '- "dungsai": cho 4 câu tiếng Trung dùng cùng một từ, chọn câu dùng từ ĐÚNG.\n' +
    '- "sapxep": cho câu tiếng Trung ngắn (6–12 chữ) đã chia thành 3–6 cụm từ.\n' +
    'Trả về DUY NHẤT JSON dạng {"qs":[...]}, mỗi phần tử:\n' +
    '{"type":"ngucanh|dich|nghia|dungsai|sapxep","word":"từ được luyện","q":"đề bài (câu tiếng Trung hoặc tiếng Việt)","opts":["4 lựa chọn, bỏ trống với sapxep"],"a":"đáp án đúng, giống hệt một phần tử trong opts","parts":["các cụm theo đúng thứ tự, chỉ với sapxep"],"zh":"câu tiếng Trung hoàn chỉnh","py":"pinyin của zh","vi":"nghĩa tiếng Việt của zh","note":"giải thích ngắn bằng tiếng Việt vì sao đúng"}\n' +
    'Đáp án sai phải hợp lý nhưng sai rõ ràng. Không dùng dấu | trong nội dung.';
  AI.fn.json(prompt, { modelTier: 'default', cache: false }).then(function (d) {
    AI.busy = false;
    var qs = ((d && d.qs) || []).map(aiToQ).filter(Boolean);
    if (qs.length < 3) return aiFail('AI chưa soạn được bài phù hợp, thử lại nhé.', aiQuiz);
    QZ = { qs: qs, i: 0, res: [], ws: ws.map(function (o) { return o.w; }), mode: 'ai' };
    renderQ();
  }, function (e) { AI.busy = false; aiFail(aiErr(e), aiQuiz); });
}
var AI_TITLES = { ngucanh: 'Chọn từ đúng ngữ cảnh', dich: 'Chọn câu dịch đúng', nghia: 'Chọn nghĩa đúng', dungsai: 'Chọn câu dùng từ đúng', sapxep: 'Sắp xếp thành câu đúng' };
function aiToQ(x) {
  if (!x || !AI_TITLES[x.type]) return null;
  var note = (x.note || '') + (x.zh ? '\n' + x.zh + (x.py ? ' – ' + x.py : '') + (x.vi ? ' – ' + x.vi : '') : '');
  if (x.type === 'sapxep') {
    var parts = (x.parts || []).map(String).filter(Boolean);
    if (parts.length < 2) return null;
    var tiles = shuffle(parts); if (tiles.join('') === parts.join('')) tiles = parts.slice().reverse();
    return { t: AI_TITLES.sapxep, p: x.vi ? esc(x.vi) : '', tiles: tiles, a: parts.join(''), note: x.note || '', after: parts.join(''), ai: 1 };
  }
  var opts = (x.opts || []).map(String);
  if (opts.length < 2 || opts.indexOf(String(x.a)) < 0) return null;
  var zhQ = x.type !== 'dich';
  return {
    t: AI_TITLES[x.type], ai: 1, note: note,
    p: zhQ ? '<span class="zh">' + esc(x.q) + '</span>' + (x.type !== 'dungsai' ? ' <button class="mini-speak" data-say="' + esc(String(x.q).replace(/＿＿/g, '')) + '">🔊</button>' : '') : esc(x.q),
    opts: shuffle(opts), a: String(x.a), zh: x.type !== 'nghia' ? 1 : 0
  };
}

// ---------- 2. Hoi thoai ----------
var ROLES = [
  ['Tổ trưởng', 'tổ trưởng ở xưởng sản xuất, giao việc và hỏi về tiến độ, an toàn'],
  ['Khách hàng', 'khách hàng Trung Quốc hỏi về giá, mẫu, thời gian giao hàng'],
  ['Đồng nghiệp', 'đồng nghiệp người Trung Quốc nói chuyện trong giờ nghỉ và công việc hằng ngày'],
  ['Nhân viên kho', 'nhân viên kho hỏi về nhập xuất hàng, kiểm đếm, đóng gói']
];
function chatSetup() {
  openSheet('<h3 style="margin-top:4px">💬 Luyện hội thoại</h3><div class="small muted" style="margin-bottom:10px">Chọn người AI sẽ đóng vai. AI nói câu ngắn có pinyin và dịch, dùng các từ bạn đã học và sửa lỗi cho bạn.</div>' +
    '<div style="display:grid;gap:8px">' + ROLES.map(function (r, i) { return '<button class="btn block" data-role="' + i + '">' + esc(r[0]) + '<span class="small muted"> – ' + esc(r[1]) + '</span></button>'; }).join('') + '</div>');
  $('sheet').querySelectorAll('[data-role]').forEach(function (b) { b.onclick = function () { chatStart(+b.dataset.role); }; });
}
function chatIntro(role, ws) {
  return 'Hãy đóng vai ' + role[1] + ' và luyện hội thoại tiếng Trung với tôi. ' + CONTEXT + '\nTrình độ của tôi: khoảng ' + lvHint(ws) + '. Hãy dùng câu ngắn, đơn giản, và cố gắng dùng các từ tôi vừa học:\n' + wordList(ws) + '\n\n' +
    'Quy tắc mỗi lượt trả lời của bạn:\n1. Nếu câu tôi vừa viết có lỗi (từ, ngữ pháp, chữ), dòng đầu ghi "✏️ Sửa: <câu đúng> – <giải thích ngắn bằng tiếng Việt>". Nếu đúng thì ghi "✅ Tốt!".\n' +
    '2. Sau đó là câu nói của nhân vật bằng tiếng Trung (1–2 câu), dòng tiếp theo là pinyin, dòng tiếp theo là "🇻🇳 " + bản dịch tiếng Việt.\n3. Kết thúc bằng một câu hỏi để tôi trả lời tiếp. Không viết dài hơn thế.\n' +
    'Tôi có thể trả lời bằng tiếng Trung, pinyin hoặc tiếng Việt khi bí; nếu tôi dùng tiếng Việt, hãy gợi ý cách nói bằng tiếng Trung.\nBây giờ hãy mở đầu cuộc hội thoại (lượt đầu không cần mục 1).';
}
function chatStart(ri) {
  var ws = aiWords(10);
  AI.chat = { role: ROLES[ri], turns: [{ role: 'user', content: chatIntro(ROLES[ri], ws) }], view: [] };
  chatRender(); chatSend(null);
}
function chatRender() {
  var c = AI.chat;
  openSheet('<h3 style="margin-top:4px">💬 ' + esc(c.role[0]) + '</h3><div class="chat" id="chatLog">' + c.view.map(chatBubble).join('') + '</div>' +
    '<div class="row chat-in"><input id="chatIn" class="grow" placeholder="Trả lời bằng tiếng Trung (hoặc tiếng Việt nếu bí)…" autocomplete="off"><button class="btn primary" id="chatGo">Gửi</button></div>');
  var lg = $('chatLog'); lg.scrollTop = lg.scrollHeight;
  $('chatGo').onclick = function () { var v = $('chatIn').value.trim(); if (v) chatSend(v); };
  $('chatIn').onkeydown = function (e) { if (e.key === 'Enter' && !e.isComposing) { var v = this.value.trim(); if (v) chatSend(v); } };
}
function chatBubble(m) {
  var body = esc(m.text).replace(/\n/g, '<br>');
  var say = m.me ? '' : (m.text.split('\n').filter(function (l) { return /[㐀-鿿]/.test(l) && l.indexOf('✏️') < 0 && l.indexOf('✅') < 0; })[0] || '');
  return '<div class="msg ' + (m.me ? 'me' : 'bot') + '">' + body + (say ? ' <button class="mini-speak" data-say="' + esc(say) + '">🔊</button>' : '') + '</div>';
}
function chatSend(text) {
  var c = AI.chat; if (AI.busy || !c) return;
  if (text) { c.turns.push({ role: 'user', content: text }); c.view.push({ me: true, text: text }); }
  var bot = { me: false, text: '…' }; c.view.push(bot);
  AI.busy = true; chatRender();
  // Giu loi mo dau + 12 luot gan nhat de cuoc tro chuyen khong qua dai
  var turns = c.turns.length > 13 ? [c.turns[0]].concat(c.turns.slice(-12)) : c.turns;
  if (turns[1] && turns[1].role !== 'assistant') turns = [c.turns[0]].concat(c.turns.slice(-11));
  AI.fn(turns, {
    modelTier: 'default', cache: false,
    onText: function (p) { bot.text = p.text; var lg = $('chatLog'); if (lg && lg.lastChild) { lg.lastChild.innerHTML = esc(p.text).replace(/\n/g, '<br>'); lg.scrollTop = lg.scrollHeight; } }
  }).then(function (r) {
    AI.busy = false; bot.text = r.text; c.turns.push({ role: 'assistant', content: r.text });
    if (AI.chat === c && $('chatLog')) { chatRender(); $('chatIn').focus(); }
  }, function (e) {
    AI.busy = false; c.view.pop();
    if (text) { c.turns.pop(); c.view.pop(); }
    if (AI.chat === c && $('chatLog')) { chatRender(); if (text) $('chatIn').value = text; }
    toast(aiErr(e));
  });
}

// ---------- 3. Tu dat cau, AI cham ----------
function writeSetup(w) {
  var ws = aiWords(30), o = w ? BYW[w] : ws[0]; if (!o) return;
  openSheet('<h3 style="margin-top:4px">✍️ Tự đặt câu</h3><div class="small muted">Đặt một câu tiếng Trung có dùng từ dưới đây. AI sẽ chấm, sửa và gợi ý cách nói tự nhiên hơn.</div>' +
    '<div class="word-head"><div class="hz">' + esc(o.w) + '</div><div class="py">' + esc(o.py) + '</div><div class="mean">' + esc(meaning(o)) + '</div></div>' +
    '<textarea id="wrIn" class="note" placeholder="Viết câu của bạn ở đây…"></textarea>' +
    '<div class="row" style="margin-top:8px"><button class="btn primary grow" id="wrGo">Chấm câu</button><button class="btn" id="wrNext">Đổi từ khác</button></div><div id="wrOut"></div>');
  $('wrNext').onclick = function () { var n = ws.filter(function (x) { return x !== o; }); writeSetup(n.length ? shuffle(n)[0].w : o.w); };
  $('wrGo').onclick = function () { var v = $('wrIn').value.trim(); if (v) writeCheck(o, v); };
}
function writeCheck(o, sent) {
  if (AI.busy) return;
  AI.busy = true; $('wrGo').disabled = true; $('wrOut').innerHTML = '<div class="small muted" style="margin-top:10px">✨ AI đang chấm…</div>';
  var prompt = 'Bạn là giáo viên tiếng Trung, chấm câu của học viên người Việt. ' + CONTEXT + '\nTừ cần dùng: ' + o.w + ' (' + o.py + '): ' + meaning(o) + '\nCâu học viên viết: ' + sent + '\n\n' +
    'Trả về DUY NHẤT JSON: {"diem":1-5,"dungtu":true/false (có dùng đúng từ cần dùng không),"nhanxet":"nhận xét ngắn bằng tiếng Việt, chỉ ra lỗi nếu có","sua":"câu đã sửa đúng (giống câu gốc nếu không có lỗi)","py":"pinyin của câu đã sửa","vi":"nghĩa tiếng Việt","goiy":"một câu khác tự nhiên hơn dùng từ này, kèm pinyin và nghĩa trong ngoặc"}';
  AI.fn.json(prompt, { modelTier: 'default' }).then(function (d) {
    AI.busy = false; if (!$('wrOut')) return; $('wrGo').disabled = false;
    var sc = Math.max(1, Math.min(5, +d.diem || 1));
    $('wrOut').innerHTML = '<div class="feedback ' + (sc >= 4 ? 'good' : 'bad') + '" style="margin-top:10px"><b>' + '★★★★★'.slice(0, sc) + '☆☆☆☆☆'.slice(0, 5 - sc) + '</b> ' + esc(d.nhanxet || '') + '</div>' +
      (d.sua && d.sua !== sent ? '<div class="card" style="margin-top:8px">' + exHtml({ zh: d.sua, py: d.py || '', vi: d.vi || '' }) + '</div>' : '') +
      (d.goiy ? '<div class="small" style="margin-top:6px">💡 Gợi ý: <span class="zh">' + esc(d.goiy) + '</span></div>' : '');
  }, function (e) { AI.busy = false; if (!$('wrOut')) return; $('wrGo').disabled = false; $('wrOut').innerHTML = '<div class="feedback bad" style="margin-top:10px">' + esc(aiErr(e)) + '</div>'; });
}
