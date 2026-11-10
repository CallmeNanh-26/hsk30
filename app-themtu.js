/* Cong cu "+ Tu" noi o moi tab (va trong moi cua so): nhap mot hoac nhieu tu (cach nhau dau cach),
   tu da co trong kho thi goi y chon; tu moi thi AI tu dien pinyin, nghia, tu loai, trai/dong nghia, cach dung, vi du
   roi luu vao "Tu cua toi". Boi den chu Han tren man hinh roi bam "+ Tu" de tra ngay tu do. */
'use strict';

var AP = { busy: false, items: [], sel: '' };
function hanOnly(s) { return String(s || '').replace(/[^㐀-鿿]+/g, ' ').trim(); }
function apTokens(v) {
  var out = [];
  String(v || '').split(/[\s,，、;；。.!?！？]+/).forEach(function (t) { t = t.trim(); if (t && /[㐀-鿿]/.test(t) && out.indexOf(t) < 0) out.push(t); });
  return out.slice(0, 15);
}

// ---------- Nut noi + nut trong cua so ----------
document.body.insertAdjacentHTML('beforeend', '<button class="fab-add" id="fabAdd" data-addword="" aria-label="Thêm từ vựng">＋ Từ</button>' +
  '<div class="ap-wrap" id="apWrap" hidden><div class="ap-panel" role="dialog" aria-label="Thêm từ vựng"><div class="row"><b class="grow">＋ Thêm từ vựng</b><button class="close" id="apClose" aria-label="Đóng">×</button></div>' +
  '<div class="small muted" style="margin:4px 0 8px">Nhập chữ Hán, nhiều từ cách nhau bằng dấu cách. Mẹo: bôi đen một từ trên màn hình rồi bấm “＋ Từ” để tra ngay.</div>' +
  '<div class="row"><input id="apIn" class="grow" placeholder="Ví dụ: 急剧 积极 补救" autocomplete="off"><button class="btn primary" id="apGo">Tra từ</button></div>' +
  '<div id="apOut"></div></div></div>');
var apOpenSheet = openSheet;
openSheet = function (html) { apOpenSheet(html); $('sheet').querySelector('.close').insertAdjacentHTML('afterend', '<button class="sheet-add" data-addword="" aria-label="Thêm từ vựng">＋ Từ</button>'); };
// Nho chu dang boi den truoc khi bam (bam vao nut lam mat vung chon)
['mousedown', 'touchstart'].forEach(function (ev) {
  document.addEventListener(ev, function (e) { if (e.target.closest('[data-addword]')) AP.sel = hanOnly(String(window.getSelection ? window.getSelection() : '')); }, true);
});
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-addword]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  addWordOpen(b.dataset.addword || AP.sel || ''); AP.sel = '';
}, true);
function addWordOpen(pre) {
  $('apWrap').hidden = false; document.body.classList.add('ap-open');
  var inp = $('apIn'); if (pre) inp.value = pre;
  if (pre) apLookup(); else { $('apOut').innerHTML = ''; setTimeout(function () { inp.focus(); }, 50); }
}
function apClose() { $('apWrap').hidden = true; document.body.classList.remove('ap-open'); }
$('apClose').onclick = apClose;
$('apWrap').addEventListener('click', function (e) { if (e.target === this) apClose(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('apWrap').hidden) { e.stopImmediatePropagation(); apClose(); } }, true);
$('apGo').onclick = function () { apLookup(); };
$('apIn').onkeydown = function (e) { if (e.key === 'Enter' && !e.isComposing) apLookup(); };

