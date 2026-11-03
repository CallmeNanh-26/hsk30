/* Chuyen tu qua lai trong chi tiet tu: nut ‹ ›, phim mui ten trai/phai, vuot tren dien thoai */
'use strict';

var NAV = { list: [], i: -1 };

// Ghi lai danh sach dang xem khi bam vao mot tu trong danh sach
document.addEventListener('click', function (e) {
  var it = e.target.closest('.item[data-w]');
  if (!it || e.target.closest('.check')) return;
  var box = it.closest('.list') || it.parentNode;
  // O tab Tra tu: lay ca ket qua loc (khong chi 60 tu dang hien)
  var ws = box.id === 'results' && typeof filtered === 'function'
    ? filtered().map(function (o) { return o.w; })
    : [].map.call(box.querySelectorAll('.item[data-w]'), function (x) { return x.dataset.w; });
  NAV.list = ws.filter(function (w) { return BYW[w]; });
}, true);

function navHtml() {
  var n = NAV.list.length, i = NAV.i;
  return '<div class="wnav">' +
    '<button class="wnav-b" data-nav="-1"' + (i <= 0 ? ' disabled' : '') + ' aria-label="Từ trước">‹</button>' +
    '<span class="small muted">' + (i + 1) + ' / ' + n + '</span>' +
    '<button class="wnav-b" data-nav="1"' + (i >= n - 1 ? ' disabled' : '') + ' aria-label="Từ sau">›</button></div>';
}

var navOpenWord = openWord;
openWord = function (w) {
  navOpenWord(w);
  NAV.i = NAV.list.indexOf(w);
  if (NAV.i < 0 || NAV.list.length < 2) return;
  var head = $('sheet').querySelector('.word-head');
  if (head) head.insertAdjacentHTML('beforebegin', navHtml());
};

function navGo(d) {
  if (!$('modal').classList.contains('open')) return;
  var j = NAV.i + d;
  if (NAV.i < 0 || j < 0 || j >= NAV.list.length) return;
  openWord(NAV.list[j]);
}

document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-nav]');
  if (b) { e.stopPropagation(); navGo(+b.dataset.nav); }
});
document.addEventListener('keydown', function (e) {
  if (!$('modal').classList.contains('open')) return;
  var t = e.target.tagName;
  if (t === 'INPUT' || t === 'TEXTAREA' || e.target.isContentEditable) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); navGo(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); navGo(-1); }
  else if (e.key === 'Escape') closeSheet();
});

// Vuot ngang tren dien thoai (bo qua khi vuot doc de cuon, va khi vuot tren o tap viet)
var navTouch = null;
document.addEventListener('touchstart', function (e) {
  if (!$('modal').classList.contains('open') || !e.target.closest('#sheet') || e.target.closest('.sv-box, textarea')) { navTouch = null; return; }
  navTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
document.addEventListener('touchend', function (e) {
  if (!navTouch) return;
  var dx = e.changedTouches[0].clientX - navTouch.x, dy = e.changedTouches[0].clientY - navTouch.y;
  navTouch = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) navGo(dx < 0 ? 1 : -1);
}, { passive: true });
