/* Khoa chuyen de: tieng Trung thuong mai va cong xuong (khoa -> phan -> chu de -> bai) */
'use strict';

var CD = { c: null, l: null }; // khoa dang mo va bai dang mo ([phan, chu de, bai])
var CD_ICON = {
  tm: '<svg viewBox="0 0 32 32" class="cd-ic"><rect class="f2" x="3" y="5" width="26" height="22" rx="2.5"/><path d="M3 12.5h26M8.5 5v22M16 5v22M23.5 5v22"/><circle class="fs" cx="8.5" cy="8.6" r="1.9"/><circle class="fi" cx="16" cy="17" r="1.9"/><circle class="fi" cx="16" cy="21.4" r="1.9"/><circle class="f1" cx="23.5" cy="8.6" r="1.9"/><circle class="fs" cx="8.5" cy="17" r="1.9"/><circle class="f1" cx="23.5" cy="17" r="1.9"/><circle class="f1" cx="23.5" cy="21.4" r="1.9"/></svg>',
  cx: '<svg viewBox="0 0 32 32" class="cd-ic"><path class="f2" d="M3 28V15l7 4v-4l7 4v-4l7 4V6h5v22z"/><path d="M2 28h28M24 10h5"/><path class="fs" d="M24.5 6h4v3h-4z"/><path class="fi" d="M6 22h3v3H6zM13 22h3v3h-3zM20 22h3v3h-3z"/><path class="dash" d="M26.5 4q-1.5-2 .5-3.4"/></svg>'
};
function cdWords(b) { return ((b && b.tu) || '').split(/\s+/).filter(Boolean); }
function cdReady(b) { return !!(b && b.ten && b.tu); }
function cdStat(ws) {
  var has = ws.filter(function (w) { return BYW[w]; });
  return { total: has.length, known: has.filter(isKnown).length };
}
// Duyet moi bai cua mot khoa: fn(bai, [phan, chude, bai])
function cdEach(k, fn) {
  (k.phan || []).forEach(function (p, pi) { (p.chu_de || []).forEach(function (t, ti) { (t.bai || []).forEach(function (b, bi) { fn(b, [pi, ti, bi]); }); }); });
}
function cdBadge() { return '<span class="cd-badge">Đang cập nhật</span>'; }

