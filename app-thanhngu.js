/* Thanh ngu: hien nguon goc / cau chuyen va doan hoi thoai minh hoa trong chi tiet tu (du lieu: data/thanhngu.js) */
'use strict';

function idiomHtml(w) {
  var d = (window.HSK_IDIOMS || {})[w];
  if (!d) return '';
  var h = '<h3>📜 Chuyện &amp; cách dùng thành ngữ</h3><div class="card idiom-card">';
  if (d.goc) h += '<div class="idiom-goc"><b>Nguồn gốc</b><p>' + esc(d.goc) + '</p></div>';
  if (d.meo) h += '<div class="idiom-meo"><b>Mẹo dùng</b><p>' + esc(d.meo) + '</p></div>';
  if (d.doan && d.doan.length) {
    h += '<div class="idiom-doan"><b>Đoạn hội thoại</b>' + d.doan.map(function (l) {
      return exHtml({ zh: l[0], py: l[1], vi: l[2] });
    }).join('') + '</div>';
  }
  return h + '</div>';
}

// Chen muc thanh ngu ngay sau phan cau vi du
var idiomOpenWord = openWord;
openWord = function (w) {
  idiomOpenWord(w);
  var html = idiomHtml(w); if (!html) return;
  var sh = $('sheet'), h3 = [].filter.call(sh.querySelectorAll('h3'), function (x) { return x.textContent.indexOf('Câu ví dụ') >= 0; })[0];
  var after = h3 && h3.nextElementSibling;
  if (!after) return;
  after.insertAdjacentHTML('afterend', html);
};
