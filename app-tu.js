/* Tu cua toi, ghi chu rieng, de xuat tu len giao vien va duyet tu */
'use strict';

var MINE_TAG = 'Của tôi', APPROVED_TAG = 'Bổ sung';
var CHECK_TAGS = ['Công xưởng', 'Thương mại'];
// S.mine: {tu: {py, vi, tags, ex, at}} · S.notes: {tu: 'ghi chu'} · S.privAt: lan sua cuoi (ms)
function ensureS() { S.mine = S.mine || {}; S.notes = S.notes || {}; S.privAt = S.privAt || 0; }
function clean(s) { return String(s == null ? '' : s).replace(/[|\r\n]+/g, ' ').trim(); }
function isHan(s) { return /^[㐀-鿿\s·…]+$/.test(s) && /[㐀-鿿]/.test(s); }

// ---------- Dua tu rieng / tu da duyet vao bang tu ----------
function putWord(w, d, flag) {
  var o = BYW[w];
  if (o && !o.mine && !o.approved) return null; // tu co san cua he thong: khong ghi de
  if (o && o.approved && flag === 'mine') return null; // tu da duyet uu tien hon tu rieng
  if (!o) o = addWord(w, '', '', 0);
  o.mine = flag === 'mine'; o.approved = flag === 'approved';
  o.py = d.py || ''; o.vi = d.vi || ''; o.tags = []; o.qa = null;
  (d.tags || []).forEach(function (t) { addTag(o, t); });
  addTag(o, o.mine ? MINE_TAG : APPROVED_TAG);
  o.ex = (d.ex || []).filter(function (e) { return e && e.zh; }).slice(0, 2);
  o.key = norm(o.py) + ' ' + norm(o.vi) + ' ';
  return o;
}
function dropWord(w) {
  var o = BYW[w]; if (!o || !(o.mine || o.approved)) return;
  delete BYW[w]; WORDS.splice(WORDS.indexOf(o), 1);
}
function applyMine() {
  WORDS.filter(function (o) { return o.mine; }).forEach(function (o) { dropWord(o.w); });
  Object.keys(S.mine).forEach(function (w) { putWord(w, S.mine[w], 'mine'); });
}
function initMine() { ensureS(); applyMine(); }

function touch() { S.privAt = Date.now(); save(); pushPrivate(); }
function setNote(w, t) { t = String(t || '').trim(); if (t) S.notes[w] = t; else delete S.notes[w]; touch(); }