VIEWS.chuyende = function () {
  var el = $('view-chuyende'), h = '';
  if (!window.HSK_COURSES) { el.innerHTML = '<div class="empty">Chưa có dữ liệu chuyên đề.</div>'; return; }
  var c = CD.c != null ? HSK_COURSES[CD.c] : null;
  var b = c && CD.l ? c.phan[CD.l[0]].chu_de[CD.l[1]].bai[CD.l[2]] : null;

  if (!c) {
    h += '<div class="cd-hero"><div class="cd-hero-zh">专题课程</div><div><b>Khóa chuyên đề</b><div class="small muted">Học theo tình huống thật ở nơi làm việc. Mỗi khóa chia theo chủ đề, mỗi bài một nhóm từ vựng.</div></div></div>';
    HSK_COURSES.forEach(function (k, i) {
      var all = [], n = 0, ready = 0;
      cdEach(k, function (x) { n++; if (cdReady(x)) { ready++; all = all.concat(cdWords(x)); } });
      var s = cdStat(all);
      h += '<div class="card cd-course" data-cd-c="' + i + '"><div class="cd-course-top">' + CD_ICON[k.icon] +
        '<div class="grow"><div class="cd-title">' + esc(k.ten) + '</div><div class="cd-zh">' + esc(k.zh) + '</div></div>' + cdBadge() + '</div>' +
        '<div class="small muted" style="margin:8px 0">' + esc(k.mo_ta) + '</div>' +
        '<div class="small" style="display:flex;justify-content:space-between;margin-bottom:4px"><span>' + ready + '/' + n + ' bài đã mở</span><span>' + s.known + '/' + s.total + ' từ</span></div>' +
        '<div class="bar"><span style="width:' + pct(s.known, s.total) + '%"></span></div></div>';
    });
  } else if (!b) {
    var all2 = [];
    cdEach(c, function (x) { if (cdReady(x)) all2 = all2.concat(cdWords(x)); });
    var s2 = cdStat(all2);
    h += '<button class="btn ghost cd-back" data-cd-back="top">‹ Khóa chuyên đề</button>';
    h += '<div class="card cd-head">' + CD_ICON[c.icon] + '<div class="grow"><div class="cd-title">' + esc(c.ten) + '</div><div class="cd-zh">' + esc(c.zh) + '</div>' +
      '<div class="small muted">Đã học ' + s2.known + '/' + s2.total + ' từ</div></div>' + cdBadge() + '</div>';
    h += '<div class="cd-note">🌱 Khóa đang được cập nhật, các bài mới sẽ lần lượt được mở.</div>';
    c.phan.forEach(function (p, pi) {
      h += '<div class="cd-part">' + esc(p.ten) + '</div>';
      p.chu_de.forEach(function (t, ti) {
        h += '<div class="cd-topic"><span>Chủ đề ' + (ti + 1) + '</span>' + esc(t.ten) + '</div><div class="list">' + t.bai.map(function (x, bi) {
          var ready = cdReady(x), s = cdStat(cdWords(x)), key = pi + ',' + ti + ',' + bi;
          return '<div class="item cd-lesson' + (ready ? '' : ' cd-soon') + '"' + (ready ? ' data-cd-l="' + key + '"' : '') + '>' +
            '<div class="cd-num">B' + (bi + 1) + '</div><div class="main"><div class="cd-ltitle">' + (ready ? esc(x.ten) : 'Đang cập nhật') + '</div>' +
            '<div class="small muted">' + (ready ? cdWords(x).length + ' từ · đã học ' + s.known + '/' + s.total : 'Nội dung sẽ có trong bản cập nhật') + '</div></div>' +
            (ready ? (s.total && s.known === s.total ? '<span class="cd-chip done">✓ Xong</span>' : '<span class="cd-chip">Học ngay</span>') : '<span class="cd-chip soon">Đang cập nhật</span>') + '</div>';
        }).join('') + '</div>';
      });
    });
  } else {
    var ws = cdWords(b), s3 = cdStat(ws), t3 = c.phan[CD.l[0]].chu_de[CD.l[1]];
    h += '<button class="btn ghost cd-back" data-cd-back="course">‹ ' + esc(c.ten) + '</button>';
    h += '<div class="card cd-head"><div class="cd-num big">B' + (CD.l[2] + 1) + '</div><div class="grow"><div class="small muted">' + esc(c.phan[CD.l[0]].ten) + ' · ' + esc(t3.ten) + '</div>' +
      '<div class="cd-title">' + esc(b.ten) + '</div><div class="small muted">' + ws.length + ' từ · đã học ' + s3.known + '/' + s3.total + '</div></div></div>';
    h += '<div class="cd-actions"><button class="btn primary" id="cdLearn">✓ Đánh dấu cả bài</button><button class="btn" id="cdCards">🃏 Ôn flashcard</button><button class="btn" id="cdQuiz">✍️ Luyện tập</button>' +
      (b.on_tap ? '<a class="btn cd-link" href="' + esc(b.on_tap) + '" target="_blank" rel="noopener">🔗 Ôn tập bài này ↗</a>' : '') + '</div>';
    h += '<div class="list">' + ws.map(function (w) {
      return BYW[w] ? rowHtml(BYW[w]) : '<div class="item cd-missing"><div class="main"><div><span class="hz">' + esc(w) + '</span><span class="lv">đang bổ sung</span></div><div class="mean">Nghĩa và ví dụ sẽ có trong bản cập nhật</div></div></div>';
    }).join('') + '</div>';
  }
  el.innerHTML = h;
  if (b) {
    var list = ws.filter(function (w) { return BYW[w]; });
    $('cdLearn').onclick = function () { list.forEach(function (w) { setKnown(w, true); }); updateSub(); VIEWS.chuyende(); toast('Đã đánh dấu ' + list.length + ' từ của bài.'); };
    $('cdCards').onclick = function () { if (!list.length) return; R.lv = 'all'; show('review'); startCards(list.map(function (w) { return BYW[w]; })); };
    $('cdQuiz').onclick = function () { if (list.length) startQuiz(shuffle(list).slice(0, 10), 'mix'); };
  }
};
document.addEventListener('click', function (e) {
  var v = $('view-chuyende'); if (!v || !v.contains(e.target)) return;
  var t = e.target.closest('[data-cd-c],[data-cd-l],[data-cd-back]');
  if (t) {
    if (t.dataset.cdC != null) { CD.c = +t.dataset.cdC; CD.l = null; }
    else if (t.dataset.cdL != null) CD.l = t.dataset.cdL.split(',').map(Number);
    else if (t.dataset.cdBack === 'top') { CD.c = null; CD.l = null; }
    else CD.l = null;
    VIEWS.chuyende(); window.scrollTo(0, 0); return;
  }
  var it = e.target.closest('.item[data-w]'); if (!it) return;
  var w = it.dataset.w;
  if (e.target.closest('.check')) { setKnown(w, !isKnown(w)); updateSub(); VIEWS.chuyende(); }
  else openWord(w);
});
