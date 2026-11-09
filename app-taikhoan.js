/* Dang nhap tai khoan rieng (Firebase) tren link GitHub: moi hoc vien dang nhap bang email/mat khau hoac Google,
   tien do, tu cua toi, ghi chu va so tay loi sai luu theo tai khoan (Firestore: users/<uid>), dung duoc tren moi may.
   Chua dien FB_CONFIG, hoac mo trong trang Claude (da co tai khoan claude.ai): app chay nhu cu, luu tren may. */
'use strict';

// Dan cau hinh tu Firebase console (Project settings → Your apps → Web app → firebaseConfig) vao day:
var FB_CONFIG = {
  apiKey: 'AIzaSyACVU79nAAagLNGiAUSPG6JkT4DAwL4TMA',
  authDomain: 'chinese30-nanh.firebaseapp.com',
  projectId: 'chinese30-nanh',
  storageBucket: 'chinese30-nanh.firebasestorage.app',
  messagingSenderId: '379715692139',
  appId: '1:379715692139:web:655710a4ca94422543b32e'
};
var FB_VER = '10.12.2';
var FB = { on: false, auth: null, db: null, user: null, timer: null, ready: false };
var UID_KEY = 'hsk30.uid';

function fbLoad(src) {
  return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
}
function initAccount() {
  if (!FB_CONFIG || window.claude) return;
  FB.on = true; gateShow('wait');
  var base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
  fbLoad(base + 'firebase-app-compat.js').then(function () {
    return Promise.all([fbLoad(base + 'firebase-auth-compat.js'), fbLoad(base + 'firebase-firestore-compat.js')]);
  }).then(function () {
    firebase.initializeApp(FB_CONFIG);
    FB.auth = firebase.auth(); FB.auth.languageCode = 'vi'; FB.db = firebase.firestore();
    FB.auth.onAuthStateChanged(onUser);
  }).catch(function () { gateShow('offline'); });
}