// ---------- Tra tu ----------
function apSimilar(t) {
  return WORDS.filter(function (o) { return o.w !== t && o.w.length > 1 && (o.w.indexOf(t) >= 0 || (t.length > 1 && t.indexOf(o.w) >= 0)); })
    .sort(function (a, b) { return (a.w.length - t.length) - (b.w.length - t.length); }).slice(0, 5);
}
function apLookup() {
  var ts = apTokens($('apIn').value), out = $('apOut');
  if (!ts.length) { out.innerHTML = '<div class="small muted" style="margin-top:8px">Hãy nhập chữ Hán (tiếng Trung).</div>'; return; }
  var have = ts.filter(function (t) { return BYW[t]; }), fresh = ts.filter(function (t) { return !BYW[t]; });
  var h = '';
  if (have.length) h += '<div class="ap-sec">Đã có trong kho từ</div>' + have.map(function (t) {
    var o = BYW[t];
    return '<div class="ap-card ap-have"><div class="row"><span class="grow"><span class="zh ap-w">' + esc(t) + '</span> <span class="py">' + esc(o.py) + '</span> <span class="small muted">' + esc(o.mine ? 'Từ của tôi' : lvName(o.lv)) + '</span><div class="small">' + esc(meaning(o)) + '</div></span>' +
      '<span class="ap-acts"><button class="btn" data-apopen="' + esc(t) + '">Xem</button><button class="btn' + (isKnown(t) ? ' ok' : '') + '" data-apknown="' + esc(t) + '">' + (isKnown(t) ? '✓ Đã học' : '✓ Đánh dấu học') + '</button></span></div></div>';
  }).join('');
  if (fresh.length) {
    h += '<div class="ap-sec">Từ mới</div>' + fresh.map(function (t) {
      var sim = apSimilar(t);
      return '<div class="ap-card" id="apc-' + esc(t) + '"><div><span class="zh ap-w">' + esc(t) + '</span> <span class="small muted" data-apst>' + (aiReady() ? '✨ AI đang tra…' : '') + '</span></div>' +
        (sim.length ? '<div class="small" style="margin-top:6px">Trong kho có từ gần giống, có phải bạn muốn: ' + sim.map(function (o) { return '<button class="chip" data-apswap="' + esc(t) + '|' + esc(o.w) + '">' + esc(o.w) + ' <span class="muted">' + esc(meaning(o)).slice(0, 24) + '</span></button>'; }).join(' ') + '</div>' : '') +
        '<div data-apbody></div></div>';
    }).join('');
    if (!aiReady()) h += '<div class="small" style="margin-top:8px">Chưa có AI để tự điền nghĩa. ' + (window.claude ? 'Mở link GitHub và thêm khóa AI, hoặc thêm thủ công:' : 'Thêm khóa AI (Cài đặt → Khóa AI), hoặc thêm thủ công:') + '</div>' +
      '<div class="row" style="margin-top:6px">' + fresh.map(function (t) { return '<button class="btn" data-apmanual="' + esc(t) + '">✏️ Thêm “' + esc(t) + '” thủ công</button>'; }).join('') + '</div>';
  }
  out.innerHTML = h;
  if (fresh.length && aiReady()) apAsk(fresh);
}
function apAsk(ts) {
  if (AP.busy) return; AP.busy = true; AP.items = [];
  var prompt = 'Bạn là giáo viên tiếng Trung soạn từ điển nhỏ cho học viên người Việt (trình độ HSK 3–4). ' + CONTEXT + '\n' +
    'Các từ học viên muốn thêm:\n' + ts.join('\n') + '\n\n' +
    'Với mỗi từ, nếu từ viết sai hoặc không phải từ có thật thì đặt "hople": false và ghi từ đúng có thể là trong "dung". ' +
    'Trả về DUY NHẤT JSON {"words":[{"w":"giữ nguyên như đầu vào","hople":true,"dung":"","py":"pinyin có dấu thanh","loai":"từ loại bằng tiếng Việt (danh từ, động từ, tính từ…)","vi":"nghĩa tiếng Việt ngắn gọn, nhiều nghĩa thì cách nhau bằng dấu ;","trainghia":[{"zh":"","py":"","vi":""}],"dongnghia":[{"zh":"","py":"","vi":""}],"cachdung":"cách dùng bằng tiếng Việt: kết hợp từ hay gặp (搭配), lưu ý ngữ pháp, phân biệt với từ dễ nhầm","vd":[{"zh":"câu ví dụ ngắn, tự nhiên","py":"pinyin","vi":"nghĩa"}]}]}\n' +
    'trainghia và dongnghia mỗi loại 0–2 từ (để mảng rỗng nếu không có, không bịa). vd đúng 2 câu, câu ngắn đúng ngữ pháp, ưu tiên bối cảnh công việc. Không dùng dấu | trong nội dung.';
  AI.fn.json(prompt, { modelTier: 'default', cache: false }).then(function (d) {
    AP.busy = false;
    var by = {}; ((d && d.words) || []).forEach(function (x) { if (x && x.w) by[String(x.w).trim()] = x; });
    var arr = (d && d.words) || [];
    ts.forEach(function (t, k) { apCard(t, by[t] || (arr.length === ts.length ? arr[k] : null)); });
    apSaveBar();
  }, function (e) {
    AP.busy = false;
    ts.forEach(function (t) { var c = $('apc-' + t); if (c) c.querySelector('[data-apst]').textContent = ''; });
    $('apOut').insertAdjacentHTML('beforeend', '<div class="feedback bad" style="margin-top:8px">' + esc(aiErr(e)) + ' <button class="btn" id="apRetry">↻ Thử lại</button></div>');
    $('apRetry').onclick = function () { apLookup(); };
  });
}
function apList(a) { return (a || []).filter(function (x) { return x && x.zh; }).slice(0, 2).map(function (x) { return { zh: String(x.zh), py: x.py || '', vi: x.vi || '' }; }); }
function apChips(a) { return a.map(function (x) { return '<button class="chip" data-apmore="' + esc(x.zh) + '" title="Thêm từ này">' + esc(x.zh) + ' <span class="muted">' + esc(x.py) + ' · ' + esc(x.vi) + '</span></button>'; }).join(' '); }
function apCard(t, x) {
  var c = $('apc-' + t); if (!c) return;
  var st = c.querySelector('[data-apst]'), body = c.querySelector('[data-apbody]');
  if (!x || !x.py) { st.textContent = 'AI chưa tra được từ này.'; body.innerHTML = '<button class="btn" data-apmanual="' + esc(t) + '">✏️ Thêm thủ công</button>'; return; }
  var it = { w: t, py: String(x.py), vi: String(x.vi || ''), loai: x.loai || '', tn: apList(x.trainghia), dn: apList(x.dongnghia), cd: x.cachdung || '',
    vd: (x.vd || []).filter(function (e) { return e && e.zh; }).slice(0, 2).map(function (e) { return { zh: String(e.zh), py: e.py || '', vi: e.vi || '' }; }), ok: x.hople !== false };
  AP.items.push(it);
  st.innerHTML = '<span class="py">' + esc(it.py) + '</span>' + (it.loai ? ' · ' + esc(it.loai) : '');
  body.innerHTML = (it.ok ? '' : '<div class="feedback bad small" style="margin-top:6px">⚠️ Có thể từ này viết chưa đúng.' + (x.dung ? ' Có phải bạn muốn: <button class="chip" data-apswap="' + esc(t) + '|' + esc(x.dung) + '">' + esc(x.dung) + '</button>' : '') + '</div>') +
    '<div style="margin-top:4px">' + esc(it.vi) + '</div>' +
    (it.tn.length ? '<div class="small" style="margin-top:6px">↔️ Trái nghĩa: ' + apChips(it.tn) + '</div>' : '') +
    (it.dn.length ? '<div class="small" style="margin-top:4px">≈ Đồng nghĩa: ' + apChips(it.dn) + '</div>' : '') +
    (it.cd ? '<div class="small loi-cd" style="margin-top:6px">📘 ' + esc(it.cd) + '</div>' : '') +
    it.vd.map(exHtml).join('') +
    '<label class="ck" style="margin-top:6px"><input type="checkbox" data-apck="' + esc(t) + '"' + (it.ok ? ' checked' : '') + '> Thêm từ này</label>';
}
function apSaveBar() {
  if (!AP.items.length) return;
  $('apOut').insertAdjacentHTML('beforeend', '<button class="btn block primary" id="apSave" style="margin-top:10px">💾 Lưu các từ đã chọn vào “Từ của tôi”</button>');
  $('apSave').onclick = function () {
    var picked = [].filter.call(document.querySelectorAll('[data-apck]'), function (c) { return c.checked; }).map(function (c) { return c.dataset.apck; });
    var n = 0;
    AP.items.forEach(function (it) {
      if (picked.indexOf(it.w) < 0 || BYW[it.w]) return;
      S.mine[it.w] = { py: clean(it.py), vi: clean(it.vi), tags: [], ex: it.vd.map(function (e) { return { zh: clean(e.zh), py: clean(e.py), vi: clean(e.vi) }; }), at: Date.now(),
        more: { loai: it.loai, trainghia: it.tn, dongnghia: it.dn, cachdung: it.cd } };
      n++;
    });
    if (!n) return toast('Chưa chọn từ nào.');
    applyMine(); touch(); updateSub(); renderChips();
    var a = document.querySelector('#tabs button.active'); if (a && (a.dataset.view === 'mine' || a.dataset.view === 'search')) show(a.dataset.view);
    toast('Đã thêm ' + n + ' từ vào “Từ của tôi”.'); apLookup();
  };
}
document.addEventListener('click', function (e) {
  var b;
  if ((b = e.target.closest('[data-apopen]'))) { apClose(); openWord(b.dataset.apopen); }
  else if ((b = e.target.closest('[data-apknown]'))) { var w = b.dataset.apknown; setKnown(w, !isKnown(w)); updateSub(); apLookup(); }
  else if ((b = e.target.closest('[data-apswap]'))) {
    var p = b.dataset.apswap.split('|'), ts = apTokens($('apIn').value);
    $('apIn').value = ts.map(function (t) { return t === p[0] ? p[1] : t; }).join(' '); apLookup();
  }
  else if ((b = e.target.closest('[data-apmore]'))) { var ts2 = apTokens($('apIn').value); if (ts2.indexOf(b.dataset.apmore) < 0) ts2.push(b.dataset.apmore); $('apIn').value = ts2.join(' '); apLookup(); }
  else if ((b = e.target.closest('[data-apmanual]'))) { var t = b.dataset.apmanual; apClose(); mineForm(''); if ($('fw')) { $('fw').value = t; $('fw').dispatchEvent(new Event('input')); } }
});

// ---------- Chi tiet tu cua toi: hien them cach dung, trai/dong nghia do AI soan ----------
var apOpenWord = openWord;
openWord = function (w) {
  apOpenWord(w);
  var d = S.mine && S.mine[w], m = d && d.more; if (!m) return;
  var row = function (lab, a) { return a && a.length ? '<div class="small" style="margin-top:4px">' + lab + ' ' + a.map(function (x) { return '<span class="zh">' + esc(x.zh) + '</span> <span class="muted">' + esc(x.py) + ' · ' + esc(x.vi) + '</span>'; }).join('；') + '</div>' : ''; };
  $('sheet').insertAdjacentHTML('beforeend', '<div class="card" style="margin-top:10px"><b>📘 Cách dùng' + (m.loai ? ' · ' + esc(m.loai) : '') + '</b>' +
    (m.cachdung ? '<div class="small" style="margin-top:4px">' + esc(m.cachdung) + '</div>' : '') + row('↔️ Trái nghĩa:', m.trainghia) + row('≈ Đồng nghĩa:', m.dongnghia) + '</div>');
};