// ---------- Kho du lieu tren Claude (chi co khi mo qua link Artifact) ----------
var CL = { db: null, user: null, uid: null, admin: false, privOff: false, props: {}, propsLoaded: false, propsExists: false, approved: {}, all: [] };
function startCloud() {
  if (!window.claude || typeof claude.use !== 'function') return;
  Promise.all([claude.use('db'), claude.use('user')]).then(function (r) {
    var db = r[0], user = r[1];
    if (!db || !user) return;
    return user.me().then(function (me) {
      if (!me.id) return;
      CL.db = db; CL.user = user; CL.uid = me.id; CL.admin = !!me.canEdit;
      pullPrivate();
      db.doc('chung/duyet').onSnapshot(function (s) {
        CL.approved = s.exists ? (s.data().items || {}) : {};
        WORDS.filter(function (o) { return o.approved && !CL.approved[o.w]; }).forEach(function (o) { dropWord(o.w); });
        Object.keys(CL.approved).forEach(function (w) { putWord(w, CL.approved[w], 'approved'); });
        applyMine(); refreshViews();
      }, function () { });
      db.doc('dexuat/' + CL.uid).onSnapshot(function (s) {
        CL.propsLoaded = true; CL.propsExists = s.exists;
        CL.props = s.exists ? (s.data().items || {}) : {};
        refreshViews();
      }, function () { });
      if (CL.admin) {
        $('tabDuyet').style.display = '';
        db.collection('dexuat').onSnapshot(function (s) {
          CL.all = s.docs.map(function (d) { var x = d.data(); return { uid: d.id, ten: x.ten || '', items: x.items || {} }; });
          refreshViews();
        }, function () { });
      }
      refreshViews();
    });
  }).catch(function () { });
}
function privRef() { return CL.db.doc('data/users/' + CL.uid + '/rieng'); }
function pullPrivate() {
  privRef().get().then(function (s) {
    var d = s.exists ? s.data() : null;
    if (d && (d.at || 0) > S.privAt) {
      S.mine = Object.assign({}, d.mine || {}); S.notes = Object.assign({}, d.notes || {}); S.privAt = d.at;
      save(); applyMine(); refreshViews();
    } else if (S.privAt > ((d && d.at) || 0)) pushPrivate();
  }).catch(function () { });
}
var pushT, pushing = Promise.resolve();
function pushPrivate() {
  if (!CL.db || CL.privOff) return;
  clearTimeout(pushT);
  pushT = setTimeout(function () {
    pushing = pushing.then(function () {
      return privRef().set({ mine: S.mine, notes: S.notes, at: S.privAt });
    }).catch(function (e) { if (e && e.code === 'invalid_argument') CL.privOff = true; });
  }, 1500);
}
function refreshViews() {
  var a = document.querySelector('.view.active'); if (!a) return;
  var v = a.id.slice(5);
  if (v === 'search') renderResults(); else if (v === 'mine' || v === 'duyet') VIEWS[v]();
  updateSub();
}
function seq(fns) { return fns.reduce(function (p, f) { return p.then(f); }, Promise.resolve()); }
function dbErr(e) {
  if (e && e.code === 'invalid_argument') return 'Tài khoản của bạn chỉ có quyền xem nên không gửi được. Hãy dùng nút “Sao chép gửi giáo viên”.';
  if (e && e.code === 'quota_exceeded') return 'Kho dữ liệu đã đầy, hãy báo giáo viên.';
  return 'Chưa gửi được, thử lại sau ít phút.';
}

// ---------- Ghi chu trong the tu ----------
function noteHtml(w) {
  return '<h3>📝 Ghi chú của tôi</h3><textarea id="noteBox" class="note" placeholder="Ghi chú riêng cho từ này (chỉ bạn xem được): mẹo nhớ, cách dùng ở xưởng…">' + esc(S.notes[w] || '') + '</textarea>' +
    '<div class="small muted" id="noteSt">' + (S.notes[w] ? 'Đã lưu.' : 'Gõ xong là tự lưu.') + '</div>';
}
function bindNote(w) {
  var t, box = $('noteBox'); if (!box) return;
  box.addEventListener('input', function () {
    $('noteSt').textContent = 'Đang lưu…'; clearTimeout(t);
    t = setTimeout(function () { setNote(w, box.value); $('noteSt').textContent = 'Đã lưu.'; refreshViews(); }, 600);
  });
}