// ---------- Man hinh dang nhap ----------
function gateShow(mode, msg) {
  var g = $('authGate');
  if (!g) { g = document.createElement('div'); g.id = 'authGate'; g.className = 'auth-gate'; document.body.appendChild(g); }
  document.body.classList.add('gated');
  var head = '<div class="auth-box"><div class="auth-logo">汉</div><h2>Đối chiếu HSK 3.0</h2>';
  if (mode === 'wait') { g.innerHTML = head + '<div class="small muted">Đang kiểm tra đăng nhập…</div></div>'; return; }
  if (mode === 'offline') { g.innerHTML = head + '<div class="small">Không tải được phần đăng nhập. Kiểm tra mạng rồi tải lại trang.</div><button class="btn block primary" style="margin-top:12px" onclick="location.reload()">Tải lại</button></div>'; return; }
  var reg = mode === 'register', forgot = mode === 'forgot';
  g.innerHTML = head + '<div class="small muted" style="margin-bottom:12px">' + (reg ? 'Tạo tài khoản để lưu tiến độ học và sổ lỗi sai trên mọi máy.' : forgot ? 'Nhập email, app sẽ gửi đường link đặt lại mật khẩu.' : 'Đăng nhập để tiếp tục học. Tiến độ được lưu theo tài khoản.') + '</div>' +
    '<form id="authForm" class="auth-form">' +
    (reg ? '<input id="auName" placeholder="Họ tên" autocomplete="name" required>' : '') +
    '<input id="auEmail" type="email" placeholder="Email" autocomplete="email" required>' +
    (forgot ? '' : '<input id="auPass" type="password" placeholder="Mật khẩu' + (reg ? ' (ít nhất 6 ký tự)' : '') + '" autocomplete="' + (reg ? 'new-password' : 'current-password') + '" required minlength="6">') +
    '<button class="btn block primary" type="submit">' + (reg ? 'Tạo tài khoản' : forgot ? 'Gửi link đặt lại mật khẩu' : 'Đăng nhập') + '</button></form>' +
    '<div class="auth-msg small" id="authMsg">' + esc(msg || '') + '</div>' +
    (forgot ? '' : '<div class="auth-or small muted">hoặc</div><button class="btn block" id="auGoogle"><b style="color:#4285f4">G</b> Đăng nhập bằng Google</button>') +
    '<div class="auth-links small">' + (reg ? '<button class="linkish" data-auth="login">Đã có tài khoản? Đăng nhập</button>' : forgot ? '<button class="linkish" data-auth="login">‹ Quay lại đăng nhập</button>' :
      '<button class="linkish" data-auth="register">Chưa có tài khoản? Đăng ký</button><button class="linkish" data-auth="forgot">Quên mật khẩu?</button>') + '</div></div>';
  g.querySelectorAll('[data-auth]').forEach(function (b) { b.onclick = function () { gateShow(b.dataset.auth); }; });
  if ($('auGoogle')) $('auGoogle').onclick = googleIn;
  $('authForm').onsubmit = function (e) {
    e.preventDefault();
    var em = $('auEmail').value.trim(), pw = $('auPass') ? $('auPass').value : '', btn = this.querySelector('button');
    btn.disabled = true; $('authMsg').textContent = '⏳ Đang xử lý…';
    var done = function () { btn.disabled = false; };
    if (forgot) return FB.auth.sendPasswordResetEmail(em).then(function () { done(); gateShow('login', 'Đã gửi link đặt lại mật khẩu tới ' + em + '. Kiểm tra cả hộp thư Spam.'); }, function (er) { done(); $('authMsg').textContent = authErr(er); });
    if (reg) {
      var nm = $('auName').value.trim();
      return FB.auth.createUserWithEmailAndPassword(em, pw).then(function (c) { if (nm) { S.name = nm; return c.user.updateProfile({ displayName: nm }); } }).then(done, function (er) { done(); $('authMsg').textContent = authErr(er); });
    }
    FB.auth.signInWithEmailAndPassword(em, pw).then(done, function (er) { done(); $('authMsg').textContent = authErr(er); });
  };
}
function gateHide() { var g = $('authGate'); if (g) g.remove(); document.body.classList.remove('gated'); }
function googleIn() {
  var p = new firebase.auth.GoogleAuthProvider();
  FB.auth.signInWithPopup(p).catch(function (er) {
    if (er && (er.code === 'auth/popup-blocked' || er.code === 'auth/operation-not-supported-in-this-environment')) return FB.auth.signInWithRedirect(p);
    if ($('authMsg')) $('authMsg').textContent = authErr(er);
  });
}
function authErr(e) {
  var c = (e && e.code) || '';
  return ({
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/user-not-found': 'Sai email hoặc mật khẩu.', 'auth/wrong-password': 'Sai email hoặc mật khẩu.', 'auth/invalid-credential': 'Sai email hoặc mật khẩu.', 'auth/invalid-login-credentials': 'Sai email hoặc mật khẩu.',
    'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy đăng nhập (hoặc bấm Quên mật khẩu).',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/too-many-requests': 'Thử sai quá nhiều lần. Đợi vài phút rồi thử lại.',
    'auth/network-request-failed': 'Không có mạng. Kiểm tra kết nối rồi thử lại.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập Google.', 'auth/cancelled-popup-request': '',
    'auth/unauthorized-domain': 'Trang này chưa được phép đăng nhập Google (giáo viên cần thêm tên miền trong Firebase).'
  })[c] || 'Không đăng nhập được (' + c + ').';
}

