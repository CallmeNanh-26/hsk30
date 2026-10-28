/* Nhac on theo duong cong lang quen Ebbinghaus: lich on, bang nhac, thong bao, Google Calendar */
'use strict';

var MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
var STEPS = [20 * MIN, HOUR, DAY, 2 * DAY, 4 * DAY, 7 * DAY, 15 * DAY, 30 * DAY];
var STEP_NAMES = ['20 phút', '1 giờ', '1 ngày', '2 ngày', '4 ngày', '7 ngày', '15 ngày', '30 ngày'];
var MASTER = STEPS.length; // da qua moc 30 ngay

// S.eb: {tu: [k, hanOn(ms)]} – k la moc vua dung de hen lan on tiep theo
function firstStep() { return S.shortSteps === false ? 2 : 0; }
function dayStart(d) { return d * DAY + new Date().getTimezoneOffset() * MIN; }
function initNhac() {
  S.eb = S.eb || {}; if (!S.remindAt) S.remindAt = '20:00';
  // Chuyen lich on cu (theo ngay, hop Leitner) sang moc Ebbinghaus
  if (!S.ebMigrated) {
    Object.keys(S.srs || {}).forEach(function (w) {
      var s = S.srs[w]; if (!S.eb[w]) S.eb[w] = [Math.min(2 + (s[0] || 0), STEPS.length - 1), dayStart(s[1]) + 8 * HOUR];
    });
    S.ebMigrated = true; save();
  }
  lastDue = dueList().length;
  renderRemind(); setInterval(tick, 30000);
}
function ebStart(w) { var k = firstStep(); S.eb[w] = [k, Date.now() + STEPS[k]]; }
function ebDue(w) { var e = S.eb[w]; return !e || e[1] <= Date.now(); }
function ebGood(w) {
  var k = (S.eb[w] || [1])[0] + 1;
  S.eb[w] = k >= STEPS.length ? [MASTER, Date.now() + 60 * DAY] : [k, Date.now() + STEPS[k]];
  save();
}
function ebAgain(w) {
  var k = (S.eb[w] || [2])[0], nk = k <= 2 ? firstStep() : 2;
  S.eb[w] = [nk, Date.now() + STEPS[nk]]; save();
}
// Danh dau theo lo (tu da hoc tu truoc): rai lich on deu trong 7 ngay de khong don mot luc
function ebSpread(ws) { ws.forEach(function (w, i) { if (!S.eb[w]) S.eb[w] = [2, Date.now() + (1 + i % 7) * DAY]; }); }

function dueList() { return Object.keys(S.known).filter(function (w) { return BYW[w] && ebDue(w); }); }
function nextDue() {
  var ts = Object.keys(S.known).filter(function (w) { return BYW[w] && !ebDue(w); }).map(function (w) { return S.eb[w][1]; });
  if (!ts.length) return null;
  var t = Math.min.apply(null, ts);
  return { t: t, n: ts.filter(function (x) { return x - t < 10 * MIN; }).length };
}
function pad(n) { return ('0' + n).slice(-2); }
function fmtTime(t) {
  var d = new Date(t), now = new Date(), hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
  return d.toDateString() === now.toDateString() ? hm : hm + ' ngày ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
}

