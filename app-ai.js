/* Luyen tap voi AI: bai tap moi, hoi thoai, cham cau tu viet.
   Nguon AI: Claude (khi mo link Claude va tai khoan duoc phep) hoac khoa Gemini mien phi cua hoc vien.
   Khong co AI: nut sao chep de de dan sang Claude/ChatGPT/Gemini ben ngoai. */
'use strict';

var AI = { fn: null, off: false, busy: false, chat: null, state: 'wait', via: '' };
var KEY_STORE = 'hsk30.aikey'; // khoa Gemini: chi luu tren may hoc vien, khong nam trong ma sao luu
function getKey() { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } }
function setKey(k) { try { if (k) localStorage.setItem(KEY_STORE, k); else localStorage.removeItem(KEY_STORE); } catch (e) { } }
function initAI() {
  var fallback = function () {
    if (getKey()) { AI.fn = geminiFn; AI.via = 'gemini'; AI.state = 'ok'; } else { AI.fn = null; AI.via = ''; AI.state = 'none'; }
    if (document.querySelector('#view-review.active') && !R.cur) VIEWS.review();
  };
  if (!window.claude || typeof claude.use !== 'function') return fallback();
  claude.use('sample').then(function (f) {
    if (!f) return fallback();
    AI.fn = f; AI.via = 'claude'; AI.state = 'ok';
    if (document.querySelector('#view-review.active') && !R.cur) VIEWS.review();
  }).catch(fallback);
}
function aiReady() { return !!AI.fn && !AI.off; }

// ---------- Gemini (khoa cua hoc vien, goi thang tu trinh duyet) ----------
var GEM = 'https://generativelanguage.googleapis.com/v1beta/';
function gemFetch(path, body) {
  var key = getKey();
  return fetch(GEM + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: body ? JSON.stringify(body) : undefined })
    .catch(function (e) { throw { code: 'upstream_error', message: 'network: ' + (e && e.message || '') }; })
    .then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.ok) return d;
        var msg = 'HTTP ' + r.status + ((d.error && (d.error.status || d.error.message)) ? ' – ' + (d.error.status || '') + ' ' + (d.error.message || '') : '');
        if (r.status === 429) throw { code: 'rate_limited', message: msg };
        if (/API key not valid|API_KEY_INVALID/i.test(msg)) throw { code: 'bad_key', message: msg };
        if (r.status === 400 || r.status === 401 || r.status === 403) throw { code: 'key_refused', message: msg };
        throw { code: 'upstream_error', message: msg };
      });
    });
}
// Chon model "flash" moi nhat ma khoa nay dung duoc (khong doan ten co dinh)
function gemModel() {
  try { var m = localStorage.getItem('hsk30.aimodel'); if (m) return Promise.resolve(m); } catch (e) { }
  return gemFetch('models?pageSize=200').then(function (d) {
    var ms = (d.models || []).filter(function (m) {
      var n = m.name || '';
      return (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0 && /flash/.test(n) && !/(image|tts|audio|live|embed|vision|thinking)/.test(n);
    });
    var ver = function (n) { var x = n.match(/(\d+(?:\.\d+)?)/); return x ? +x[1] : 0; };
    ms.sort(function (a, b) {
      var pa = /(preview|exp)/.test(a.name) ? 1 : 0, pb = /(preview|exp)/.test(b.name) ? 1 : 0;
      var la = /lite/.test(a.name) ? 1 : 0, lb = /lite/.test(b.name) ? 1 : 0;
      return pa - pb || ver(b.name) - ver(a.name) || la - lb;
    });
    if (!ms.length) throw { code: 'bad_key', message: 'no model' };
    var name = ms[0].name.replace(/^models\//, '');
    try { localStorage.setItem('hsk30.aimodel', name); } catch (e) { }
    return name;
  });
}
function gemAsk(input, json) {
  var turns = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  var body = { contents: turns.map(function (t) { return { role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] }; }) };
  if (json) body.generationConfig = { responseMimeType: 'application/json' };
  return gemModel().then(function (m) { return gemFetch('models/' + m + ':generateContent', body); }).then(function (d) {
    var c = d.candidates && d.candidates[0];
    var text = c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text || ''; }).join('') : '';
    if (!text) throw { code: (d.promptFeedback && d.promptFeedback.blockReason) ? 'refused' : 'empty_completion' };
    return text;
  });
}
// Cung cach goi voi Claude: fn(input, {onText}) -> {text}; fn.json(input) -> doi tuong
function geminiFn(input, opts) {
  return gemAsk(input, false).then(function (t) { if (opts && opts.onText) opts.onText({ text: t, delta: t }); return { text: t, truncated: false }; });
}
geminiFn.json = function (input) {
  return gemAsk(input, true).then(function (t) {
    var s = t.replace(/^```(?:json)?\s*|\s*```$/g, '');
    try { return JSON.parse(s); } catch (e) { throw { code: 'invalid_json', text: t }; }
  });
};
function testKey(k, done) {
  setKey(k); try { localStorage.removeItem('hsk30.aimodel'); } catch (e) { }
  gemAsk('Trả lời đúng một từ: OK', false).then(function () { done(true); }, function (e) { done(false, e); });
}