// ---------- Dong bo tien do voi tai khoan ----------
function onUser(u) {
  FB.user = u;
  if (!u) { FB.ready = false; return gateShow('login'); }
  gateShow('wait');
  var prev = ''; try { prev = localStorage.getItem(UID_KEY) || ''; } catch (e) { }
  FB.db.collection('users').doc(u.uid).get().then(function (snap) {
    var cloud = null; try { cloud = snap.exists && snap.data().data ? JSON.parse(snap.data().data) : null; } catch (e) { }
    // May nay tung dang nhap tai khoan khac: bo du lieu cu tren may truoc khi gop
    if (prev && prev !== u.uid) resetLocal();
    if (cloud) mergeState(cloud);
    if (!S.name && u.displayName) S.name = u.displayName;
    try { localStorage.setItem(UID_KEY, u.uid); } catch (e) { }
    FB.ready = true; fbSave(); fbPush(true);
    gateHide(); refreshAll();
  }, function () { gateShow('login', 'Không tải được dữ liệu tài khoản. Kiểm tra mạng rồi đăng nhập lại.'); FB.auth.signOut(); });
}
function resetLocal() { S = { name: '', known: {}, srs: {}, eb: {}, perDay: 10 }; ensureS(); }
function mergeState(c) {
  ensureS();
  Object.keys(c.known || {}).forEach(function (w) { S.known[w] = S.known[w] ? Math.min(S.known[w], c.known[w]) : c.known[w]; });
  ['srs', 'eb'].forEach(function (k) { S[k] = Object.assign({}, S[k] || {}, c[k] || {}); });
  S.mine = Object.assign({}, S.mine, c.mine || {}); S.notes = Object.assign({}, S.notes, c.notes || {});
  var E = S.err || {}, CE = c.err || {};
  Object.keys(CE).forEach(function (w) { if (!E[w] || CE[w].last >= E[w].last) E[w] = CE[w]; });
  S.err = E;
  ['name', 'perDay', 'notify', 'remind'].forEach(function (k) { if (c[k] != null && c[k] !== '') S[k] = c[k]; });
}
function refreshAll() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  applyMine(); renderChips(); renderRemind(); updateSub();
  var a = document.querySelector('#tabs button.active'); show(a ? a.dataset.view : 'search');
}
var fbSave = save;
save = function () { fbSave(); fbPush(false); };
function fbPush(now) {
  if (!FB.ready || !FB.user) return;
  clearTimeout(FB.timer);
  var go = function () {
    FB.db.collection('users').doc(FB.user.uid).set({ data: JSON.stringify(S), name: S.name || FB.user.displayName || '', email: FB.user.email || '', at: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true })
      .catch(function () { toast('Chưa lưu lên tài khoản được (mất mạng?). Tiến độ vẫn lưu trên máy và sẽ đồng bộ lại.'); });
  };
  if (now) go(); else FB.timer = setTimeout(go, 1500);
}
// Quay lai app tu tab/may khac: lay ban moi nhat tren tai khoan
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible' || !FB.ready || !FB.user) return;
  FB.db.collection('users').doc(FB.user.uid).get().then(function (snap) {
    var c = null; try { c = snap.exists ? JSON.parse(snap.data().data) : null; } catch (e) { }
    if (c) { mergeState(c); refreshAll(); }
  }, function () { });
});
window.addEventListener('pagehide', function () { if (FB.timer) { clearTimeout(FB.timer); fbPush(true); } });

// ---------- The tai khoan trong Cai dat ----------
var acMore = VIEWS.more;
VIEWS.more = function () {
  acMore();
  if (!FB.on || !FB.user) return;
  var u = FB.user;
  $('view-more').insertAdjacentHTML('afterbegin', '<div class="card"><b>👤 Tài khoản</b><div class="small" style="margin:4px 0 8px">' + esc(u.displayName || S.name || '') + ' · ' + esc(u.email || '') +
    '<div class="muted">Tiến độ, từ của tôi, ghi chú và sổ lỗi sai được lưu theo tài khoản này, dùng được trên mọi máy.</div></div><button class="btn" id="acOut">Đăng xuất</button></div>');
  $('acOut').onclick = function () {
    askConfirm('Đăng xuất khỏi tài khoản ' + (u.email || '') + '? Dữ liệu đã lưu trên tài khoản, lần sau đăng nhập sẽ có lại.', 'Đăng xuất', function () {
      clearTimeout(FB.timer); fbPush(true);
      setTimeout(function () {
        FB.ready = false; resetLocal(); try { localStorage.setItem(KEY, JSON.stringify(S)); localStorage.removeItem(UID_KEY); } catch (e) { }
        FB.auth.signOut().then(function () { location.reload(); });
      }, 400);
    });
  };
};

initAccount();
