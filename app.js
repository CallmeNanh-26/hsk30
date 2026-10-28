/* Doi chieu HSK 3.0 - phan loi: du lieu, luu tien do, tra tu, chi tiet tu */
'use strict';

var POS_VI = { '名': 'danh từ', '动': 'động từ', '形': 'tính từ', '副': 'phó từ', '代': 'đại từ', '数': 'số từ', '量': 'lượng từ',
  '介': 'giới từ', '连': 'liên từ', '助': 'trợ từ', '叹': 'thán từ', '前缀': 'tiền tố', '后缀': 'hậu tố', '数量': 'số lượng từ', '拟声': 'từ tượng thanh' };
var LEVELS = [1, 2, 3, 4, 5, 6];
var TAG_CLASS = { 'Công xưởng': 'f', 'Thương mại': 'c' };

// ---------- Du lieu ----------
var WORDS = [], BYW = {}, TAGS = [];

function splitLines(blocks) {
  var out = [];
  (blocks || []).forEach(function (b) {
    String(b).split('\n').forEach(function (l) { l = l.trim(); if (l && l.indexOf('|') > 0) out.push(l.split('|').map(function (x) { return x.trim(); })); });
  });
  return out;
}
function setContent(w, f, start) {
  // f[start..]: cau1, py1, dich1, cau2, py2, dich2, hoi, dichhoi, traloi
  var ex = [];
  for (var k = 0; k < 2; k++) {
    var zh = f[start + k * 3];
    if (zh) ex.push({ zh: zh, py: f[start + k * 3 + 1] || '', vi: f[start + k * 3 + 2] || '' });
  }
  if (ex.length) w.ex = ex;
  if (f[start + 6] && f[start + 8]) w.qa = { q: f[start + 6], qvi: f[start + 7] || '', a: f[start + 8] };
}
function addWord(w, py, pos, lv) {
  var o = BYW[w];
  if (!o) { o = { w: w, py: py || '', pos: pos || '', lv: lv, vi: '', en: '', tags: [], ex: [], qa: null }; BYW[w] = o; WORDS.push(o); }
  return o;
}
function addTag(o, t) { if (t && o.tags.indexOf(t) < 0) o.tags.push(t); if (t && TAGS.indexOf(t) < 0) TAGS.push(t); }

function buildData() {
  (window.HSK_BASE || []).forEach(function (r) { addWord(r[0], r[1], r[2], r[3]); });
  var en = window.HSK_EN || {};
  WORDS.forEach(function (o) { o.en = en[o.w] || ''; });
  splitLines(window.HSK_VI).forEach(function (f) { if (BYW[f[0]] && f[1]) BYW[f[0]].vi = f[1]; });
  splitLines(window.HSK_CONTENT).forEach(function (f) {
    var o = BYW[f[0]]; if (!o) return;
    if (f[1]) o.vi = f[1];
    setContent(o, f, 2);
  });
  // Bo sung cua giao vien: tu|pinyin|cap|nhan|nghia|cau1|py1|dich1|cau2|py2|dich2|hoi|dichhoi|traloi
  splitLines(window.HSK_EXTRA).concat(window.HSK_EXTRA_CSV || []).forEach(applyExtra);
  var tg = window.HSK_TAGS || {};
  Object.keys(tg).forEach(function (t) {
    if (TAGS.indexOf(t) < 0) TAGS.push(t);
    tg[t].split(/\s+/).forEach(function (w) { if (BYW[w]) addTag(BYW[w], t); });
  });
  WORDS.forEach(function (o) { o.key = norm(o.py) + ' ' + norm(o.vi) + ' ' + o.en.toLowerCase(); });
}
function applyExtra(f) {
  if (!f[0]) return;
  var lvRaw = (f[2] || '').trim();
  var lv = /^[1-6]$/.test(lvRaw) ? +lvRaw : (lvRaw ? lvRaw : 0);
  var o = BYW[f[0]];
  if (!o) o = addWord(f[0], f[1], '', lv);
  if (f[1]) o.py = f[1];
  (f[3] || '').split(/[,;，]/).forEach(function (t) { addTag(o, t.trim()); });
  if (f[4]) o.vi = f[4];
  setContent(o, f, 5);
}