// ---------- Tab "Tu cua toi" ----------
function statusOf(w) {
  var p = CL.props[w];
  if (!p) return { c: '', t: '' };
  if (p.st === 'nhan') return { c: 'ok', t: '✅ Giáo viên đã nhận vào bảng chung' };
  if (p.st === 'tuchoi') return { c: 'no', t: '❌ Không nhận' + (p.ly ? ': ' + p.ly : '') };
  return { c: 'wait', t: '⏳ Đang chờ giáo viên duyệt' };
}
VIEWS.mine = function () {
  ensureS();
  var ws = Object.keys(S.mine).sort(function (a, b) { return (S.mine[b].at || 0) - (S.mine[a].at || 0); });
  var nNote = Object.keys(S.notes).filter(function (w) { return BYW[w]; }).length;
  var h = '<div class="card"><div class="row"><div class="grow"><b>✏️ Từ của tôi</b> <span class="muted small">(' + ws.length + ' từ)</span>' +
    '<div class="small muted">' + (CL.uid ? (CL.privOff ? 'Tài khoản chỉ có quyền xem: từ và ghi chú lưu trên máy này.' : 'Đồng bộ theo tài khoản claude.ai của bạn.') : 'Lưu trên máy này (sao lưu ở mục Cài đặt).') + '</div></div>' +
    '<button class="btn primary" id="addMine">＋ Thêm từ</button></div></div>';
  if (!ws.length) h += '<div class="card muted small">Chưa có từ nào. Gặp từ mới ở xưởng mà không có trong bộ HSK? Bấm <b>＋ Thêm từ</b> để lưu lại, học và ôn như từ của hệ thống. Bạn có thể đề xuất để giáo viên đưa từ vào bảng chung cho cả lớp.</div>';
  else h += '<div class="list">' + ws.map(function (w) {
    var d = S.mine[w], st = statusOf(w), o = BYW[w];
    var act = '<button class="btn ghost" data-medit="' + esc(w) + '">Sửa</button>';
    if (CL.uid && CL.propsLoaded && (!CL.props[w] || CL.props[w].st === 'tuchoi')) act += '<button class="btn" data-msend="' + esc(w) + '">' + (CL.props[w] ? 'Gửi lại' : '📤 Đề xuất') + '</button>';
    if (CL.props[w] && CL.props[w].st === 'cho') act += '<button class="btn ghost" data-mback="' + esc(w) + '">Rút lại</button>';
    act += '<button class="btn ghost" data-mdel="' + esc(w) + '" aria-label="Xóa">🗑</button>';
    return '<div class="item mine-item"><div class="main" data-open="' + esc(o ? w : '') + '"><div><span class="hz">' + esc(w) + '</span><span class="py">' + esc(d.py) + '</span>' + (S.notes[w] ? '<span class="lv">📝</span>' : '') + '</div>' +
      '<div class="mean">' + esc(d.vi) + '</div>' + (st.t ? '<div class="pst ' + st.c + '">' + esc(st.t) + '</div>' : '') +
      (o && !o.mine ? '<div class="small muted">Từ này đã có trong bảng chung.</div>' : '') + '</div>' +
      '<div class="row mine-act">' + act + '</div></div>';
  }).join('') + '</div>';
  if (ws.length) h += '<div class="card small"><div class="muted" style="margin-bottom:8px">Không gửi được trên app (mở bằng link công khai hoặc chỉ có quyền xem)? Sao chép danh sách rồi gửi giáo viên qua Zalo.</div><button class="btn" id="copyMine">📋 Sao chép gửi giáo viên</button></div>';
  h += '<div class="card"><div class="row"><div class="grow"><b>📝 Ghi chú của tôi</b> <span class="muted small">(' + nNote + ' từ)</span><div class="small muted">Ghi chú riêng của bạn, không gửi lên bảng chung. Mở một từ bất kỳ để viết ghi chú.</div></div>' +
    (nNote ? '<button class="btn" id="seeNotes">Xem các từ</button>' : '') + '</div></div>';
  var el = $('view-mine'); el.innerHTML = h;
  $('addMine').onclick = function () { mineForm(''); };
  if ($('copyMine')) $('copyMine').onclick = function () { copyText((S.name ? 'Từ đề xuất của ' + S.name + ':\n' : '') + ws.map(function (w) { return extraLine(w, S.mine[w]); }).join('\n')); };
  if ($('seeNotes')) $('seeNotes').onclick = function () { F.st = 'note'; F.lv = 'all'; F.tag = ''; F.q = ''; $('q').value = ''; renderChips(); show('search'); };
};
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-medit],[data-msend],[data-mback],[data-mdel]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.medit) mineForm(b.dataset.medit);
  else if (b.dataset.msend) propose(b.dataset.msend);
  else if (b.dataset.mback) withdraw(b.dataset.mback);
  else { var w = b.dataset.mdel; askConfirm('Xóa từ “' + w + '” khỏi danh sách của bạn? Ghi chú của từ này cũng bị xóa.', 'Xóa từ', function () { delete S.mine[w]; delete S.notes[w]; dropWord(w); applyMine(); touch(); VIEWS.mine(); updateSub(); }); }
}, true);

function extraLine(w, d) {
  var ex = d.ex || [], f = [w, d.py, '', (d.tags || []).join(','), d.vi];
  for (var k = 0; k < 2; k++) { var e = ex[k] || {}; f.push(e.zh, e.py, e.vi); }
  f.push('', '', '');
  return f.map(clean).join('|');
}

