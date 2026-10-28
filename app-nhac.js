/* Nhac on theo duong cong lang quen Ebbinghaus: lich on, bang nhac, thong bao, file lich .ics */
'use strict';

var MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
var STEPS = [20 * MIN, HOUR, DAY, 2 * DAY, 4 * DAY, 7 * DAY, 15 * DAY, 30 * DAY];
var STEP_NAMES = ['20 phút', '1 giờ', '1 ngày', '2 ngày', '4 ngày', '7 ngày', '15 ngày', '30 ngày'];
var MASTER = STEPS.length; // da qua moc 30 ngay
var CAL_DAYS = [1, 2, 4, 7, 15, 30];

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
    else { var nx = nextDue(); if (nx && nx.t - Date.now() < DAY) h += '<div class="remind soft">⏰ Lần ôn tiếp theo: <b>' + fmtTime(nx.t) + '</b> (' + nx.n + ' từ)</div>'; }
    var lt = Object.keys(S.known).filter(function (w) { return S.known[w] === today() && BYW[w]; }).length;
    if (lt) h += '<div class="remind soft"><div class="grow">Hôm nay bạn học <b>' + lt + '</b> từ mới. Thêm lịch ôn để điện thoại nhắc cả khi đóng app.</div><button class="btn" id="calBtn">📅 Thêm lịch ôn</button></div>';
  }
  if (el._h !== h) {
    el._h = h; el.innerHTML = h;
    if ($('remindGo')) $('remindGo').onclick = function () { R.lv = 'all'; show('review'); startCards(dueList().map(function (w) { return BYW[w]; })); };
    if ($('calBtn')) $('calBtn').onclick = saveCalendar;
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

// ---------- File lich .ics: dien thoai tu nhac khi da dong app ----------
function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
function fold(line) {
  var out = '', bytes = 0;
  Array.from(line).forEach(function (ch) {
    var b = unescape(encodeURIComponent(ch)).length;
    if (bytes + b > 73) { out += '\r\n '; bytes = 1; }
    out += ch; bytes += b;
  });
  return out;
}
function icsTime(d, utc) {
  return utc ? d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z'
    : d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
}
function saveCalendar() {
  var ws = Object.keys(S.known).filter(function (w) { return S.known[w] === today() && BYW[w]; });
  if (!ws.length) return toast('Hôm nay chưa học từ mới nào.');
  var hm = (S.remindAt || '20:00').split(':'), now = new Date(), id = Date.now();
  var list = ws.slice(0, 40).map(function (w) { var o = BYW[w]; return o.w + ' ' + o.py + ' – ' + meaning(o); }).join('\n') + (ws.length > 40 ? '\n… và ' + (ws.length - 40) + ' từ khác' : '');
  var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HSK30//Nhac on tu vung//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  CAL_DAYS.forEach(function (d, i) {
    var st = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, +hm[0], +hm[1]), en = new Date(st.getTime() + 15 * MIN);
    L.push('BEGIN:VEVENT', 'UID:hsk30-' + id + '-' + i + '@doi-chieu-hsk', 'DTSTAMP:' + icsTime(now, true), 'DTSTART:' + icsTime(st), 'DTEND:' + icsTime(en),
      'SUMMARY:' + icsEsc('Ôn ' + ws.length + ' từ tiếng Trung (lần ' + (i + 2) + ', sau ' + d + ' ngày)'),
      'DESCRIPTION:' + icsEsc(list + '\n\nMở app Đối chiếu HSK → Ôn tập.'),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Đến giờ ôn từ vựng'), 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  var name = 'lich-on-' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '.ics';
  downloadFile(name, L.map(fold).join('\r\n') + '\r\n', 'text/calendar', 'Đã lưu file lịch. Mở file để thêm vào lịch điện thoại.');
}
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
    '<div class="row small">Giờ nhắc trong lịch điện thoại: <input type="time" id="remAt" value="' + esc(S.remindAt || '20:00') + '"></div>' +
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
  $('remAt').onchange = function () { S.remindAt = this.value || '20:00'; save(); toast('Đã lưu giờ nhắc.'); };
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
