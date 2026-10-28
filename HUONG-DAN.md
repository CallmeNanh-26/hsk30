# Hướng dẫn: Công cụ đối chiếu HSK 3.0

Danh sách từ theo **新版HSK考试大纲 (2025)**, đúng với file 词汇大纲H1-6 (cấp 1 = 300 từ, cấp 1–6 = 5.334 từ).

## Hiện trạng dữ liệu
| Phần | Đã có |
|---|---|
| Nghĩa tiếng Việt, pinyin, từ loại | Toàn bộ HSK 1–6 (5.334 từ) |
| 2 câu ví dụ + 1 câu hỏi–đáp | Đủ toàn bộ HSK 1–6 (5.334 từ) + 24 từ chuyên ngành ngoài HSK |
| Phát âm | Mọi từ và câu (giọng đọc có sẵn của điện thoại/máy tính) |
| 5 bài tập mỗi từ | Mọi từ. Từ có ví dụ: nghĩa, nghe, điền từ, sắp xếp câu (dịch), trả lời câu hỏi. Từ chưa có ví dụ: nghĩa, nghe chọn từ, pinyin, chọn chữ Hán, nghe chọn nghĩa |

## Từ của tôi, ghi chú và duyệt từ
- **Học viên – tab "Từ của tôi"**: bấm *＋ Thêm từ* (chữ Hán, pinyin, nghĩa, nhãn, 1–2 câu ví dụ). Từ tự thêm học, ôn, làm bài tập như từ hệ thống. Bấm *📤 Đề xuất* để gửi giáo viên; trạng thái hiện ⏳ chờ / ✅ đã nhận / ❌ không nhận (kèm lý do).
- **Ghi chú**: mở bất kỳ từ nào → ô *📝 Ghi chú của tôi* (tự lưu). Ghi chú chỉ người viết xem được, hiện ở mặt sau flashcard; lọc bằng chip *📝 Có ghi chú*.
- **Giáo viên – tab "Duyệt từ"** (chỉ hiện với chủ app / người có quyền sửa khi mở link Artifact): xem từ đề xuất, sửa nghĩa/pinyin/nhãn/ví dụ rồi *Nhận vào bảng chung* hoặc *Không nhận*. Từ đã nhận hiện ngay cho mọi học viên với nhãn "Bổ sung". Nút *Sao chép dòng cho bo-sung.js* để ghi vĩnh viễn vào file.
- **Nhận từ qua Zalo (cách đang dùng)**: với tài khoản Pro, học viên mở link chỉ có quyền xem nên không gửi trực tiếp được. Học viên bấm *Sao chép gửi giáo viên* → gửi Zalo → giáo viên mở tab *Duyệt từ* → *📥 Dán danh sách từ học viên* → *Đưa vào Chờ duyệt*. Từ đã có trong bảng tự bỏ qua. Từ của học viên luôn nằm trong "Từ của tôi" của họ dù chưa duyệt.

## Nhắc ôn theo đường cong lãng quên (Ebbinghaus)
- Mỗi từ đánh dấu ✓ (hoặc tự thêm) được hẹn ôn sau **20 phút → 1 giờ → 1 → 2 → 4 → 7 → 15 → 30 ngày**. "Nhớ rồi" lên mốc tiếp theo; "Chưa nhớ" lùi về mốc đầu (20 phút) hoặc 1 ngày. Qua mốc 30 ngày = đã thuộc.
- Đánh dấu hàng loạt (từ đã học từ trước): lịch ôn được rải đều trong 7 ngày.
- Đầu trang hiện băng 🔔 số từ đến hạn + nút *Ôn ngay*; tab Ôn tập có chấm đỏ. Trên máy tính có thể bật thông báo trình duyệt (Cài đặt).
- **Google Calendar**: nút *📅 Đặt nhắc hằng ngày trên Google Calendar* (Cài đặt, hoặc băng nhắc sau khi học) mở sẵn một sự kiện lặp mỗi ngày vào giờ đã chọn (mặc định 20:00), bấm Lưu là xong – chỉ làm 1 lần. Sau đó nút *Ghi vào Google Calendar* ghi danh sách từ học hôm nay vào lịch ngày mai.
- Tab Tiến độ có thẻ *Đường cong ghi nhớ*: số từ ở từng mốc và số từ quá hạn.
- Khi sửa `app.js`, `app-hoc.js` hoặc `app-tu.js`, tăng số `HSK_VERSION` trong `data/danh-sach.js` để trình duyệt tải bản mới.