// Doc file data/bo-sung.csv (neu co, chi chay khi dua len web)
function loadCsv(done) {
  if (location.protocol === 'file:') return done();
  fetch('data/bo-sung.csv', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
    if (t) window.HSK_EXTRA_CSV = parseCsv(t).slice(1);
    done();
  }).catch(function () { done(); });
}
function parseCsv(t) {
  t = t.replace(/^﻿/, '');
  var rows = [], row = [], cell = '', q = false;
  for (var i = 0; i < t.length; i++) {
    var c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',' || c === ';' || c === '\t') { row.push(cell.trim()); cell = ''; }
    else if (c === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows.filter(function (r) { return r[0]; });
}

// ---------- Tien ich ----------
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/ü/g, 'v').replace(/[\s'’\-·]/g, '');
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function $(id) { return document.getElementById(id); }
function meaning(o) { return o.vi || (o.en ? '(EN) ' + o.en : '—'); }
function lvLabel(o) { if (o.mine) return 'Từ của tôi'; if (o.approved) return 'Bổ sung'; return o.lv ? (typeof o.lv === 'number' ? 'HSK ' + o.lv : 'HSK ' + o.lv) : 'Ngoài HSK'; }
function posLabel(p) { return p ? p.replace(/[（）()]/g, '').split('、').map(function (x) { return POS_VI[x] || x; }).join(', ') : 'cụm từ'; }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function today() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); }
var toastT;
function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2200); }

// ---------- Luu tien do (tren trinh duyet cua hoc vien) ----------
var KEY = 'hsk30.progress.v1';
var S = { name: '', known: {}, srs: {}, eb: {}, perDay: 10 };
function loadState() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) S = Object.assign(S, s); } catch (e) { } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Không lưu được: trình duyệt đang chặn bộ nhớ.'); } }
function isKnown(w) { return !!S.known[w]; }
function setKnown(w, v) {
  if (v) { if (!S.known[w]) { S.known[w] = today(); ebStart(w); onLearned(); } }
  else { delete S.known[w]; delete S.srs[w]; delete S.eb[w]; renderRemind(); }
  save();
}

// ---------- Phat am (giong doc cua thiet bi) ----------
var zhVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  var vs = speechSynthesis.getVoices();
  zhVoice = vs.filter(function (v) { return /zh[-_]CN/i.test(v.lang); })[0] || vs.filter(function (v) { return /^zh|cmn/i.test(v.lang); })[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text, slow) {
  if (!('speechSynthesis' in window)) { toast('Trình duyệt không hỗ trợ đọc. Hãy dùng Chrome hoặc Safari.'); return; }
  speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = slow ? 0.55 : 0.85;
  if (zhVoice) u.voice = zhVoice;
  else if (speechSynthesis.getVoices().length) toast('Máy chưa có giọng đọc tiếng Trung – xem mục Cài đặt.');
  speechSynthesis.speak(u);
}