function aiErr(e) {
  var c = e && e.code;
  if (c === 'key_refused') return 'Google từ chối khóa AI (' + ((e.message || '').slice(0, 120)) + '). Vào Cài đặt → Khóa AI để kiểm tra lại.';
  if (c === 'bad_key') return 'Khóa AI không dùng được (sai khóa hoặc đã bị xóa). Vào Cài đặt → Khóa AI để kiểm tra lại.';
  if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') {
    if (getKey()) { AI.fn = geminiFn; AI.via = 'gemini'; } else AI.off = true;
    if (document.querySelector('#view-review.active')) VIEWS.review();
    return getKey() ? 'Claude không cho dùng ở tài khoản này, app đã chuyển sang khóa Gemini của bạn. Bấm lại để thử.' : 'Tài khoản này chưa dùng được Claude. Hãy thêm khóa AI Gemini miễn phí (Cài đặt → Khóa AI).';
  }
  if (c === 'rate_limited') return AI.via === 'gemini' ? 'Khóa Gemini miễn phí đã hết lượt trong phút/ngày này. Đợi 1–2 phút (hoặc sang ngày mai) rồi thử lại.' : 'Đã dùng hết lượt Claude tạm thời. Hãy thử lại sau ít phút.';
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
function copyBlock(open) {
  return '<details class="ai-copy"' + (open ? ' open' : '') + '><summary><b>📋 Sao chép đề sang Claude / ChatGPT / Gemini</b></summary>' +
    '<ol class="small steps-ol"><li>Bấm một nút <b>Sao chép đề</b> bên dưới (app ghi sẵn các từ bạn đang học).</li>' +
    '<li>Bấm mở một trang AI (miễn phí, đăng nhập bằng Google/email).</li>' +
    '<li>Nhấn giữ vào ô chat (điện thoại) hoặc Ctrl+V (máy tính) để <b>dán</b>, rồi bấm gửi.</li>' +
    '<li>Làm bài ngay trong khung chat đó. Xong, quay lại app bấm ✓ / ôn thẻ như bình thường.</li></ol>' +
    '<div style="display:grid;gap:6px"><button class="btn" data-cp="quiz">📋 Sao chép đề: Bài tập 8 câu</button><button class="btn" data-cp="chat">📋 Sao chép đề: Luyện hội thoại</button><button class="btn" data-cp="write">📋 Sao chép đề: Đặt câu và nhờ chấm</button></div>' +
    '<div class="row" style="margin-top:8px"><a class="btn ghost" href="https://claude.ai/new" target="_blank" rel="noopener">Mở Claude</a><a class="btn ghost" href="https://chatgpt.com/" target="_blank" rel="noopener">Mở ChatGPT</a><a class="btn ghost" href="https://gemini.google.com/app" target="_blank" rel="noopener">Mở Gemini</a></div></details>';
}
function aiCardHtml() {
  var head = '<div class="card ai-card"><b>✨ Luyện với AI</b>';
  if (!knownWords().length) return head + '<div class="small muted" style="margin-top:4px">Hãy vào <b>Tra từ</b> và bấm ✓ ở các từ đã học (hoặc khôi phục mã sao lưu ở Cài đặt). AI sẽ soạn bài từ chính các từ đó.</div></div>';
  if (AI.state === 'wait') return head + '<div class="small muted" style="margin-top:4px">Đang kết nối AI…</div></div>';
  if (!aiReady() && window.claude) return head + '<div class="small" style="margin:6px 0 10px">Tài khoản này chưa dùng được AI trong trang Claude. Để AI chạy ngay trong app, hãy mở <b>link GitHub</b> và thêm khóa AI Gemini miễn phí ở đó (tiến độ chuyển bằng mã sao lưu ở Cài đặt).</div>' +
    '<a class="btn block primary" href="' + APP_URL + '" target="_blank" rel="noopener">Mở link GitHub ↗</a><div style="margin-top:10px">' + copyBlock(false) + '</div></div>';
  if (!aiReady()) return head + '<div class="small" style="margin:6px 0 10px">Để AI chạy ngay trong app, hãy thêm <b>khóa AI Gemini miễn phí</b> (làm 1 lần, khoảng 3 phút).</div>' +
    '<button class="btn block primary" id="aiSetKey">🔑 Hướng dẫn lấy khóa AI miễn phí</button><div style="margin-top:10px">' + copyBlock(false) + '</div></div>';
  return head + '<div class="small muted" style="margin:4px 0 10px">AI tạo bài mới mỗi lần từ chính các từ bạn đã học (ưu tiên từ đến hạn ôn). ' +
    (AI.via === 'claude' ? 'Dùng lượt Claude của tài khoản bạn.' : 'Dùng khóa Gemini miễn phí của bạn.') + '</div>' +
    '<div style="display:grid;gap:8px"><button class="btn block primary" id="aiQuiz">✨ Bài tập AI (8 câu mới)</button>' +
    '<button class="btn block" id="aiChat">💬 Luyện hội thoại tiếng Trung</button>' +
    '<button class="btn block" id="aiWrite">✍️ Tự đặt câu – AI chấm</button></div><div style="margin-top:10px">' + copyBlock(false) + '</div></div>';
}
function bindAiCard() {
  if ($('aiSetKey')) $('aiSetKey').onclick = keyGuide;
  if (!$('aiQuiz')) return;
  $('aiQuiz').onclick = aiQuiz;
  $('aiChat').onclick = function () { chatSetup(); };
  $('aiWrite').onclick = function () { writeSetup(); };
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-cp]'); if (!b) return;
  var ws = aiWords(10); if (!ws.length) return toast('Hãy đánh dấu vài từ đã học trước.');
  copyText(copyPrompt(b.dataset.cp, ws));
});
// De de dan sang chat AI ben ngoai (hoi tung cau, cho tra loi)
function copyPrompt(kind, ws) {
  var base = 'Bạn là giáo viên tiếng Trung, trả lời và giải thích bằng tiếng Việt. ' + CONTEXT + '\nTrình độ của tôi: khoảng ' + lvHint(ws) + '.\nCác từ tôi đang học:\n' + wordList(ws) + '\n\n';
  if (kind === 'quiz') return base + 'Hãy cho tôi làm bài tập 8 câu với các từ trên, HỎI TỪNG CÂU MỘT và chờ tôi trả lời rồi mới chấm. Trộn các dạng: chọn từ điền vào chỗ trống (A/B/C/D), chọn câu dịch đúng, chọn nghĩa đúng, sắp xếp từ thành câu, dịch câu ngắn Việt → Trung. Sau mỗi câu: báo đúng/sai, giải thích ngắn, cho câu mẫu kèm pinyin. Hết 8 câu thì tổng kết số câu đúng và từ tôi cần ôn thêm. Bắt đầu câu 1.';
  if (kind === 'chat') return base + 'Hãy đóng vai tổ trưởng ở xưởng (hoặc khách hàng nếu tôi yêu cầu) và luyện hội thoại với tôi, cố gắng dùng các từ trên. Mỗi lượt: (1) nếu câu tôi viết sai thì sửa và giải thích ngắn; (2) nói 1–2 câu tiếng Trung ngắn, kèm pinyin và dịch tiếng Việt; (3) hỏi tôi một câu để tôi trả lời tiếp. Nếu tôi trả lời bằng tiếng Việt, hãy gợi ý cách nói bằng tiếng Trung. Bắt đầu nhé.';
  return base + 'Tôi sẽ lần lượt đặt câu tiếng Trung với từng từ trên. Mỗi câu tôi gửi, hãy chấm 1–5 sao, chỉ ra lỗi, viết lại câu đúng kèm pinyin và nghĩa, và gợi ý một câu tự nhiên hơn. Bây giờ hãy nhắc tôi từ đầu tiên cần đặt câu.';
}