## Luyện với AI (chỉ trên link Claude)
Tab Ôn tập → thẻ *✨ Luyện với AI* (hiện khi đã có từ được đánh dấu):
- **Bài tập AI**: 8 câu mới mỗi lần (chọn từ theo ngữ cảnh, chọn câu dịch đúng, chọn nghĩa, chọn câu dùng từ đúng, sắp xếp câu), từ chính các từ đã học, ưu tiên từ đến hạn ôn, có giải thích.
- **Luyện hội thoại**: AI đóng vai tổ trưởng / khách hàng / đồng nghiệp / nhân viên kho, nói câu ngắn kèm pinyin và dịch, sửa lỗi câu học viên viết.
- **Tự đặt câu – AI chấm**: chấm 1–5 sao, sửa câu, gợi ý câu tự nhiên hơn.
- Nguồn AI, app tự chọn: (1) **Claude** – khi mở link Claude và tài khoản được Claude cho phép (thường chỉ chủ app); (2) **khóa Gemini miễn phí của học viên** – chạy trên cả link GitHub và link Claude.
- **Học viên lấy khóa Gemini (1 lần, ~3 phút)**: Ôn tập → *🔑 Hướng dẫn lấy khóa AI miễn phí* (hoặc Cài đặt → Khóa AI) → mở aistudio.google.com/app/apikey → đăng nhập Gmail → *Create API key* → Copy dãy `AIza…` → dán vào app → *Lưu và kiểm tra*. Khóa chỉ lưu trên máy đó, không nằm trong mã sao lưu.
- **Không muốn tạo khóa**: mục *📋 Sao chép đề sang Claude / ChatGPT / Gemini* – sao chép đề có sẵn từ đang học, dán vào trang AI bên ngoài và làm bài trong khung chat.

## Bổ sung từ vựng
**Cách 1 – sửa file `data/bo-sung.js`** (mở bằng Notepad, lưu UTF-8). Mỗi dòng một từ:
```
tu|pinyin|cap|nhan|nghia|cau1|pinyin1|dich1|cau2|pinyin2|dich2|cau hoi|dich cau hoi|tra loi
螺丝|luósī||Công xưởng|ốc vít|请给我几个螺丝。|Qǐng gěi wǒ jǐ gè luósī.|Cho tôi vài con ốc.|...
```
- `cap`: 1–6, `7-9`, hoặc để trống (= Ngoài HSK).
- `nhan`: nhiều nhãn cách nhau dấu phẩy: `Công xưởng,Thương mại`.
- Nếu từ đã có trong HSK, dòng này sẽ bổ sung nhãn / ví dụ / sửa nghĩa cho từ đó.

**Cách 2 – Excel**: tạo bảng 14 cột như trên (dòng 1 là tiêu đề), lưu thành `data/bo-sung.csv` (CSV UTF-8). Chỉ chạy khi trang đã đưa lên web.

**Thêm nhãn chủ đề mới**: sửa `data/nhan.js`, thêm dòng `"Tên nhãn": "từ1 từ2 từ3"`.

**Thêm ví dụ cho HSK 3–6**: tạo file mới, ví dụ `data/noidung/hsk3-a.js` theo mẫu `hsk1-a.js` (dòng: `tu|nghia|cau1|py1|dich1|cau2|py2|dich2|hoi|dich hoi|tra loi`), rồi thêm tên file vào `data/danh-sach.js`.

## Ngữ pháp (sau này)
Làm tương tự: một file `data/ngu-phap/hsk1.js` mỗi dòng một điểm ngữ pháp (mẫu câu | giải thích | ví dụ | cấp), thêm tab "Ngữ pháp" đọc file đó và đối chiếu giống từ vựng.

## Đưa lên mạng cho học viên
- **Link Claude Artifact**: đã xuất bản, cần bấm *Share* trên trang để chia sẻ cho học viên.
- **Netlify Drop (miễn phí, không cần lập trình)**: vào app.netlify.com/drop, kéo cả thư mục `hsk-app` vào → nhận link dạng `xxx.netlify.app`. Khi sửa dữ liệu, kéo thả lại.
- **GitHub Pages**: đưa thư mục lên một repository, bật Pages.

## Chạy thử trên máy
```
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```
rồi mở http://localhost:8765. Sau khi sửa dữ liệu, chạy `tools\build-artifact.ps1` để tạo lại bản Artifact.

## Lưu ý
- Tiến độ của học viên lưu trên trình duyệt của chính máy đó. Đổi máy thì dùng *Cài đặt → Sao chép mã sao lưu* rồi dán ở máy mới.
- Học viên bấm *Sao chép kết quả gửi giáo viên* để gửi tiến độ qua Zalo.