// ---------- Tra tu ----------
var F = { q: '', lv: 'all', tag: '', st: 'all', limit: 60 };
function renderChips() {
  var lv = [['all', 'Tất cả']].concat(LEVELS.map(function (l) { return [String(l), 'HSK ' + l]; }));
  if (WORDS.some(function (o) { return !o.lv; })) lv.push(['0', 'Ngoài HSK']);
  $('lvChips').innerHTML = lv.map(function (x) { return '<button class="chip' + (F.lv === x[0] ? ' on' : '') + '" data-lv="' + x[0] + '">' + x[1] + '</button>'; }).join('');
  $('tagChips').innerHTML = '<span class="muted small" style="align-self:center">Nhãn:</span>' + TAGS.map(function (t) { return '<button class="chip' + (F.tag === t ? ' tag-on' : '') + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>'; }).join('');
  var st = [['all', 'Mọi trạng thái'], ['known', '✓ Đã học'], ['unknown', 'Chưa học'], ['note', '📝 Có ghi chú'], ['mine', '✏️ Từ của tôi']];
  $('stChips').innerHTML = st.map(function (x) { return '<button class="chip' + (F.st === x[0] ? ' on' : '') + '" data-st="' + x[0] + '">' + x[1] + '</button>'; }).join('');
}
function filtered() {
  var q = F.q.trim(), nq = norm(q), hasHan = /[㐀-鿿]/.test(q);
  var res = WORDS.filter(function (o) {
    if (F.lv !== 'all' && String(o.lv || 0) !== F.lv && !(F.lv === '0' && typeof o.lv === 'string')) return false;
    if (F.tag && o.tags.indexOf(F.tag) < 0) return false;
    if (F.st === 'known' && !isKnown(o.w)) return false;
    if (F.st === 'unknown' && isKnown(o.w)) return false;
    if (F.st === 'note' && !(S.notes && S.notes[o.w])) return false;
    if (F.st === 'mine' && !o.mine) return false;
    if (!q) return true;
    if (hasHan) return o.w.indexOf(q) >= 0;
    return nq && o.key.indexOf(nq) >= 0;
  });
  if (q) {
    var score = function (o) {
      if (o.w === q || norm(o.py) === nq) return 0;
      if (hasHan ? o.w.indexOf(q) === 0 : norm(o.py).indexOf(nq) === 0) return 1;
      if (norm(o.vi).split(/[;,]/).some(function (m) { return m.trim() === nq; })) return 1;
      return 2;
    };
    res.sort(function (a, b) { return score(a) - score(b) || (a.lv || 9) - (b.lv || 9) || a.w.length - b.w.length; });
  }
  return res;
}
function rowHtml(o) {
  return '<div class="item" data-w="' + esc(o.w) + '"><div class="main"><div><span class="hz">' + esc(o.w) + '</span><span class="py">' + esc(o.py) + '</span><span class="lv">' + lvLabel(o) + '</span>' + (S.notes && S.notes[o.w] ? '<span class="lv" title="Có ghi chú">📝</span>' : '') + '</div>' +
    '<div class="mean">' + esc(meaning(o)) + '</div></div>' +
    '<button class="check' + (isKnown(o.w) ? ' on' : '') + '" aria-label="Đánh dấu đã học">✓</button></div>';
}
function renderResults() {
  var res = filtered();
  $('count').textContent = res.length + ' từ · đã học ' + res.filter(function (o) { return isKnown(o.w); }).length;
  $('results').innerHTML = res.length ? res.slice(0, F.limit).map(rowHtml).join('') : '<div class="empty">Không tìm thấy từ phù hợp.</div>';
  $('moreWrap').style.display = res.length > F.limit ? '' : 'none';
}
function bindSearch() {
  var t;
  $('q').addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { F.q = $('q').value; F.limit = 60; renderResults(); }, 150); });
  $('qclear').onclick = function () { $('q').value = ''; F.q = ''; renderResults(); $('q').focus(); };
  document.querySelector('#view-search').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b && b.dataset.lv) { F.lv = b.dataset.lv; F.limit = 60; renderChips(); renderResults(); return; }
    if (b && b.dataset.tag !== undefined) { F.tag = F.tag === b.dataset.tag ? '' : b.dataset.tag; F.limit = 60; renderChips(); renderResults(); return; }
    if (b && b.dataset.st) { F.st = b.dataset.st; F.limit = 60; renderChips(); renderResults(); return; }
    var it = e.target.closest('.item'); if (!it) return;
    var w = it.dataset.w;
    if (e.target.closest('.check')) { var v = !isKnown(w); setKnown(w, v); e.target.closest('.check').classList.toggle('on', v); updateSub(); toast(v ? 'Đã đánh dấu: ' + w : 'Đã bỏ đánh dấu: ' + w); }
    else openWord(w);
  });
  $('moreBtn').onclick = function () { F.limit += 100; renderResults(); };
  $('markAll').onclick = function () { bulk(true); };
  $('unmarkAll').onclick = function () { bulk(false); };
}
function bulk(v) {
  var res = filtered();
  if (!res.length) return;
  askConfirm((v ? 'Đánh dấu ĐÃ HỌC ' : 'Bỏ đánh dấu ') + res.length + ' từ đang hiển thị trong bộ lọc?', v ? 'Đánh dấu ' + res.length + ' từ' : 'Bỏ đánh dấu', function () {
    res.forEach(function (o) { if (v) S.known[o.w] = S.known[o.w] || today(); else { delete S.known[o.w]; delete S.srs[o.w]; delete S.eb[o.w]; } });
    if (v) ebSpread(res.map(function (o) { return o.w; }));
    save(); renderRemind(); renderResults(); updateSub(); toast(v ? 'Đã đánh dấu ' + res.length + ' từ.' : 'Đã bỏ đánh dấu.');
  });
}
// Hop xac nhan ngay trong trang (khong dung confirm() cua trinh duyet)
function askConfirm(msg, okLabel, onYes) {
  openSheet('<div class="big-msg" style="margin:8px 0 16px">' + esc(msg) + '</div><div class="row"><button class="btn primary grow" id="cfYes">' + esc(okLabel) + '</button><button class="btn grow" data-close>Hủy</button></div>');
  $('cfYes').onclick = function () { closeSheet(); onYes(); };
}