// ---------- Bang nhac dau trang + cham do o tab On tap ----------
var lastDue = 0;
function renderRemind() {
  var el = $('remind'); if (!el) return;
  var due = dueList(), h = '';
  if (!R.cur) {
    var fresh = due.filter(function (w) { return S.eb[w] && S.eb[w][0] <= 1; }).length;
    if (due.length) h += '<div class="remind"><div class="grow">🔔 <b>' + due.length + ' từ</b> đến hạn ôn' +
      (fresh ? ' <span class="small">(' + fresh + ' từ vừa học' + (due.length - fresh ? ', ' + (due.length - fresh) + ' từ cũ' : '') + ')</span>' : '') +
      '</div><button class="btn primary" id="remindGo">Ôn ngay</button></div>';
    else { var nx = nextDue(); if (nx) h += '<div class="remind soft"><div class="grow">⏰ Lần ôn tiếp theo: <b>' + fmtTime(nx.t) + '</b> (' + nx.n + ' từ)</div>' + gcalLink(gcalNextUrl(nx), '📅 Nhắc lúc ' + fmtTime(nx.t).slice(0, 5)) + '</div>'; }
    var lt = Object.keys(S.known).filter(function (w) { return S.known[w] === today() && BYW[w]; }).length;
    if (lt && !S.gcal) h += '<div class="remind soft"><div class="grow">Hôm nay bạn học <b>' + lt + '</b> từ mới. Đặt nhắc hằng ngày trên Google Calendar để điện thoại nhắc cả khi đóng app.</div>' + gcalLink(gcalDailyUrl(), '📅 Đặt nhắc hằng ngày') + '</div>';
  }
  if (el._h !== h) {
    el._h = h; el.innerHTML = h;
    if ($('remindGo')) $('remindGo').onclick = function () { R.lv = 'all'; show('review'); startCards(dueList().map(function (w) { return BYW[w]; })); };
  }
  var tb = document.querySelector('#tabs [data-view="review"]');
  if (tb) {
    var bd = tb.querySelector('.badge');
    if (!bd) { bd = document.createElement('span'); bd.className = 'badge'; tb.appendChild(bd); }
    bd.textContent = due.length > 99 ? '99+' : due.length; bd.style.display = due.length ? '' : 'none';
  }
}
function tick() {
  var n = dueList().length;
  if (n > lastDue) notifyDue(n);
  lastDue = n; renderRemind();
}
function notifyDue(n) {
  toast('🔔 Đến giờ ôn: ' + n + ' từ');
  if (!S.notify || !document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification('Đến giờ ôn từ vựng', { body: n + ' từ cần ôn lại để không bị quên.' }); } catch (e) { }
}
var learnedT;
function onLearned() {
  clearTimeout(learnedT);
  learnedT = setTimeout(function () {
    var k = firstStep();
    toast('Ôn lần 1 lúc ' + fmtTime(Date.now() + STEPS[k]) + ' (sau ' + STEP_NAMES[k] + ')');
    lastDue = dueList().length; renderRemind();
  }, 900);
}

// ---------- Google Calendar: mo san su kien, hoc vien chi bam Luu ----------
var APP_URL = 'https://callmenanh-26.github.io/hsk30/';
function gTime(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; }
function gcalUrl(title, start, details, daily) {
  var p = 'action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + gTime(start) + '/' + gTime(new Date(start.getTime() + 15 * MIN)) +
    '&details=' + encodeURIComponent(details);
  try { p += '&ctz=' + encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch (e) { }
  if (daily) p += '&recur=' + encodeURIComponent('RRULE:FREQ=DAILY');
  return 'https://calendar.google.com/calendar/render?' + p;
}
function remindStart(addDays) {
  var hm = (S.remindAt || '20:00').split(':'), n = new Date();
  var d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + (addDays || 0), +hm[0], +hm[1]);
  if (!addDays && d < n) d.setDate(d.getDate() + 1);
  return d;
}
// Nhac hang ngay (cai 1 lan): Google Calendar nhac mo app, app tu tinh tu nao den han
function gcalDailyUrl() {
  return gcalUrl('🔔 Ôn từ vựng tiếng Trung', remindStart(0), 'Mở app để ôn các từ đến hạn theo đường cong lãng quên:\n' + APP_URL, true);
}
// Su kien dung vao gio on that su tiep theo (theo lich Ebbinghaus cua hoc vien), kem cac tu den han luc do
function gcalNextUrl(nx) {
  var ws = Object.keys(S.known).filter(function (w) { return BYW[w] && !ebDue(w) && S.eb[w][1] - nx.t < 10 * MIN; });
  var list = ws.slice(0, 30).map(function (w) { var o = BYW[w]; return o.w + ' ' + o.py + ' – ' + meaning(o); }).join('\n') + (ws.length > 30 ? '\n… và ' + (ws.length - 30) + ' từ khác' : '');
  return gcalUrl('Ôn ' + ws.length + ' từ tiếng Trung', new Date(nx.t), list + '\n\nMở app → Ôn tập: ' + APP_URL, false);
}
function gcalLink(url, label, cls) { return '<a class="btn ' + (cls || '') + '" href="' + esc(url) + '" target="_blank" rel="noopener" data-gcal>' + label + '</a>'; }
document.addEventListener('click', function (e) { if (e.target.closest('[data-gcal]')) { S.gcal = true; save(); setTimeout(renderRemind, 500); } });
function downloadFile(name, text, type, okMsg) {
  okMsg = okMsg || 'Đã lưu file.';
  var blob = new Blob([text], { type: type + ';charset=utf-8' });
  var plain = function () {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast(okMsg);
  };
  if (!window.claude || typeof claude.use !== 'function') return plain();
  claude.use('downloads').then(function (dl) {
    if (!dl) return plain();
    return dl.save({ filename: name, data: blob }).then(function () { toast(okMsg); }, function (e) {
      if (e && e.code === 'unavailable') plain(); else toast('Chưa lưu file.');
    });
  }).catch(plain);
}