// Form them / sua tu
function mineForm(w) {
  var d = w ? S.mine[w] : { py: '', vi: '', tags: [], ex: [] }, ex = d.ex || [];
  var other = (d.tags || []).filter(function (t) { return CHECK_TAGS.indexOf(t) < 0; }).join(', ');
  var exRow = function (k) {
    var e = ex[k] || {};
    return '<div class="ff-ex"><input id="fz' + k + '" placeholder="Câu ví dụ ' + (k + 1) + ' (chữ Hán)" value="' + esc(e.zh) + '"><input id="fp' + k + '" placeholder="Pinyin của câu" value="' + esc(e.py) + '"><input id="fv' + k + '" placeholder="Dịch tiếng Việt" value="' + esc(e.vi) + '"></div>';
  };
  openSheet('<h3 style="margin-top:4px">' + (w ? 'Sửa từ' : '＋ Thêm từ mới') + '</h3><div class="ff">' +
    '<label>Chữ Hán *<input id="fw" value="' + esc(w) + '"' + (w ? ' disabled' : '') + ' placeholder="vd: 叉车"></label><div id="fwMsg"></div>' +
    '<label>Pinyin<input id="fpy" value="' + esc(d.py) + '" placeholder="vd: chāchē"></label>' +
    '<label>Nghĩa tiếng Việt *<input id="fvi" value="' + esc(d.vi) + '" placeholder="vd: xe nâng"></label>' +
    '<div class="small muted">Nhãn</div><div class="row">' + CHECK_TAGS.map(function (t) { return '<label class="ck"><input type="checkbox" data-ft="' + esc(t) + '"' + ((d.tags || []).indexOf(t) >= 0 ? ' checked' : '') + '> ' + esc(t) + '</label>'; }).join('') + '</div>' +
    '<input id="ftag" value="' + esc(other) + '" placeholder="Nhãn khác (cách nhau dấu phẩy)">' +
    '<div class="small muted">Câu ví dụ (không bắt buộc; câu 1 nên chứa từ để có bài điền từ)</div>' + exRow(0) + exRow(1) +
    '</div><div class="row" style="margin-top:12px"><button class="btn primary grow" id="fSave">Lưu từ</button><button class="btn grow" data-close>Hủy</button></div>');
  if (!w) $('fw').addEventListener('input', function () {
    var v = this.value.trim(), o = BYW[v];
    $('fwMsg').innerHTML = o && !o.mine ? '<div class="pst wait">Từ này đã có (' + esc(lvLabel(o)) + ': ' + esc(meaning(o)) + '). <button class="btn ghost" data-open="' + esc(v) + '">Mở từ này</button></div>' :
      S.mine[v] ? '<div class="pst wait">Bạn đã thêm từ này rồi.</div>' : '';
  });
  $('fSave').onclick = function () {
    var nw = w || $('fw').value.trim(), vi = clean($('fvi').value);
    if (!isHan(nw)) return toast('Hãy nhập chữ Hán cho từ.');
    if (!w && BYW[nw] && !BYW[nw].mine) return toast('Từ này đã có trong bảng từ, hãy mở để đánh dấu.');
    if (!w && S.mine[nw]) return toast('Bạn đã thêm từ này rồi.');
    if (!vi) return toast('Hãy nhập nghĩa tiếng Việt.');
    var tags = [];
    document.querySelectorAll('[data-ft]').forEach(function (c) { if (c.checked) tags.push(c.dataset.ft); });
    $('ftag').value.split(/[,;，]/).forEach(function (t) { t = clean(t); if (t && tags.indexOf(t) < 0 && t !== MINE_TAG && t !== APPROVED_TAG) tags.push(t); });
    var exs = [0, 1].map(function (k) { return { zh: clean($('fz' + k).value), py: clean($('fp' + k).value), vi: clean($('fv' + k).value) }; }).filter(function (e) { return e.zh; });
    S.mine[nw] = { py: clean($('fpy').value), vi: vi, tags: tags, ex: exs, at: (S.mine[nw] && S.mine[nw].at) || Date.now() };
    applyMine(); if (!w && BYW[nw]) setKnown(nw, true);
    touch(); closeSheet(); renderChips(); VIEWS.mine(); updateSub();
    toast(w ? 'Đã lưu thay đổi.' : 'Đã thêm “' + nw + '”.');
  };
}