// ---------- Chi tiet tu ----------
function openSheet(html) { $('sheet').innerHTML = '<button class="close" data-close>×</button>' + html; $('modal').classList.add('open'); $('sheet').scrollTop = 0; }
function closeSheet() { $('modal').classList.remove('open'); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
function tagHtml(o) {
  return '<div class="tags"><span class="tag">' + lvLabel(o) + '</span><span class="tag">' + esc(posLabel(o.pos)) + '</span>' +
    o.tags.map(function (t) { return '<span class="tag ' + (TAG_CLASS[t] || '') + '">' + esc(t) + '</span>'; }).join('') + '</div>';
}
function exHtml(e) {
  return '<div class="ex"><button class="mini-speak" data-say="' + esc(e.zh) + '" aria-label="Nghe">🔊</button><div><div class="zh">' + esc(e.zh) + '</div><div class="p">' + esc(e.py) + '</div><div class="v">' + esc(e.vi) + '</div></div></div>';
}
function openWord(w) {
  var o = BYW[w]; if (!o) return;
  var k = isKnown(w);
  var h = '<div class="word-head"><div class="hz">' + esc(o.w) + '</div><div class="py">' + esc(o.py) + '</div>' +
    '<div class="row" style="justify-content:center;margin:8px 0"><button class="speak" data-say="' + esc(o.w) + '">🔊 Nghe</button><button class="speak" data-say="' + esc(o.w) + '" data-slow="1">🐢 Đọc chậm</button></div>' +
    '<div class="mean">' + esc(meaning(o)) + '</div></div>' + tagHtml(o);
  if (o.vi && o.en) h += '<div class="muted small" style="text-align:center">EN: ' + esc(o.en) + '</div>';
  h += '<h3>Câu ví dụ</h3>';
  h += o.ex.length ? '<div class="card">' + o.ex.map(exHtml).join('') + '</div>' : '<div class="card muted small">Chưa có câu ví dụ cho từ này. Bài tập sẽ dùng nghĩa, pinyin và phần nghe.</div>';
  if (o.qa) h += '<h3>Hỏi – đáp</h3><div class="card">' + exHtml({ zh: o.qa.q, py: '', vi: o.qa.qvi }) + exHtml({ zh: '→ ' + o.qa.a, py: '', vi: 'Câu trả lời mẫu' }).replace('data-say="→ ', 'data-say="') + '</div>';
  h += noteHtml(o.w);
  if (o.mine) h += '<div class="small muted" style="margin-top:6px">Từ do bạn tự thêm · sửa hoặc đề xuất ở tab “Từ của tôi”.</div>';
  h += '<div style="display:grid;gap:8px;margin-top:14px">' +
    '<button class="btn block ' + (k ? '' : 'ok') + '" data-toggle="' + esc(o.w) + '">' + (k ? '✓ Đã học · bấm để bỏ đánh dấu' : 'Đánh dấu ĐÃ HỌC') + '</button>' +
    '<button class="btn block primary" data-practice="' + esc(o.w) + '">✍️ Luyện tập 5 câu</button></div>';
  openSheet(h);
  bindNote(o.w);
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-say]');
  if (b) { e.stopPropagation(); speak(b.dataset.say, !!b.dataset.slow); return; }
  if (e.target.closest('[data-close]') || e.target === $('modal')) { closeSheet(); return; }
  var t = e.target.closest('[data-toggle]');
  if (t) { var w = t.dataset.toggle; setKnown(w, !isKnown(w)); openWord(w); renderResults(); updateSub(); return; }
  var p = e.target.closest('[data-practice]');
  if (p) { startQuiz([p.dataset.practice], 'single'); return; }
  var ow = e.target.closest('[data-open]');
  if (ow) { openWord(ow.dataset.open); }
});

// ---------- Khung chung ----------
function updateSub() {
  var n = Object.keys(S.known).filter(function (w) { return BYW[w]; }).length;
  $('subline').textContent = (S.name ? S.name + ' · ' : '') + 'Đã học ' + n + ' / ' + WORDS.length + ' từ';
}
var VIEWS = {};
function show(v) {
  document.querySelectorAll('.view').forEach(function (s) { s.classList.toggle('active', s.id === 'view-' + v); });
  document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.view === v); });
  if (VIEWS[v]) VIEWS[v]();
  if (v === 'search') renderResults();
  window.scrollTo(0, 0);
  try { localStorage.setItem('hsk30.tab', v); } catch (e) { }
}
$('tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(b.dataset.view); });

function boot() {
  loadState();
  loadCsv(function () {
    buildData(); initMine(); initNhac();
    renderChips(); bindSearch(); updateSub();
    var tab = 'search'; try { tab = localStorage.getItem('hsk30.tab') || 'search'; } catch (e) { }
    if (tab === 'duyet') tab = 'search';
    show(VIEWS[tab] || tab === 'search' ? tab : 'search');
    startCloud();
  });
}