// ---------- Huong dan lay khoa Gemini mien phi ----------
function keyGuide() {
  var has = !!getKey();
  openSheet('<h3 style="margin-top:4px">🔑 Lấy khóa AI Gemini miễn phí</h3>' +
    '<div class="small muted" style="margin-bottom:8px">Làm 1 lần, khoảng 3 phút. Miễn phí, không cần thẻ ngân hàng. Khóa chỉ lưu trên máy này.</div>' +
    '<ol class="steps-ol"><li><b>Mở trang lấy khóa:</b> bấm nút dưới đây (trang Google AI Studio).<div style="margin:6px 0"><a class="btn primary" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Mở Google AI Studio ↗</a></div></li>' +
    '<li><b>Đăng nhập</b> bằng tài khoản Google (Gmail) của bạn. Nếu hiện hộp điều khoản, tích đồng ý rồi bấm <b>Continue / Tiếp tục</b>.</li>' +
    '<li>Bấm nút <b>“Create API key”</b> (Tạo khóa API). Nếu được hỏi chọn dự án, chọn dự án có sẵn hoặc bấm tạo dự án mới.</li>' +
    '<li>Một dãy ký tự dài bắt đầu bằng <code>AIza…</code> hiện ra. Bấm <b>Copy</b> (biểu tượng 2 ô vuông) để sao chép.</li>' +
    '<li>Quay lại app này, <b>dán khóa</b> vào ô dưới đây rồi bấm <b>Lưu và kiểm tra</b>.</li></ol>' +
    '<input id="keyIn" type="password" class="key-in" placeholder="Dán khóa AIza… vào đây" autocomplete="off">' +
    '<div class="row" style="margin-top:8px"><button class="btn primary grow" id="keySave">Lưu và kiểm tra</button>' + (has ? '<button class="btn" id="keyDel">Xóa khóa</button>' : '') + '</div><div id="keyMsg" class="small" style="margin-top:8px">' + (has ? '✅ Máy này đã có khóa AI.' : '') + '</div>' +
    '<details class="small" style="margin-top:10px"><summary>Lưu ý an toàn</summary><ul><li>Không gửi khóa cho người khác; ai có khóa sẽ dùng được lượt miễn phí của bạn.</li><li>Bản miễn phí có giới hạn lượt mỗi phút/ngày; hết lượt thì đợi một lúc.</li><li>Google có thể dùng nội dung gửi qua bản miễn phí để cải thiện AI – đừng gõ thông tin cá nhân.</li><li>Muốn ngừng dùng: bấm Xóa khóa ở đây, hoặc xóa khóa trong Google AI Studio.</li></ul></details>');
  $('keySave').onclick = function () {
    var k = $('keyIn').value.trim(); if (!k) return toast('Hãy dán khóa vào ô.');
    var btn = this; btn.disabled = true; $('keyMsg').textContent = '⏳ Đang kiểm tra khóa…';
    testKey(k, function (ok, e) {
      btn.disabled = false;
      if (ok) { $('keyMsg').textContent = '✅ Khóa dùng được! Vào Ôn tập → Luyện với AI.'; AI.off = false; initAI(); toast('Đã lưu khóa AI.'); }
      else if (e && e.code === 'rate_limited') { $('keyMsg').textContent = '✅ Khóa đúng, nhưng đang hết lượt miễn phí. Đợi 1–2 phút rồi dùng.'; AI.off = false; initAI(); }
      else if (e && e.code === 'bad_key') { setKey(''); $('keyMsg').textContent = '❌ Khóa không đúng. Kiểm tra đã copy đủ dãy AIza… chưa (không thừa dấu cách).'; }
      else if (e && e.code === 'key_refused') {
        setKey('');
        var m = e.message || '', why = /location|region|country/i.test(m) ? 'Google chưa cho dùng Gemini API ở khu vực/mạng này (thử tắt VPN hoặc dùng mạng khác).' :
          /SERVICE_DISABLED|has not been used|disabled/i.test(m) ? 'Dự án của khóa chưa bật Gemini API. Vào lại aistudio.google.com/app/apikey, tạo khóa mới bằng nút “Create API key in new project”.' :
          /PERMISSION_DENIED|referer|restrict/i.test(m) ? 'Khóa đang bị giới hạn (chỉ cho một số trang web/ứng dụng). Tạo khóa mới không đặt giới hạn.' : 'Google từ chối khóa này.';
        $('keyMsg').innerHTML = '❌ ' + esc(why) + '<div class="muted" style="margin-top:4px">Chi tiết từ Google (gửi giáo viên nếu cần): <code>' + esc(m.slice(0, 300)) + '</code></div>';
      }
      else if (window.claude) { setKey(''); $('keyMsg').innerHTML = '❌ Trang trong Claude chặn kết nối tới Google nên khóa Gemini không dùng được ở đây. Hãy mở app bằng <b>link GitHub</b> rồi dán khóa ở đó (tiến độ chuyển bằng mã sao lưu ở Cài đặt).<div style="margin-top:6px"><a class="btn primary" href="' + APP_URL + '" target="_blank" rel="noopener">Mở link GitHub ↗</a></div>'; }
      else { setKey(''); $('keyMsg').innerHTML = '❌ Chưa kết nối được tới Google. Kiểm tra mạng (một số mạng công ty/wifi xưởng chặn Google AI; thử 4G) rồi thử lại.<div class="muted" style="margin-top:4px">Chi tiết: <code>' + esc(((e && e.message) || '').slice(0, 300)) + '</code></div>'; }
    });
  };
  if ($('keyDel')) $('keyDel').onclick = function () { setKey(''); try { localStorage.removeItem('hsk30.aimodel'); } catch (e) { } initAI(); closeSheet(); toast('Đã xóa khóa AI trên máy này.'); };
}
function aiSettingsHtml() {
  return '<div class="card"><b>🔑 Khóa AI (Gemini miễn phí)</b><div class="small muted" style="margin:4px 0 8px">' +
    (getKey() ? '✅ Máy này đã có khóa – AI chạy ngay trong tab Ôn tập.' : 'Thêm khóa để dùng Bài tập AI, Luyện hội thoại và Chấm câu ngay trong app, kể cả khi không có tài khoản Claude.') +
    '</div><button class="btn" id="keyOpen">' + (getKey() ? 'Xem / đổi khóa' : '🔑 Hướng dẫn lấy khóa miễn phí') + '</button></div>';
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