// ---------- De xuat len giao vien ----------
function propose(w) {
  var d = S.mine[w]; if (!d || !CL.uid) return;
  if (!CL.propsLoaded) return toast('Đang kết nối, thử lại sau giây lát.');
  var body = { py: d.py || '', vi: d.vi || '', tags: d.tags || [], ex: d.ex || [], st: 'cho', ly: '', at: Date.now() };
  var ref = CL.db.doc('dexuat/' + CL.uid), it = {}; it[w] = body;
  var p = CL.propsExists ? ref.update({ ten: S.name || '', items: it }) : ref.set({ ten: S.name || '', items: it });
  p.then(function () { toast('Đã gửi đề xuất “' + w + '” cho giáo viên.'); }, function (e) { toast(dbErr(e)); });
}
function withdraw(w) {
  var items = Object.assign({}, CL.props); delete items[w];
  CL.db.doc('dexuat/' + CL.uid).set({ ten: S.name || '', items: items }).then(function () { toast('Đã rút lại đề xuất.'); }, function (e) { toast(dbErr(e)); });
}

// ---------- Tab "Duyet tu" (chi giao vien / nguoi co quyen sua) ----------
function groups() {
  var g = {};
  CL.all.forEach(function (doc) {
    Object.keys(doc.items).forEach(function (w) {
      var it = doc.items[w];
      (g[w] = g[w] || { w: w, subs: [] }).subs.push({ uid: doc.uid, ten: doc.ten, it: it });
    });
  });
  return Object.keys(g).map(function (w) { return g[w]; });
}
var NAMES = {};
function nameOf(s) { return (NAMES[s.uid] && NAMES[s.uid].name) || s.ten || 'Học viên'; }
function resolveNames(ids) {
  ids = ids.filter(function (id) { return !NAMES[id]; });
  if (!ids.length || !CL.user || !CL.user.profiles) return;
  CL.user.profiles(ids).then(function (ps) { Object.assign(NAMES, ps); if (document.querySelector('#view-duyet.active')) VIEWS.duyet(); }).catch(function () { });
}
VIEWS.duyet = function () {
  var el = $('view-duyet');
  if (!CL.admin) { el.innerHTML = '<div class="card muted small">Mục này chỉ dành cho giáo viên (chủ app hoặc người có quyền sửa) khi mở bằng link Artifact.</div>'; return; }
  var gs = groups(), pend = gs.filter(function (g) { return !CL.approved[g.w] && g.subs.some(function (s) { return s.it.st === 'cho'; }); });
  pend.sort(function (a, b) { return b.subs.length - a.subs.length; });
  var ap = Object.keys(CL.approved);
  var h = '<div class="card"><b>✅ Duyệt từ học viên đề xuất</b><div class="small muted">Từ được nhận sẽ hiện ngay cho mọi học viên, gắn nhãn “' + APPROVED_TAG + '”.</div></div>';
  h += '<div class="card"><details' + (CL.pasteOpen ? ' open' : '') + ' id="pasteDet"><summary><b>📥 Dán danh sách từ học viên gửi qua Zalo</b></summary>' +
    '<div class="small muted" style="margin:6px 0">Dán nguyên tin nhắn học viên gửi (bấm “Sao chép gửi giáo viên” trong tab Từ của tôi). Các từ sẽ vào mục Chờ duyệt bên dưới.</div>' +
    '<textarea id="pasteBox" placeholder="Từ đề xuất của …:&#10;叉车|chāchē||Công xưởng|xe nâng|…"></textarea>' +
    '<div class="row" style="margin-top:6px"><input id="pasteName" class="grow" placeholder="Tên học viên (nếu tin nhắn không có)"><button class="btn primary" id="pasteGo">Đưa vào Chờ duyệt</button></div></details></div>';
  h += '<h3>Chờ duyệt (' + pend.length + ')</h3>';
  h += pend.length ? '<div class="list">' + pend.map(function (g) {
    var it = g.subs[0].it;
    return '<div class="item" data-duyet="' + esc(g.w) + '"><div class="main"><div><span class="hz">' + esc(g.w) + '</span><span class="py">' + esc(it.py) + '</span><span class="lv">' + g.subs.length + ' người</span></div>' +
      '<div class="mean">' + esc(it.vi) + '</div><div class="small muted">' + g.subs.map(function (s) { return esc(nameOf(s)); }).join(', ') + '</div></div><button class="btn primary">Xem</button></div>';
  }).join('') + '</div>' : '<div class="card muted small">Chưa có đề xuất mới.</div>';
  h += '<h3>Đã nhận vào bảng chung (' + ap.length + ')</h3>';
  if (ap.length) h += '<div class="list">' + ap.map(function (w) {
    var d = CL.approved[w];
    return '<div class="item"><div class="main" data-open="' + esc(w) + '"><div><span class="hz">' + esc(w) + '</span><span class="py">' + esc(d.py) + '</span></div><div class="mean">' + esc(d.vi) + '</div></div><button class="btn ghost" data-unapprove="' + esc(w) + '">Gỡ</button></div>';
  }).join('') + '</div><div class="card small"><div class="muted" style="margin-bottom:8px">Muốn ghi các từ này vĩnh viễn vào file <code>data/bo-sung.js</code> (cho bản Netlify/GitHub)? Sao chép rồi dán vào cuối file, hoặc nhờ Claude cập nhật.</div><button class="btn" id="copyApproved">📋 Sao chép dòng cho bo-sung.js</button></div>';
  var keep = $('pasteBox') ? [$('pasteBox').value, $('pasteName').value] : null; // giu noi dung dang dan khi trang ve lai
  el.innerHTML = h;
  if (keep) { $('pasteBox').value = keep[0]; $('pasteName').value = keep[1]; }
  if ($('copyApproved')) $('copyApproved').onclick = function () { copyText(ap.map(function (w) { return extraLine(w, CL.approved[w]); }).join('\n')); };
  $('pasteDet').ontoggle = function () { CL.pasteOpen = this.open; };
  $('pasteGo').onclick = importPasted;
  resolveNames(CL.all.map(function (d) { return d.uid; }).filter(function (id) { return id.indexOf('zalo-') !== 0; }));
};
// Doc tin nhan Zalo: dong dau "Tu de xuat cua <ten>:", moi dong sau la mot tu theo dinh dang bo-sung.js
function importPasted() {
  var txt = $('pasteBox').value, ten = clean($('pasteName').value), items = {}, skip = [], n = 0;
  txt.split(/\r?\n/).forEach(function (l) {
    l = l.trim(); if (!l) return;
    var m = l.match(/^Từ đề xuất của (.+?):?$/); if (m) { if (!ten) ten = clean(m[1]); return; }
    if (l.indexOf('|') < 0) return;
    var f = l.split('|').map(function (x) { return x.trim(); }), w = f[0];
    if (!isHan(w) || !f[4]) return;
    if (BYW[w] && !BYW[w].mine) { skip.push(w); return; }
    var ex = [5, 8].map(function (i) { return { zh: f[i] || '', py: f[i + 1] || '', vi: f[i + 2] || '' }; }).filter(function (e) { return e.zh; });
    items[w] = { py: f[1] || '', vi: f[4], tags: (f[3] || '').split(/[,;，]/).map(clean).filter(Boolean), ex: ex, st: 'cho', ly: '', at: Date.now() };
    n++;
  });
  if (!n) return toast(skip.length ? 'Các từ này đã có trong bảng: ' + skip.join(', ') : 'Không đọc được từ nào. Hãy dán đúng tin nhắn học viên gửi.');
  CL.db.doc('dexuat/zalo-' + Date.now()).set({ ten: (ten || 'Học viên') + ' (Zalo)', items: items }).then(function () {
    if ($('pasteBox')) { $('pasteBox').value = ''; $('pasteName').value = ''; }
    toast('Đã đưa ' + n + ' từ vào Chờ duyệt.' + (skip.length ? ' Bỏ qua ' + skip.length + ' từ đã có: ' + skip.join(', ') : ''));
  }, function (e) { toast(dbErr(e)); });
}
document.addEventListener('click', function (e) {
  var d = e.target.closest('[data-duyet]'); if (d) { e.stopPropagation(); reviewForm(d.dataset.duyet); return; }
  var u = e.target.closest('[data-unapprove]');
  if (u) { e.stopPropagation(); var w = u.dataset.unapprove; askConfirm('Gỡ “' + w + '” khỏi bảng chung? Học viên sẽ không còn thấy từ này trong bảng từ hệ thống.', 'Gỡ từ', function () { var items = Object.assign({}, CL.approved); delete items[w]; CL.db.doc('chung/duyet').set({ items: items }).then(function () { toast('Đã gỡ.'); }, function (er) { toast(dbErr(er)); }); }); }
}, true);
function reviewForm(w) {
  var g = groups().filter(function (x) { return x.w === w; })[0]; if (!g) return;
  var it = g.subs[0].it, ex = it.ex || [];
  var exRow = function (k) { var e = ex[k] || {}; return '<div class="ff-ex"><input id="rz' + k + '" placeholder="Câu ví dụ ' + (k + 1) + '" value="' + esc(e.zh) + '"><input id="rp' + k + '" placeholder="Pinyin" value="' + esc(e.py) + '"><input id="rv' + k + '" placeholder="Dịch" value="' + esc(e.vi) + '"></div>'; };
  var alt = g.subs.slice(1).filter(function (s) { return s.it.vi !== it.vi || s.it.py !== it.py; });
  openSheet('<div class="word-head"><div class="hz">' + esc(w) + '</div><button class="speak" data-say="' + esc(w) + '">🔊 Nghe</button></div>' +
    '<div class="small muted" style="text-align:center">Đề xuất bởi: ' + g.subs.map(function (s) { return esc(nameOf(s)); }).join(', ') + '</div>' +
    (alt.length ? '<div class="card small">Cách hiểu khác của học viên: ' + alt.map(function (s) { return esc(s.it.py + ' – ' + s.it.vi) + ' (' + esc(nameOf(s)) + ')'; }).join('; ') + '</div>' : '') +
    '<div class="ff"><label>Pinyin<input id="rpy" value="' + esc(it.py) + '"></label><label>Nghĩa tiếng Việt *<input id="rvi" value="' + esc(it.vi) + '"></label>' +
    '<label>Nhãn (cách nhau dấu phẩy)<input id="rtag" value="' + esc((it.tags || []).join(', ')) + '"></label>' + exRow(0) + exRow(1) + '</div>' +
    '<div style="display:grid;gap:8px;margin-top:12px"><button class="btn block ok" id="rOk">✓ Nhận vào bảng chung</button>' +
    '<div class="row"><input id="rLy" class="grow" placeholder="Lý do không nhận (học viên sẽ thấy)"><button class="btn" id="rNo">Không nhận</button></div></div>');
  var mark = function (st, ly) {
    return seq(g.subs.filter(function (s) { return s.it.st === 'cho'; }).map(function (s) {
      return function () { var x = {}; x[w] = { st: st, ly: ly || '' }; return CL.db.doc('dexuat/' + s.uid).update({ items: x }); };
    }));
  };
  $('rOk').onclick = function () {
    var vi = clean($('rvi').value); if (!vi) return toast('Cần có nghĩa tiếng Việt.');
    var item = {
      py: clean($('rpy').value), vi: vi, at: Date.now(),
      tags: $('rtag').value.split(/[,;，]/).map(clean).filter(function (t) { return t && t !== MINE_TAG && t !== APPROVED_TAG; }),
      ex: [0, 1].map(function (k) { return { zh: clean($('rz' + k).value), py: clean($('rp' + k).value), vi: clean($('rv' + k).value) }; }).filter(function (e) { return e.zh; })
    };
    var items = Object.assign({}, CL.approved); items[w] = item;
    this.disabled = true;
    CL.db.doc('chung/duyet').set({ items: items }).then(function () { return mark('nhan'); }).then(function () { closeSheet(); toast('Đã nhận “' + w + '” vào bảng chung.'); }, function (e) { toast(dbErr(e)); });
  };
  $('rNo').onclick = function () {
    this.disabled = true;
    mark('tuchoi', clean($('rLy').value)).then(function () { closeSheet(); toast('Đã từ chối “' + w + '”.'); }, function (e) { toast(dbErr(e)); });
  };
}