// ---------- The "Duong cong ghi nho" (tab Tien do) ----------
function curveHtml() {
  var ks = Object.keys(S.known).filter(function (w) { return BYW[w]; });
  if (!ks.length) return '';
  var names = ['Mới học (20 phút – 1 giờ)', 'Mốc 1 ngày', 'Mốc 2 ngày', 'Mốc 4 ngày', 'Mốc 7 ngày', 'Mốc 15 ngày', 'Mốc 30 ngày', 'Đã thuộc'];
  var c = [0, 0, 0, 0, 0, 0, 0, 0], late = 0;
  ks.forEach(function (w) {
    var e = S.eb[w] || [2, 0], k = e[0];
    c[k <= 1 ? 0 : Math.min(k - 1, 7)]++;
    if (e[1] < Date.now() - DAY) late++;
  });
  var mx = Math.max.apply(null, c) || 1;
  return '<h3>Đường cong ghi nhớ</h3><div class="card"><div class="small muted" style="margin-bottom:10px">Theo Ebbinghaus, sau 1 ngày không ôn ta quên khoảng 2/3 điều mới học. Mỗi lần ôn đúng hạn, từ lên mốc tiếp theo và được nhớ lâu hơn.</div>' +
    names.map(function (n, i) {
      return '<div class="cv-row"><span class="cv-n small">' + n + '</span><div class="bar grow"><span style="width:' + Math.round(c[i] * 100 / mx) + '%"></span></div><b class="cv-c">' + c[i] + '</b></div>';
    }).join('') +
    (late ? '<div class="pst no" style="margin-top:8px">⚠️ ' + late + ' từ quá hạn ôn hơn 1 ngày – dễ bị quên, hãy ôn sớm.</div>' : '') + '</div>';
}

// ---------- Cai dat nhac on (tab Cai dat) ----------
function remindSettingsHtml() {
  var h = '<div class="card"><b>🔔 Nhắc ôn theo đường cong lãng quên</b><div class="small muted" style="margin:4px 0 8px">Mỗi từ được nhắc ôn sau 20 phút, 1 giờ, 1, 2, 4, 7, 15 và 30 ngày kể từ lúc học.</div>' +
    '<div class="row small">Giờ nhắc hằng ngày: <input type="time" id="remAt" value="' + esc(S.remindAt || '20:00') + '"></div>' +
    '<div class="row small" style="margin-top:8px"><span id="gcalWrap">' + gcalLink(gcalDailyUrl(), '📅 Đặt nhắc hằng ngày trên Google Calendar', 'primary') + '</span>' +
    '<span class="muted">Bấm Lưu trong Google Calendar là xong, chỉ cần làm 1 lần.' + (S.gcal ? ' (Bạn đã đặt nhắc.)' : '') + '</span></div>' +
    '<label class="row small" style="margin-top:8px"><input type="checkbox" id="remShort"' + (S.shortSteps === false ? '' : ' checked') + '> Nhắc ôn sớm sau 20 phút và 1 giờ</label>';
  if ('Notification' in window) {
    var p = Notification.permission;
    h += '<div class="row small" style="margin-top:8px"><button class="btn" id="remNotify"' + (p === 'denied' ? ' disabled' : '') + '>' +
      (p === 'denied' ? 'Trình duyệt đang chặn thông báo' : S.notify && p === 'granted' ? '🔕 Tắt thông báo trình duyệt' : '🔔 Bật thông báo trình duyệt') + '</button>' +
      '<span class="muted">Hiện khi app đang mở ở tab khác (máy tính).</span></div>';
  }
  return h + '</div>';
}
function bindRemindSettings() {
  $('remAt').onchange = function () { S.remindAt = this.value || '20:00'; save(); $('gcalWrap').innerHTML = gcalLink(gcalDailyUrl(), '📅 Đặt nhắc hằng ngày trên Google Calendar', 'primary'); toast('Đã lưu giờ nhắc.'); };
  $('remShort').onchange = function () { S.shortSteps = this.checked; save(); };
  if ($('remNotify')) $('remNotify').onclick = function () {
    if (S.notify) { S.notify = false; save(); VIEWS.more(); return; }
    try {
      Notification.requestPermission().then(function (p) {
        S.notify = p === 'granted'; save(); VIEWS.more();
        toast(S.notify ? 'Đã bật thông báo.' : 'Trình duyệt chưa cho phép thông báo.');
      }, function () { toast('Trang này không bật được thông báo.'); });
    } catch (e) { toast('Trang này không bật được thông báo.'); }
  };
}
