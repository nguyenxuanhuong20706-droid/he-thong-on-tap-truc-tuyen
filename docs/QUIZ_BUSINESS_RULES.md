# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ HỆ THỐNG ÔN TẬP TRỰC TUYẾN
## (QUIZ BUSINESS RULES & SPECIFICATION)

* **Mã tài liệu:** `DOC-BR-001`
* **Phiên bản:** `1.1.0`
* **Ngày cập nhật:** `27/11/2026`
* **Trạng thái:** `BUSINESS SPECIFICATION — CHƯA TRIỂN KHAI` (Single Source of Truth)
* **Đối tượng áp dụng:** Kỹ sư phần mềm, AI Assistant (Antigravity), Chuyên viên kiểm thử (QA/QC), Chuyên viên nhập liệu.

---

## BẢNG PHÂN LOẠI QUY CHUẨN NGHIỆP VỤ
Tất cả các điều khoản trong tài liệu này được gắn nhãn minh bạch:
* **`[CONFIRMED]`**: Nghiệp vụ chính thức do Chủ hệ thống (Product Owner / User) trực tiếp ban hành và chốt chuẩn. Bắt buộc tuân thủ 100%, không được tự ý biến đổi.
* **`[PROPOSED]`**: Đề xuất kỹ thuật hoặc phương án kiến trúc nhằm bảo đảm nghiệp vụ, đang chờ Chủ hệ thống phê duyệt trước khi áp dụng.
* **`[INVESTIGATION]`**: Giả thuyết kỹ thuật, hiện tượng lỗi cần điều tra bóc tách hoặc bài test hồi quy bắt buộc.

---

## MỤC LỤC
1. [Thuật ngữ và Định nghĩa](#1-thuật-ngữ-và-định-nghĩa)
2. [Triết lý Nghiệp vụ Bất biến](#2-triết-lý-nghiệp-vụ-bất-biến)
3. [Đặc tả Các Dạng Câu hỏi](#3-đặc-tả-các-dạng-câu-hỏi)
   * 3.1. [Dạng 1: SINGLE_CHOICE (Trắc nghiệm 1 ý đúng)](#31-dạng-1-single_choice-trắc-nghiệm-1-ý-đúng)
   * 3.2. [Dạng 2: MULTIPLE_CHOICE (Trắc nghiệm nhiều ý đúng)](#32-dạng-2-multiple_choice-trắc-nghiệm-nhiều-ý-đúng)
   * 3.3. [Dạng 3: TRUE_FALSE_GROUP (Nhóm nhận định Đúng/Sai)](#33-dạng-3-true_false_group-nhóm-nhận-định-đúngsai)
   * 3.4. [Dạng 4: DRAG_DROP (Kéo thả / Sắp xếp câu / Điền từ)](#34-dạng-4-drag_drop-kéo-thả--sắp-xếp-câu--điền-từ)
   * 3.5. [Dạng 5: TEXT_INPUT (Nhập đáp án trực tiếp)](#35-dạng-5-text_input-nhập-đáp-án-trực-tiếp)
   * 3.6. [Dạng 6: MULTI_COLUMN_DRAG_DROP (Kéo thả phân loại đa cột / đa khung)](#36-dạng-6-multi_column_drag_drop-kéo-thả-phân-loại-đa-cột--đa-khung)
4. [Đặc tả Đề bài Đọc hiểu (PASSAGE)](#4-đặc-tả-đề-bài-đọc-hiểu-passage)
5. [Nguyên tắc Xáo trộn & Bảo toàn Đáp án (Anti-tamper Shuffling)](#5-nguyên-tắc-xáo-trộn--bảo-toàn-đáp-án-anti-tamper-shuffling)
6. [Phân định Trách nhiệm Backend & Frontend](#6-phân-định-trách-nhiệm-backend--frontend)
7. [Vòng đời Lượt làm bài (Attempt Lifecycle)](#7-vòng-đời-lượt-làm-bài-attempt-lifecycle)
8. [Nghiệp vụ "Làm lại câu sai" (Retry Failed Questions)](#8-nghiệp-vụ-làm-lại-câu-sai-retry-failed-questions)
9. [Quy chuẩn Import Word & Quản trị Ngân hàng Câu hỏi](#9-quy-chuẩn-import-word--quản-trị-ngân-hàng-câu-hỏi)
10. [Ma trận Kiểm thử Hồi quy (25 Test Cases Bắt buộc)](#10-ma-trận-kiểm-thử-hồi-quy-25-test-cases-bắt-buộc)
11. [Tiêu chí Chặn Xuất bản (Go/No-Go Gateways)](#11-tiêu-chí-chặn-xuất-bản-gono-go-gateways)
12. [Quy định Bắt buộc Tham chiếu Tài liệu đối với Antigravity](#12-quy-định-bắt-buộc-tham-chiếu-tài-liệu-đối-với-antigravity)

---

## 1. THUẬT NGỮ VÀ ĐỊNH NGHĨA

* **Câu hỏi chính (Root Question):** Đơn vị câu hỏi độc lập được đánh số trong đề thi (ví dụ: Câu 1, Câu 2...). Dù cấu tạo bên trong có 1 phương án, nhiều phương án, 4 nhận định Đúng/Sai hay nhiều ô trống thì trong tổng điểm, Câu hỏi chính vẫn chỉ được tính là **1 đơn vị câu**.
* **Lượt làm bài (Quiz Attempt):** Một phiên làm việc của học viên cho một bài học cụ thể, được khởi tạo với một cấu trúc đề thi cố định (Snapshot).
* **Bản chụp đề thi (Attempt Snapshot):** Dữ liệu bất biến lưu trữ toàn bộ danh sách câu hỏi, các phương án đã xáo trộn và ánh xạ vị trí hiển thị riêng biệt cho lượt làm bài đó. Không thay đổi khi F5 hoặc đăng nhập lại.
* **Option ID (UUID):** Mã định danh duy nhất của phương án trả lời trong cơ sở dữ liệu, không đổi theo thời gian và không phụ thuộc vào vị trí hiển thị A/B/C/D.
* **Statement ID (UUID):** Mã định danh duy nhất của một nhận định con trong câu hỏi dạng `TRUE_FALSE_GROUP`.
* **Token ID / Blank ID:** Mã định danh của thành phần từ kéo thả và vị trí ô trống trong câu `DRAG_DROP`.
* **Display Key:** Ký tự hiển thị trực quan trước mắt học viên (A, B, C, D hoặc 1, 2, 3, 4). Đây là giá trị động phục vụ giao diện, **tuyệt đối không phải là khóa đáp án**.

---

## 2. TRIẾT LÝ NGHIỆP VỤ BẤT BIẾN

### BR-001 `[CONFIRMED]` Chấm điểm tức thời (Instant Grading)
* Hệ thống hoạt động theo quy tắc: **TRẢ LỜI → GỬI CHẤM NGAY → HIỂN THỊ ĐÚNG/SAI → KHÓA CÂU**.
* Tuyệt đối không chuyển sang mô hình "Làm toàn bài xong bấm Nộp mới chấm điểm".
* Mục đích cốt lõi: Học viên biết ngay kết quả từng câu để củng cố kiến thức tại chỗ.

### BR-002 `[CONFIRMED]` Nhị phân kết quả & Không điểm thành phần
* Mỗi câu hỏi chính chỉ có đúng 2 kết quả cuối cùng:
  * `CORRECT` (Đúng)
  * `INCORRECT` (Sai)
* **Không có điểm một phần (No Partial Credit)**: Câu chọn nhiều ý đúng, câu Đúng/Sai nhóm nhận định, câu sắp xếp kéo thả... chỉ được tính `CORRECT` khi học viên làm đúng 100% tất cả các yêu cầu con. Sai bất kỳ 1 ý con nào thì toàn bộ câu chính bị tính là `INCORRECT`.

### BR-003 `[CONFIRMED]` Đẳng thức tổng kết số câu
* Khi kết thúc hoặc nộp bài, hệ thống phải thỏa mãn công thức toán học nghiêm ngặt:
  $$\text{TOTAL} = \text{CORRECT} + \text{INCORRECT}$$
* Trong đó: Mọi câu hỏi mà học viên **chưa trả lời, bỏ trống hoặc làm dở dang** đều được tự động tính gộp vào `INCORRECT`. Không tồn tại khái niệm "câu chưa làm nằm ngoài tổng số câu".

---

## 3. ĐẶC TẢ CÁC DẠNG CÂU HỎI

### 3.1. Dạng 1: `SINGLE_CHOICE` (Trắc nghiệm 1 ý đúng)

* **Đặc điểm:** Câu hỏi có nhiều phương án lựa chọn và có **chính xác 1 phương án đúng**.
* **Quy tắc thao tác `[CONFIRMED]`:**
  1. Học viên chạm/click vào một phương án bất kỳ.
  2. Giao diện ghi nhận và gửi ngay lựa chọn lên Backend.
  3. **Không có nút "Xác nhận".**
* **Quy tắc chấm & Khóa `[CONFIRMED]`:**
  1. Backend nhận `optionId`, đối chiếu với cơ sở dữ liệu.
  2. Trả về kết quả tức thời: `isCorrect: true | false`.
  3. Khóa câu hỏi ngay lập tức: Học viên không thể bấm chọn phương án khác.
* **Quy tắc hiển thị `[CONFIRMED]`:**
  * **Nếu học viên chọn ĐÚNG:** Phương án đã chọn có viền xanh lá (`border-emerald-500`), nền xanh lá nhạt, huy hiệu chữ cái màu xanh lá.
  * **Nếu học viên chọn SAI:** 
    * Phương án học viên vừa chọn: Viền đỏ (`border-rose-500`), nền đỏ nhạt, huy hiệu chữ cái màu đỏ.
    * Phương án đúng thực tế: Tự động nổi bật với viền xanh lá, kèm nhãn chữ **"Đáp án đúng"** (nền xanh, chữ xanh đậm).
    * Các phương án còn lại mờ đi (`opacity-50`).
* **Cấm kỵ `[CONFIRMED]`:** Tuyệt đối không chấm dựa trên chữ cái A/B/C/D hay chỉ số index của mảng. Chấm duy nhất theo `Option ID`.

---

### 3.2. Dạng 2: `MULTIPLE_CHOICE` (Trắc nghiệm nhiều ý đúng)

* **Đặc điểm:** Câu hỏi có từ 2 đáp án đúng trở lên (theo tài liệu nguồn phổ biến là 2 hoặc 3 ý đúng).
* **Quy tắc thao tác `[CONFIRMED]`:**
  1. Giao diện hiển thị rõ nhãn: *"Chọn nhiều đáp án"* hoặc *"Chọn đủ X đáp án"*.
  2. Học viên click vào từng phương án để chọn.
  3. **Khi chưa chọn đủ số lượng yêu cầu:** Học viên được quyền click lại vào phương án đã chọn để bỏ chọn và đổi sang phương án khác.
  4. **Ngay khi học viên chọn đến phương án cuối cùng (đủ số lượng X):** Hệ thống **tự động gửi chấm ngay lập tức**.
  5. **Không có nút "Xác nhận".**
* **Quy tắc chấm & Độc lập thứ tự `[CONFIRMED]`:**
  * Không phụ thuộc vào thứ tự click (ví dụ: Chọn A trước C sau hoàn toàn giống C trước A sau nếu cùng tập hợp ID).
  * Backend so sánh: Tập hợp `{Option IDs học viên chọn}` phải bằng chính xác `{Option IDs đúng}`.
  * Đúng 100% các ý $\rightarrow$ `CORRECT`.
  * Sai từ 1 ý trở lên $\rightarrow$ `INCORRECT`.
* **Xử lý nộp bài khi chọn thiếu `[CONFIRMED]`:**
  * Nếu học viên mới chọn 1/2 ý mà bấm Nộp bài kết thúc lượt $\rightarrow$ Câu hỏi đó bị tính là `INCORRECT`.

---

### 3.3. Dạng 3: `TRUE_FALSE_GROUP` (Nhóm nhận định Đúng/Sai)

* **Đặc điểm:** Một câu hỏi chính bao gồm một danh sách $N$ nhận định độc lập ($N$ thường là 3 hoặc 4).
* **Cấu trúc dữ liệu từng nhận định `[PROPOSED]`:**
  * `statementId`: UUID cố định của nhận định.
  * `content`: Nội dung câu nhận định.
  * `expectedValue`: Giá trị chuẩn `TRUE` hoặc `FALSE`.
  * `answeredValue`: Giá trị học viên đã chọn (`TRUE | FALSE | null`).
  * `isCorrect`: Kết quả chấm riêng của nhận định (`boolean | null`).
* **Quy tắc tương tác & Chấm từng nhận định `[CONFIRMED]`:**
  1. Với mỗi nhận định, học viên bấm chọn "Đúng" hoặc "Sai".
  2. Hệ thống chấm ngay nhận định đó: Khóa nút Đúng/Sai của riêng dòng nhận định đó, hiển thị màu xanh/đỏ cho nhận định đó.
  3. Học viên tiếp tục trả lời các nhận định còn lại trong nhóm.
* **Quy tắc tổng hợp kết quả câu chính `[CONFIRMED]`:**
  * $\text{Tất cả } N \text{ nhận định đều ĐÚNG} \longrightarrow \text{Câu chính } \mathbf{CORRECT}$.
  * $\text{Có ít nhất 1 nhận định SAI} \longrightarrow \text{Câu chính } \mathbf{INCORRECT}$.
  * $\text{Còn nhận định chưa trả lời khi nộp bài} \longrightarrow \text{Câu chính } \mathbf{INCORRECT}$.
* **Bảo toàn số lượng câu:** Câu này chỉ đóng góp đúng **1 đơn vị** vào tổng số câu hỏi của bài thi, tuyệt đối không tính thành $N$ câu độc lập.
* **Độc lập vị trí:** Dù các dòng nhận định có bị hoán đổi vị trí hiển thị, kết quả từng dòng vẫn được bảo toàn theo `statementId`.

---

### 3.4. Dạng 4: `DRAG_DROP` (Kéo thả / Sắp xếp câu / Điền từ)

Hỗ trợ 2 biến thể nghiệp vụ:
* **Biến thể A (Điền từ vào chỗ trống):** Kéo/chạm từ ngân hàng từ vào các ô trống trong đoạn văn.
* **Biến thể B (Sắp xếp từ thành câu hoàn chỉnh):** Kéo/chạm các cụm từ phân cách bởi dấu gạch chéo `/` để tạo thành câu chuẩn.

* **Quy tắc thao tác `[CONFIRMED]`:**
  1. Hiển thị ngân hàng từ (Word Bank) ở khu vực riêng.
  2. Học viên bấm vào từ ở ngân hàng từ để đưa từ đó vào ô hiển thị phía trên.
  3. **Quy tắc bỏ chọn:** Bấm trực tiếp vào từ đã nằm trong ô để đưa từ đó trở lại ngân hàng từ.
  4. **Nghiêm cấm trên UI:**
     * **Không có nút "Đặt lại"**.
     * **Không có icon dấu `x` trên các thẻ từ đã đặt**.
* **Quy tắc tự động chấm `[CONFIRMED]`:**
  1. Khi vị trí ô trống cuối cùng được điền đủ (đã sử dụng đủ số từ quy định): Hệ thống **tự động gửi chấm ngay lập tức**.
  2. Khóa toàn bộ tương tác, không cho gỡ từ ra nữa.
* **Quy tắc hiển thị phản hồi `[CONFIRMED]`:**
  * Nếu ĐÚNG: Khung viền chuyển xanh lá.
  * Nếu SAI: 
    * Khung viền chuyển đỏ.
    * Hiển thị dòng text: `Đáp án chuẩn: [Nội dung câu hoàn chỉnh]` tại **góc trên bên phải, ngang hàng với nhãn "Câu X"**.
    * **Không dùng icon**, **không hiển thị khung giải thích bên dưới**.
* **Quy tắc đối soát dữ liệu `[PROPOSED]`:**
  * Điền từ: Ánh xạ chuẩn `blankId -> tokenId`.
  * Sắp xếp: So sánh chuỗi hoặc mảng Token ID được ghép với dãy chuẩn.
  * Nếu trong câu có 2 từ giống hệt nhau về nội dung (ví dụ hai chữ "to"): Hệ thống phải coi là tương đương nhau về giá trị, không được chấm sai vì khác Token ID.
  * Nếu câu có nhiều cách sắp xếp hợp lệ: Phải khai báo danh sách `acceptedOrders` cụ thể trong metadata, không được tự ý suy đoán.

---

### 3.5. Dạng 5: `TEXT_INPUT` (Nhập đáp án trực tiếp)

* **Đặc điểm:** Câu hỏi yêu cầu học viên tự gõ câu trả lời dạng chữ hoặc số.
* **Quy tắc thao tác `[CONFIRMED]`:**
  * **Đây là dạng câu hỏi DUY NHẤT có ô Input và nút bấm "Xác nhận".**
  * Học viên nhập text vào ô và chủ động bấm nút "Xác nhận".
* **Quy tắc phản hồi tức thì `[CONFIRMED]`:**
  1. Hệ thống gửi đáp án lên Backend chấm ngay.
  2. Khóa ô input (disable, không cho gõ thêm).
  3. Nút "Xác nhận" lập tức chuyển thành nút trạng thái:
     * Nút màu xanh lá: Chữ **"Đúng"**.
     * Nút màu đỏ: Chữ **"Sai"**.
* **Hiển thị đáp án khi sai `[CONFIRMED]`:**
  * Hiển thị dòng text: `Đáp án đúng: [Nội dung đáp án chuẩn]` tại **góc trên bên phải ngang hàng với nhãn "Câu X"**.
  * **Không dùng icon**, **bỏ hoàn toàn khung giải thích bên dưới**.
* **Quy tắc so khớp chuỗi (String Matching Policy) `[CONFIRMED]`:**
  * **Chuẩn hóa bắt buộc:** Trim khoảng trắng đầu/cuối, rút gọn khoảng trắng kép ở giữa thành 1 khoảng trắng, chuẩn hóa Unicode NFC.
  * **Nghiêm cấm tự suy đoán:**
    * Không tự ý bỏ dấu tiếng Việt (ví dụ: "ha noi" không tự nhận là "Hà Nội" trừ khi có khai báo chấp nhận).
    * Không tự ý nhận từ đồng nghĩa nếu chưa được định nghĩa.
    * Không tự sửa lỗi chính tả.
    * Không chấp nhận câu trả lời sai thành đúng.
  * **Danh sách chấp nhận (Accepted Answers):** So khớp không phân biệt hoa/thường (`case-insensitive`) với danh sách `acceptedAnswers` được lưu trữ chính thức từ file nguồn.

---

### 3.6. Dạng 6: `MULTI_COLUMN_DRAG_DROP` (Kéo thả phân loại đa cột / đa khung)

* **Đặc điểm:** 
  * Đề bài cung cấp một ngân hàng các thẻ nội dung (Draggable Items Pool) và $N$ cột/khung mục tiêu phân loại ($N \ge 2$, ví dụ: phân loại theo chức năng, phạm trù, nhóm mẫu thiết kế...).
  * Mỗi cột có thể chứa 0, 1 hoặc nhiều thẻ đáp án. Số lượng thẻ giữa các cột không nhất thiết phải bằng nhau.
  * Có thể có thẻ dư / thẻ gây nhiễu (decoy items) trong ngân hàng thẻ mà không thuộc về bất kỳ cột nào.
* **Quy tắc thao tác kéo thả (Drag & Drop Interaction) `[CONFIRMED]`:**
  1. Học viên dùng thao tác **kéo thả trực tiếp (HTML5 Drag & Drop / Touch Drag)** các thẻ từ ngân hàng thẻ phía trên vào các cột tương ứng bên dưới.
  2. Hỗ trợ thao tác linh hoạt:
     - Kéo thẻ từ ngân hàng thẻ vào cột bất kỳ.
     - Kéo chuyển thẻ trực tiếp giữa các cột với nhau.
     - Kéo thẻ từ trong cột trả ngược lại ngân hàng thẻ phía trên.
  3. **Cho phép để lại thẻ dư (Spare Items Allowance):**
     - Hệ thống KHÔNG bắt buộc học viên phải kéo hết 100% các thẻ trong ngân hàng thẻ vào các cột.
     - Học viên được toàn quyền quyết định số lượng thẻ cần xếp (ví dụ có 5 thẻ, chỉ xếp 4 thẻ vào 2 cột và để dư 1 thẻ ở ngân hàng từ).
  4. **Bắt buộc có nút "Xác nhận" (Explicit Confirmation Button):**
     - **TUYỆT ĐỐI KHÔNG tự động chấm điểm khi vừa thả thẻ cuối cùng** (để tránh chấm non hoặc tạo áp lực ép học viên phải kéo hết thẻ).
     - Chỉ khi học viên chủ động bấm nút **"Xác nhận"**, hệ thống mới ghi nhận và gửi bài làm lên máy chủ chấm điểm.
* **Quy tắc chấm điểm tức thời & Khóa tương tác `[CONFIRMED]`:**
  1. Khi bấm "Xác nhận", hệ thống gửi cấu trúc phân bổ các thẻ theo từng cột lên Backend chấm điểm ngay lập tức (tuân thủ nguyên tắc Chấm tức thời BR-001).
  2. **Khóa câu hỏi ngay lập tức:** Toàn bộ thẻ và các cột bị khóa tương tác (Read-only, không thể kéo ra/vào hay chuyển cột nữa). Nút "Xác nhận" biến mất hoặc chuyển thành trạng thái đã hoàn thành.
  3. **Nguyên tắc nhị phân BR-002:**
     - Câu hỏi chỉ được tính là $\mathbf{CORRECT}$ khi và chỉ khi: 100% các thẻ được kéo vào đúng các cột mục tiêu theo đáp án chuẩn (không nhầm cột, không thiếu thẻ bắt buộc, không kéo thừa thẻ gây nhiễu vào cột).
     - Sai từ 1 thẻ trở lên (kéo nhầm cột, thiếu thẻ của cột, hoặc đặt thẻ sai vào cột) $\longrightarrow$ Toàn bộ câu bị tính là $\mathbf{INCORRECT}$.
* **Quy chuẩn hiển thị phản hồi 2 tầng (Two-Tier Clean Feedback UX) `[CONFIRMED]`:**
  * **Tầng 1 (Khu vực bài làm của học viên):**
    - Giữ nguyên vị trí các thẻ mà học viên đã kéo vào từng cột để học viên thấy rõ bài làm thực tế của mình.
    - **Thẻ kéo ĐÚNG cột:** Hiển thị màu xanh lá (`border-emerald-500 bg-emerald-50 text-emerald-700`).
    - **Thẻ kéo SAI cột:** Hiển thị màu đỏ (`border-rose-500 bg-rose-50 text-rose-700`).
    - **Thẻ còn sót lại ở ngân hàng thẻ:** Nếu thẻ đó thực tế thuộc về một cột nào đó nhưng học viên bỏ quên, thẻ sẽ được đánh dấu viền đỏ cảnh báo.
  * **Tầng 2 (Bảng đối chiếu đáp án chuẩn bên dưới - Chỉ xuất hiện khi có SAI SÓT):**
    - **Khi học viên làm ĐÚNG 100%:** Toàn bộ thẻ ở Tầng 1 phủ màu xanh lá. **TUYỆT ĐỐI KHÔNG hiển thị thêm bảng đối chiếu bên dưới**, giữ giao diện gọn gàng, tinh tế.
    - **Khi học viên làm SAI (dù chỉ 1 thẻ):** Hệ thống tự động hiển thị thêm **một bảng chuẩn đối chiếu bên dưới** gồm đầy đủ $N$ cột tương ứng với các tiêu đề chuẩn. Bên trong mỗi cột liệt kê đầy đủ, chính xác tất cả các thẻ đáp án chuẩn thuộc về cột đó.
    - **Triết lý hiển thị sạch (Clean & Minimalist):**
      - Không sử dụng mũi tên chỉ đường chằng chịt giữa các cột.
      - Không gắn thêm nhãn chữ thừa đè lên thẻ học viên đã làm.
      - Học viên nhìn vào bảng chuẩn bên dưới là tự động nhận biết ngay thẻ mình vừa làm sai thực chất thuộc về cột nào.
* **Quy tắc Xem lại bài làm & Làm lại câu sai `[CONFIRMED]`:**
  * **Xem lại bài làm (Review Mode):** Giữ nguyên phân bổ thẻ của học viên ở Tầng 1 (xanh/đỏ). Nếu câu làm sai, hiển thị bảng chuẩn ở Tầng 2. Toàn bộ ở trạng thái Read-only.
  * **Làm lại câu sai (Retry Mode):** Làm sạch hoàn toàn (Clean Slate). Toàn bộ các thẻ được đưa trở về ngân hàng thẻ phía trên; tất cả $N$ cột rỗng hoàn toàn; ẩn bảng chuẩn đối chiếu; mở khóa tương tác kéo thả và nút "Xác nhận" để học viên thao tác lại từ đầu.

---

## 4. ĐẶC TẢ ĐỀ BÀI ĐỌC HIỂU (PASSAGE)

### BR-004 `[CONFIRMED]` Bản chất của Passage
* `PASSAGE` (Đoạn văn đọc hiểu / Bối cảnh) là **cơ chế trình bày đề bài (Presentation Layer)**, **KHÔNG PHẢI** là một dạng câu hỏi chấm điểm độc lập.
* Một đoạn văn `PASSAGE` có thể đi kèm 1 hoặc một chùm nhiều câu hỏi con (`SINGLE_CHOICE`, `FILL_BLANKS`, `DRAG_DROP`...).

### BR-005 `[CONFIRMED]` Quy chuẩn giao diện hiển thị
* **Khung chứa đoạn văn (Passage Container):**
  * Đặt trong một khung riêng biệt, có **góc bo tròn (`rounded-2xl` hoặc `rounded-3xl`)**.
  * Viền màu xám/xanh nhạt tinh tế, nền xám sáng hoặc xanh pastel nhẹ.
  * Phông chữ: **Chữ thường, độ đậm tiêu chuẩn (Regular, font-normal)**, tuyệt đối không in đậm toàn bộ đoạn văn.
* **Nội dung câu hỏi & Câu lệnh (Question Stem):**
  * Nằm bên dưới khung đoạn văn.
  * Phông chữ: **In đậm nổi bật (Bold, font-bold)**, cỡ chữ lớn hơn rõ rệt để học viên tách biệt tức thì giữa "dữ liệu đọc" và "yêu cầu làm bài".

### BR-006 `[CONFIRMED]` Bảo toàn liên kết khi xáo trộn
* Khi thực hiện xáo trộn thứ tự đề thi:
  * Nếu một Passage gắn liền với một nhóm câu hỏi: Toàn bộ nhóm câu hỏi đó phải luôn giữ nguyên liên kết với Passage. Tuyệt đối không để câu hỏi bị tách rời khỏi bài đọc hiểu tương ứng.

---

## 5. NGUYÊN TẮC XÁO TRỘN & BẢO TOÀN ĐÁP ÁN (ANTI-TAMPER SHUFFLING)

### BR-007 `[CONFIRMED]` Nguyên tắc Tối thượng
> **XÁO TRỘN KHÔNG ĐƯỢC PHÉP THAY ĐỔI ĐÁP ÁN ĐÚNG THỰC TẾ.**
* Câu hỏi có thể bị hoán đổi từ vị trí hiển thị số 1 sang số 15.
* Phương án đúng có thể bị hoán đổi từ vị trí hiển thị A sang vị trí D.
* **Nhưng nội dung đáp án đúng và ID phương án đúng tương ứng phải được bảo toàn tuyệt đối 100%.**
* Nhãn A, B, C, D và số thứ tự Câu 1, Câu 2... chỉ là nhãn hiển thị trực quan (Visual Labels). **Tuyệt đối cấm sử dụng chúng làm khóa chấm điểm.**

### BR-008 `[CONFIRMED]` Danh mục Hành vi Nghiêm cấm Tuyệt đối
Hệ thống nghiêm cấm mọi dòng code hoặc thuật toán có các hành vi sau:
1. Chấm điểm dựa trên số thứ tự câu trong file Word gốc.
2. Chấm điểm dựa trên vị trí thứ tự câu trong lượt làm bài hiện tại.
3. Chấm điểm dựa trên ký tự cố định `'A'`, `'B'`, `'C'`, `'D'`.
4. Chấm điểm dựa trên index (0, 1, 2, 3) của mảng sau khi xáo trộn.
5. Tách rời `Option ID` khỏi nội dung phương án khi thực hiện shuffle.
6. Sử dụng khóa đáp án của câu hỏi khác áp cho câu hiện tại.
7. Sử dụng snapshot hoặc thứ tự của lượt làm bài khác áp cho lượt hiện tại.
8. Tin tưởng hoặc dùng kết quả lưu tạm dưới Client Frontend để quyết định kết quả cuối cùng.
9. Tái tạo lại thứ tự xáo trộn ngẫu nhiên mới khi người dùng nhấn F5 tải lại trang.
10. Dùng `array index` làm React key (`key={index}`) cho danh sách câu hỏi hoặc phương án trả lời.

### BR-009 `[INVESTIGATION]` Sự cố Lịch sử: Tình huống "Trần Phú" và "Lê Hồng Phong"
* **Hiện tượng thực tế:** Trong đề ôn tập Lịch sử Đảng, tại câu hỏi *"Tổng Bí thư đầu tiên của Đảng Cộng sản Đông Dương là ai?"*, học viên chọn *"Trần Phú"* nhưng hệ thống lại chấm là SAI và báo đáp án đúng là *"Lê Hồng Phong"*.
* **Giả thuyết điều tra:**
  * Trong file nguồn: `A. Trần Phú` (đáp án đúng), `D. Lê Hồng Phong`.
  * Sau khi xáo trộn hiển thị: Phương án `"Lê Hồng Phong"` được đưa lên vị trí hiển thị A, còn `"Trần Phú"` bị đảo xuống vị trí hiển thị D.
  * Khi chấm điểm hoặc review: Hệ thống cũ đã so sánh nhầm giữa ký tự hiển thị và ký tự gốc trong CSDL (thấy cùng là ký tự 'A' hoặc 'D' nên gắn nhãn đúng nhầm vào Lê Hồng Phong).
* **Quy định bắt buộc:** Tình huống này được xác lập là **Trường hợp kiểm thử hồi quy bắt buộc (Mandatory Regression Test Case)**. Bất kỳ phiên bản nào trước khi xuất xưởng đều phải vượt qua bài kiểm tra: Hoán đổi vị trí hiển thị của Trần Phú và Lê Hồng Phong qua toàn bộ 4 vị trí A, B, C, D; chọn Trần Phú phải luôn luôn được chấm là ĐÚNG.

### BR-010 `[CONFIRMED]` Thuộc tính Bất biến Toán học (Invariance Property)
$$\forall \text{ Question } Q, \forall \text{ Permutation } \pi: \quad \text{Grade}(Q, \pi(\text{Options}), \text{Answer}) = \text{Grade}(Q, \text{Options}, \text{Answer})$$
* Với cùng một `Question ID` và cùng một nội dung câu trả lời của người dùng: Kết quả chấm điểm phải luôn là hằng số bất biến dưới mọi phép hoán vị vị trí hiển thị $\pi$.

---

## 6. PHÂN ĐỊNH TRÁCH NHIỆM BACKEND & FRONTEND

### BR-011 `[CONFIRMED]` Backend là Nguồn Chân lý Duy nhất (Source of Truth)
* **Frontend (Giao diện):**
  * Chỉ đảm nhiệm: Render giao diện, thu nhận tương tác người dùng, gửi dữ liệu chọn lên máy chủ, nhận kết quả và render trạng thái Đúng/Sai.
  * **Nghiêm cấm:** Frontend không được tự ý tính điểm, không tự ý phán quyết câu đó đúng hay sai, không được lưu trữ sẵn đáp án đúng trước khi Backend công bố.
* **Backend (Máy chủ):**
  * Xác định chính xác phiên `attemptId`, `questionId`, `userId`.
  * Kiểm tra tính hợp lệ: Phương án gửi lên có thực sự thuộc câu hỏi đó hay không.
  * Thực hiện chấm điểm dựa trên dữ liệu an toàn, ghi nhận trạng thái vào cơ sở dữ liệu.
  * Trả kết quả tức thời (`isCorrect`, `correctKeyDisplay`, `optionsReview`).
  * Khóa câu hỏi đã chấm, từ chối mọi yêu cầu ghi đè sau đó.

### BR-012 `[CONFIRMED]` Cơ chế Chống lỗi Lệch đồng bộ (Concurrency & Network Resilience)
Tài liệu quy định cách thức xử lý cho mọi tình huống mạng và tương tác bất thường:

| Tình huống ngoại lệ | Hành vi hệ thống bắt buộc |
| :--- | :--- |
| **Double Click / Bấm 2 lần liên tiếp** | Frontend vô hiệu hóa (disable) nút ngay ở mili-giây đầu tiên sau click; Backend áp dụng Idempotency: nếu câu hỏi đang chấm hoặc đã có kết quả thì trả lại kết quả cũ, không tạo thêm bản ghi. |
| **Mạng chậm / Treo Request** | Hiển thị trạng thái loading cục bộ trên câu hỏi đó; không chặn tương tác của các câu hỏi khác; tự động gửi lại (retry) với `idempotencyKey` an toàn. |
| **Request thất bại (Lỗi 500 / Network Error)** | Báo lỗi thân thiện; mở khóa câu để người dùng gửi lại câu trả lời; tuyệt đối không tự động đánh dấu là Đúng hoặc Sai. |
| **F5 khi đang trong phiên làm bài** | Hệ thống gọi API khôi phục phiên (`getActiveAttempt`): Tải lại chính xác Snapshot cũ (thứ tự câu hỏi, thứ tự phương án cũ), khôi phục câu trả lời nháp và trạng thái Đúng/Sai của các câu đã chấm. Tuyệt đối không tạo đề mới. |
| **Mở 2 Tab cùng một lượt làm** | Cả 2 tab đều trỏ chung về 1 `attemptId`. Tab nào gửi câu trả lời trước thì được ghi nhận; tab còn lại khi thao tác sẽ đồng bộ lại trạng thái từ Backend, không xảy ra xung đột. |
| **Request cũ đến sau request mới** | Backend kiểm tra phiên bản dữ liệu (`version` / `timestamp`); chỉ chấp nhận request hợp lệ đầu tiên, khóa câu hỏi ngay sau khi có phán quyết. |

---

## 7. VÒNG ĐỜI LƯỢT LÀM BÀI (ATTEMPT LIFECYCLE)

```
[KHỞI TẠO ATTEMPT] 
       │
       ▼
[TẠO SNAPSHOT CỐ ĐỊNH (Xáo trộn & Ẩn đáp án đúng)]
       │
       ▼
[LÀM BÀI & CHẤM TỨC THỜI (Từng câu một)] ◄─── (F5 / Mất mạng ── Khôi phục Snapshot)
       │
       ▼
[BẤM KẾT THÚC / NỘP BÀI]
       │
       ▼
[TỔNG HỢP: ĐÚNG + SAI = TỔNG] (Mọi câu dở dang/chưa làm được tính vào SAI)
       │
       ▼
[KHOÁ VĨNH VIỄN LƯỢT LÀM (COMPLETED)]
```

### BR-013 `[CONFIRMED]` Trạng thái Khởi tạo (Initialization)
* Khi học viên chọn bài học:
  1. Kiểm tra quyền truy cập (RBAC / Mua môn học).
  2. Lấy danh sách câu hỏi hoạt động (`isActive = true`).
  3. Áp dụng thuật toán ngẫu nhiên Fisher-Yates tạo Snapshot:
     * Hoán đổi thứ tự các câu hỏi.
     * Hoán đổi thứ tự các phương án trong từng câu (nếu câu cho phép xáo trộn).
     * Gán nhãn hiển thị trực quan $A, B, C, D...$
  4. Lưu Snapshot bất biến vào cơ sở dữ liệu (`status = IN_PROGRESS`).
  5. Trả dữ liệu về Frontend: **Bóc tách và giấu hoàn toàn trường `isCorrect`**.

### BR-014 `[CONFIRMED]` Trạng thái Đang làm bài (In-Progress)
* Chấm điểm tức thời từng câu theo tương tác của học viên.
* Lưu vết ngay vào cơ sở dữ liệu để chống mất mát dữ liệu do mất điện / đóng tab.
* Câu hỏi đã có kết quả thì khóa vĩnh viễn trong phiên đó.

### BR-015 `[CONFIRMED]` Trạng thái Kết thúc (Completion)
* Khi học viên bấm "Nộp bài" hoặc hết giờ:
  1. Toàn bộ các câu chưa làm hoặc làm dở dang lập tức được ghi nhận là `INCORRECT`.
  2. Chuyển trạng thái lượt làm bài thành `COMPLETED`.
  3. Tính toán tổng kết: `totalQuestions`, `correctCount`, `wrongCount`, `score`.
  4. Sau khi đã `COMPLETED`, kết quả của lượt làm bài là **bất biến**, không bất kỳ ai hay tiến trình ngầm nào được phép sửa đổi lại điểm số.

---

## 8. ĐẶC TẢ 3 LUỒNG SAU KHI HOÀN THÀNH BÀI THI

### 8.1. Luồng 1: XEM LẠI BÀI LÀM (REVIEW MODE) `[CONFIRMED]`
* **Kích hoạt:** Bấm nút "Xem lại bài làm" từ Bảng tổng kết kết quả hoặc từ danh sách *Lịch sử làm bài*.
* **Phạm vi hiển thị:** Hiển thị toàn bộ $N$ câu hỏi theo đúng thứ tự xáo trộn ban đầu của lượt làm chính thức.
* **Chế độ chỉ đọc (Read-only):** Toàn bộ câu hỏi, ô chọn, ô nhập và thẻ kéo thả bị khóa hoàn toàn. Không thể chỉnh sửa hoặc gửi request chấm điểm mới.
* **Quy tắc hiển thị kết quả cuối cùng:**
  * Nếu lượt làm bài **đã qua lần làm lại câu sai**: Chế độ xem lại hiển thị **kết quả cuối cùng của từng câu**, ưu tiên hiển thị câu trả lời đã được sửa trong lần làm lại.
  * Hỗ trợ đầy đủ các dạng câu hỏi:
    * `SINGLE_CHOICE`: Phương án chọn sai viền đỏ; phương án đúng viền xanh kèm nhãn "Đáp án đúng".
    * `MULTIPLE_CHOICE`: Hiển thị các phương án đã chọn và toàn bộ phương án đúng.
    * `TRUE_FALSE_GROUP`: Hiển thị rõ trạng thái Đúng/Sai của từng dòng nhận định con.
    * `DRAG_DROP`: Khung câu ghép hiển thị câu trả lời; nếu sai hiện `Đáp án chuẩn: ...` ở góc trên bên phải ngang hàng với "Câu X".
    * `TEXT_INPUT`: Ô input hiển thị text đã trả lời; nút bên cạnh mang trạng thái "Đúng" hoặc "Sai"; nếu sai hiện `Đáp án đúng: ...` ở góc trên bên phải.
    * `MULTI_COLUMN_DRAG_DROP`: Giữ nguyên các thẻ đã kéo vào cột (xanh/đỏ); nếu câu sai hiển thị bảng đối chiếu chuẩn gồm $N$ cột bên dưới; không icon rườm rà.
    * `PASSAGE`: Giữ nguyên khung đề bo góc tròn bên trên, câu hỏi in đậm bên dưới.
* **Bảo toàn:** Tuyệt đối không tạo lượt làm mới khi học viên chỉ vào xem lại bài làm.

---

### 8.2. Luồng 2: LÀM LẠI CÂU SAI (RETRY FAILED QUESTIONS) `[CONFIRMED]`
* **Điều kiện xuất hiện:**
  * Chỉ xuất hiện khi lượt làm bài có ít nhất 1 câu bị tính là SAI ($\text{Wrong Count} + \text{Unanswered Count} > 0$).
  * Lượt làm bài đó **chưa từng sử dụng quyền làm lại câu sai** (`hasRetriedWrong == false`).
  * Nếu đã đạt điểm tuyệt đối 100%: Ẩn hoàn toàn nút này.
* **Phạm vi câu hỏi tải ra:**
  * Bao gồm toàn bộ câu trả lời sai và câu bỏ trống chưa làm của lượt chính thức.
  * Với câu `TRUE_FALSE_GROUP`: Nếu sai dù chỉ 1 nhận định con thì toàn bộ câu chính đó được đưa vào danh sách làm lại.
  * **Ẩn hoàn toàn 100% các câu đã làm đúng.**
  * **Đánh lại số thứ tự liên tục:** Bắt đầu từ $1, 2, \dots, K$ (với $K$ là tổng số câu sai).
* **Trạng thái làm sạch (Clean Slate):**
  * Xóa trắng toàn bộ câu trả lời, lựa chọn đã chọn ở lượt trước.
  * Ô input rỗng, các từ kéo thả trả về ngân hàng từ.
  * Ẩn toàn bộ trạng thái đúng/sai và ẩn đáp án chuẩn đã lộ ở lượt trước.
* **Cơ chế chấm:**
  * Tiếp tục áp dụng **chấm điểm tức thời** cho từng câu như lượt bình thường.
* **HỢP NHẤT VÀO MỘT LỊCH SỬ DUY NHẤT (QUY TẮC CỐT LÕI):**
  $$\mathbf{\text{1 LƯỢT LÀM CHÍNH THỨC} = \text{1 DÒNG LỊCH SỬ HIỂN THỊ DUY NHẤT}}$$
  * Lần làm lại câu sai là một phần của lượt làm chính thức đó, **tuyệt đối không tạo dòng lịch sử riêng** (không hiển thị dòng lịch sử riêng $3/5$ hay $k/K$).
  * Quy tắc hợp nhất kết quả từng câu:
    * Câu đúng ngay lần đầu $\longrightarrow$ **Giữ nguyên Đúng**.
    * Câu sai lần đầu, làm lại đúng $\longrightarrow$ **Cập nhật thành Đúng**.
    * Câu sai lần đầu, làm lại vẫn sai $\longrightarrow$ **Giữ nguyên Sai**.
    * Câu bỏ trống lần đầu, làm lại đúng $\longrightarrow$ **Cập nhật thành Đúng**.
    * Câu không được hoàn thành trong lần làm lại $\longrightarrow$ **Vẫn tính là Sai**.
  * **Cập nhật tổng kết trên toàn bộ $N$ câu của lượt chính thức:**
    * Ví dụ: Đề 30 câu, lần đầu đúng 25, sai 5. Làm lại 5 câu sai: sửa đúng 3 câu, còn 2 câu sai. 
    * Kết quả cuối cùng hiển thị trên lịch sử và modal: **28 đúng, 2 sai, tổng 30 câu** (Điểm số: $28 / 30 \times 10 = 9.33$).
  * Dữ liệu câu trả lời gốc và câu trả lời lần làm lại được lưu trữ nội bộ để phục vụ truy vết, **không xóa dữ liệu câu trả lời gốc**.
* **Kiểm soát chặt chẽ giới hạn 1 lần duy nhất:**
  * Mỗi lượt chính thức **chỉ được làm lại câu sai tối đa 1 lần**.
  * Khi nộp bài lần làm lại xong: **Ẩn hoàn toàn nút "Làm lại câu sai"**, chỉ hiển thị nút "Làm lượt mới".
  * Không thêm thông báo "Đã làm lại", không thêm nhãn trạng thái thừa, không giải thích lý do nút biến mất.
  * **Ràng buộc tại Backend:** Backend từ chối với mã lỗi `HTTP 400` nếu nhận yêu cầu retry lần thứ 2 cho cùng một lượt làm bài.

---

### 8.3. Luồng 3: LÀM LƯỢT MỚI (START NEW ATTEMPT) `[CONFIRMED]`
* **Kích hoạt:** Bấm nút "Làm lượt mới" từ Modal kết quả, Header hoặc thanh điều hướng.
* **Hành vi hệ thống:**
  1. Tạo một `Attempt ID` mới hoàn toàn độc lập trong cơ sở dữ liệu.
  2. Lấy toàn bộ 100% câu hỏi hoạt động của bài học ($N$ câu).
  3. Kích hoạt engine xáo trộn ngẫu nhiên mới: Đảo ngẫu nhiên thứ tự câu hỏi và thứ tự các phương án.
  4. Tạo bản chụp Snapshot cố định cho lượt mới.
  5. Reset toàn bộ trạng thái trả lời về rỗng.
  6. **Cấp lại quyền làm lại câu sai 1 lần** cho lượt thi mới này.
  7. Lượt làm mới khi hoàn thành sẽ tạo thành **một dòng lịch sử mới riêng biệt**, hoàn toàn độc lập và không làm ảnh hưởng đến các dòng lịch sử cũ trước đó.

---

### 8.4. Xử lý An toàn Dữ liệu & Đua lệnh (Concurrency & Resilience) `[CONFIRMED]`
* **Chống tạo 2 lượt làm lại (Idempotency):** Áp dụng database transaction có khóa dòng (`SELECT FOR UPDATE` hoặc atomic state lock). Nếu học viên nhấn đúp hoặc mở 2 tab cùng bấm "Làm lại câu sai", hệ thống chỉ tạo duy nhất 1 lượt retry và trả về cùng dữ liệu.
* **Chống hợp nhất kết quả 2 lần:** Sử dụng cờ trạng thái `hasRetriedWrong` kiểm tra nghiêm ngặt trong transaction khi nộp bài làm lại.
* **F5 khi đang làm lại câu sai:** Hệ thống khôi phục chính xác lượt làm lại đang dở (`activeRetry`), giữ nguyên danh sách $K$ câu hỏi, không làm mất tiến trình.

---

## 9. QUY CHUẨN IMPORT WORD & QUẢN TRỊ NGÂN HÀNG CÂU HỎI

### BR-020 `[CONFIRMED]` Nghiêm cấm Tự ý Suy luận Dữ liệu
* File Word chuẩn là **Nguồn dữ liệu gốc duy nhất (Primary Data Source)**.
* Parser đọc dữ liệu theo đúng định dạng được quy định:
  * Phương án đúng được đánh dấu bằng chữ màu đỏ chuẩn (`#FF0000`).
  * Câu sắp xếp có dấu gạch chéo `/` phân cách các từ.
  * Câu điền từ có các dấu chấm lửng `............` và dòng đáp án màu đỏ bên dưới.
* **Nghiêm cấm tuyệt đối:**
  * Không tự động ghép nối các phương án độc lập thành câu hỏi mới.
  * Không tự động bịa thêm phương án nhiễu nếu đề không có.
  * Không tự ý thay đổi câu chữ, nội dung câu hỏi trong file Word.
  * Nếu phát hiện định dạng bị mâu thuẫn, thiếu đáp án đỏ, hoặc dính dòng: Parser phải dừng lại, xuất cảnh báo lỗi rõ ràng để con người can thiệp, không được "đoán mò".

### BR-021 `[PROPOSED]` Quy trình Kiểm định 7 Bước trước khi Xuất bản (Staging Pipeline)
Để không bao giờ xảy ra tình trạng dữ liệu lỗi lọt vào hệ thống production:
```
[1. File Word nguồn] 
         │
         ▼
[2. Trình phân tích cú pháp (Parser Engine)]
         │
         ▼
[3. Bảng Dữ liệu tạm (Staging Area)]
         │
         ▼
[4. Kiểm định tự động (Automated Validation: Đủ 4 phương án, có đúng 1 đáp án đỏ...)]
         │
         ▼
[5. Màn hình Xem trước & Duyệt (Admin Preview & Confirm)]
         │
         ▼
[6. Phê duyệt chính thức (Approval Sign-off)]
         │
         ▼
[7. Xuất bản vào Ngân hàng câu hỏi Production]
```

### BR-022 `[CONFIRMED]` Đóng băng Phiên bản Ngân hàng Câu hỏi (Question Versioning)
* Mỗi câu hỏi và bộ đề thi được quản lý theo phiên bản (`version`).
* Khi một bài học được cập nhật câu hỏi mới:
  * Các câu hỏi cũ vẫn được lưu trong kho lưu trữ để các học viên đã làm bài trước đó khi xem lại lịch sử vẫn thấy đúng đề thi và đáp án tại thời điểm họ đã thi.
  * Tuyệt đối không sửa ngầm đè lên dữ liệu lịch sử thi của quá khứ.

---

## 10. MA TRẬN KIỂM THỬ HỒI QUY (25 TEST CASES BẮT BUỘC)

Bất kỳ thay đổi nào liên quan đến logic thi cử, xáo trộn hoặc chấm điểm đều bắt buộc phải chạy và đạt **100% PASS** toàn bộ 25 test case dưới đây trước khi triển khai:

| Mã Test | Tên Test Case | Điều kiện trước & Dữ liệu đầu vào | Các bước thực hiện | Kết quả kỳ vọng | Mức độ nghiêm trọng nếu fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | SINGLE_CHOICE chấm đúng mọi vị trí hiển thị | Câu hỏi trắc nghiệm đơn, đáp án đúng là "Hà Nội". Shuffle đảo "Hà Nội" lần lượt vào vị trí A, B, C, D. | Chọn "Hà Nội" tại từng vị trí A, B, C, D qua 4 lần test. | Cả 4 lần đều nhận kết quả `isCorrect = true`, viền xanh, khóa câu. | **CRITICAL** |
| **TC-02** | SINGLE_CHOICE chấm sai và hiển thị đáp án đúng | Câu hỏi trắc nghiệm đơn, đáp án đúng là "Hà Nội". Học viên chọn "Đà Nẵng". | Học viên click chọn "Đà Nẵng". | `isCorrect = false`; ô "Đà Nẵng" viền đỏ; ô "Hà Nội" viền xanh kèm nhãn "Đáp án đúng". | **CRITICAL** |
| **TC-03** | MULTIPLE_CHOICE chọn đúng tập hợp sau shuffle | Câu hỏi có 2 đáp án đúng: ID1, ID2. Shuffle làm thay đổi vị trí hiển thị. | Click chọn ID1 rồi ID2 (hoặc ID2 rồi ID1). | Ngay khi chọn đủ 2 ý, tự động chấm `isCorrect = true`, khóa câu. | **CRITICAL** |
| **TC-04** | MULTIPLE_CHOICE chọn sai tổ hợp | Câu hỏi có 2 đáp án đúng: ID1, ID2. | Học viên chọn ID1 và ID3 (sai). | Ngay khi chọn đủ 2 ý, tự động chấm `isCorrect = false`, khóa câu. | **CRITICAL** |
| **TC-05** | MULTIPLE_CHOICE chọn thiếu khi nộp bài | Câu hỏi yêu cầu 2 đáp án. Học viên mới chọn 1 đáp án. | Học viên nhấn "Nộp bài". | Câu hỏi được tính là `INCORRECT`, cộng vào tổng số câu sai. | **HIGH** |
| **TC-06** | TRUE_FALSE_GROUP chấm riêng từng nhận định | Câu có 4 nhận định: R1, R2, R3, R4. | Bấm chọn Đúng/Sai cho từng nhận định R1, R2... | Từng nhận định phản hồi Đúng/Sai ngay lập tức và khóa riêng nhận định đó. | **HIGH** |
| **TC-07** | TRUE_FALSE_GROUP quy tắc sai 1 nhận định | Nhận định 1..3 chọn đúng, nhận định 4 chọn sai. | Hoàn thành cả 4 nhận định. | Toàn bộ câu hỏi chính bị tính là `INCORRECT`. | **CRITICAL** |
| **TC-08** | DRAG_DROP điền từ đúng sau đảo ngân hàng từ | Ngân hàng từ bị đảo vị trí. | Kéo đúng các từ vào các vị trí ô trống. | Điền ô cuối cùng $\rightarrow$ tự động chấm `isCorrect = true`, khóa tương tác. | **CRITICAL** |
| **TC-09** | DRAG_DROP sắp xếp sai và hiển thị đáp án chuẩn | Câu sắp xếp từ ngữ. Học viên xếp sai thứ tự. | Đặt từ cuối cùng vào vị trí. | `isCorrect = false`; hiện `Đáp án chuẩn: ...` ở góc trên bên phải; không icon. | **HIGH** |
| **TC-10** | TEXT_INPUT nhập đúng (chuẩn hóa khoảng trắng) | Đáp án: "Hồ Chí Minh". Input: "  hồ   chí minh  ". | Học viên gõ và nhấn nút "Xác nhận". | Backend chuẩn hóa, trả về `isCorrect = true`, nút đổi thành "Đúng" màu xanh. | **HIGH** |
| **TC-11** | TEXT_INPUT nhập sai | Đáp án: "Hà Nội". Input: "Sài Gòn". | Nhấn "Xác nhận". | Nút chuyển thành "Sai" màu đỏ; hiện `Đáp án đúng: Hà Nội` ở góc trên bên phải. | **HIGH** |
| **TC-12** | PASSAGE hiển thị chuẩn và giữ liên kết | Đoạn văn dài đi kèm câu hỏi. Shuffle đề thi. | Quan sát giao diện câu hỏi có Passage sau shuffle. | Đoạn văn nằm trong khung bo góc, chữ thường; câu hỏi in đậm bên dưới; liên kết không bị vỡ. | **MEDIUM** |
| **TC-13** | Xáo trộn không đổi kết quả (Invariant Test) | Tạo 100 lượt thi ngẫu nhiên cho cùng một tập câu hỏi. | Trả lời cùng một tập đáp án chính xác trên cả 100 lượt. | Cả 100 lượt đều đạt 100% điểm số tối đa. | **BLOCKER** |
| **TC-14** | F5 không làm đổi đề và không mất trạng thái | Đang làm đến câu 5/30, đã chấm 4 câu. | Nhấn phím F5 tải lại trình duyệt. | Khôi phục chính xác đề thi cũ, thứ tự cũ, 4 câu đã chấm vẫn giữ nguyên kết quả và bị khóa. | **BLOCKER** |
| **TC-15** | Bấm đúp liên tiếp (Double-click protection) | Mạng giả lập độ trễ 2000ms. | Click liên tiếp 5 lần vào phương án trả lời. | Chỉ duy nhất 1 request được thực thi, câu hỏi khóa an toàn, không sinh lỗi hệ thống. | **HIGH** |
| **TC-16** | Mở 2 Tab cùng một lượt làm bài | Mở 2 tab cùng URL làm bài của 1 attempt. | Trả lời câu 1 trên Tab A, chuyển sang Tab B. | Tab B đồng bộ câu 1 đã khóa, tiếp tục làm bài bình thường không bị xung đột. | **HIGH** |
| **TC-17** | Câu bỏ trống tính sai khi kết thúc | Đề 30 câu. Học viên chỉ làm 5 câu (đúng cả 5), bỏ trống 25 câu. | Nhấn nút "Nộp bài". | Kết quả: Đúng 5, Sai 25, Tổng 30. Thỏa mãn: ĐÚNG + SAI = TỔNG. | **BLOCKER** |
| **TC-18** | Làm lại câu sai chỉ lọc đúng câu sai | Lượt 1 làm sai 8 câu. | Nhấn "Làm lại câu sai". | Danh sách tải ra đúng 8 câu; đánh số thứ tự từ 1 đến 8; dữ liệu chọn được reset trắng. | **CRITICAL** |
| **TC-19** | Giới hạn 1 lần làm lại câu sai | Hoàn thành lượt làm lại câu sai. | Kiểm tra màn hình kết thúc lượt làm lại. | Chỉ hiển thị nút "Làm lượt mới"; không còn nút làm lại câu sai nữa. | **HIGH** |
| **TC-20** | Kiểm thử Hồi quy "Trần Phú / Lê Hồng Phong" | Câu hỏi Tổng Bí thư đầu tiên. Hoán đổi vị trí hiển thị Trần Phú sang D và Lê Hồng Phong sang A. | Học viên click chọn "Trần Phú". | Hệ thống khẳng định ĐÚNG; tuyệt đối không báo đúng cho Lê Hồng Phong. | **BLOCKER** |
| **TC-21** | Không để lộ đáp án trong Network Tab | Mở Chrome DevTools trước khi làm bài. Bắt các gói tin `/start`. | Kiểm tra toàn bộ payload JSON trả về của các câu hỏi. | Không chứa trường `isCorrect`, không chứa `correctKey`, không chứa `rawAnswer`. | **BLOCKER** |
| **TC-22** | Backend từ chối Option ID giả mạo | Dùng Postman gửi `optionId` của câu hỏi khác vào câu hỏi hiện tại. | Gửi request submit câu hỏi. | Backend phản hồi HTTP 400 Bad Request: "Phương án không thuộc câu hỏi này". | **CRITICAL** |
| **TC-23** | Backend từ chối sửa câu đã chấm | Câu hỏi đã được Backend chấm và khóa. | Dùng API gửi đáp án mới đè lên câu hỏi đó. | Backend từ chối và giữ nguyên kết quả đã khóa trước đó. | **CRITICAL** |
| **TC-24** | Đẳng thức bảo toàn tổng số câu | Kiểm tra mọi lượt làm bài đã hoàn thành trong hệ thống. | Truy vấn Database so sánh: `correctCount + wrongCount` với `totalQuestions`. | 100% các bản ghi đều có tổng khớp hoàn hảo, không lệch dù chỉ 1 câu. | **BLOCKER** |
| **TC-25** | MULTI_COLUMN_DRAG_DROP phân loại đa cột và đối chiếu chuẩn | Câu hỏi phân loại vào 2 cột. Kéo 4 thẻ vào 2 cột (3 thẻ đúng, 1 thẻ sai cột). | Bấm nút "Xác nhận". | Hệ thống khóa tương tác; 3 thẻ đúng viền xanh, 1 thẻ sai viền đỏ; hiển thị bảng đối chiếu chuẩn 2 cột bên dưới với các thẻ đúng vị trí; tính `INCORRECT`. | **CRITICAL** |

---

## 11. TIÊU CHÍ CHẶN XUẤT BẢN (GO/NO-GO GATEWAYS)

Hệ thống **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP DEPLOY HOẶC XUẤT BẢN** nếu vi phạm bất kỳ một trong các điều kiện sau:
1. Có bất kỳ 1 test case nào thuộc mức **BLOCKER** hoặc **CRITICAL** bị FAIL trong ma trận kiểm thử.
2. Có hiện tượng đáp án đúng bị nhảy sang phương án khác sau khi xáo trộn (tái diễn lỗi Trần Phú / Lê Hồng Phong).
3. Payload API trả về phía client bị lộ đáp án đúng trước khi học viên nộp câu trả lời.
4. Có câu hỏi bị thiếu đáp án đúng trong quá trình Import file Word.
5. Tổng số câu kết quả không bằng $\text{Đúng} + \text{Sai}$.

---

## 12. QUY ĐỊNH BẮT BUỘC THAM CHIẾU TÀI LIỆU ĐỐI VỚI ANTIGRAVITY

### BR-023 `[CONFIRMED]` Bắt buộc Đọc trước khi Hành động
Trước bất kỳ phiên làm việc nào có can thiệp đến:
* Tạo mới hoặc chỉnh sửa 5 dạng câu hỏi.
* Sửa đổi thuật toán chấm điểm và phản hồi tức thời.
* Sửa đổi thuật toán xáo trộn đề thi (Shuffle Engine).
* Sửa đổi trình phân tích file Word (Parser).
* Nhập liệu hoặc cập nhật ngân hàng câu hỏi.
* Chức năng làm lại câu sai và lưu lịch sử bài thi.

👉 **Antigravity BẮT BUỘC phải đọc toàn bộ nội dung tài liệu `docs/QUIZ_BUSINESS_RULES.md` này trước khi đề xuất giải pháp hoặc viết code.**

### BR-024 `[CONFIRMED]` Quy trình Xử lý khi có Yêu cầu Mâu thuẫn
Nếu trong tương lai, người dùng đưa ra một yêu cầu mới có dấu hiệu xung đột với tài liệu này:
1. **Dừng lại ngay**, chỉ rõ điều khoản đang mâu thuẫn trong tài liệu (ví dụ: BR-001 hay BR-007).
2. **Hỏi rõ Chủ hệ thống** để xác nhận có muốn thay đổi nghiệp vụ chính thức hay không.
3. Khi và chỉ khi Chủ hệ thống đồng ý cập nhật nghiệp vụ: Cập nhật tài liệu này lên phiên bản mới trước, sau đó mới được triển khai code.
4. **Tuyệt đối không tự ý "lách" quy tắc nghiệp vụ để code dễ dàng hơn.**

### BR-025 `[PROPOSED]` Đề xuất Tích hợp vào Quy tắc Dự án (.antigravity/rules)
* **Nội dung đề xuất:** Cấu hình một rule tự động tại thư mục `.antigravity/rules/quiz-business-rules.md` để mỗi khi mở phiên làm việc mới, Agent Antigravity tự động nạp tài liệu này vào bộ nhớ ngữ cảnh.
* **Trạng thái:** `[PROPOSED]` – Hiện tại **chưa tạo cấu hình này**, chỉ triển khai khi có lệnh đồng ý chính thức từ Chủ hệ thống.

---

## 13. CHỐT QUY CHUẨN KIẾN TRÚC & HỢP ĐỒNG DỮ LIỆU ĐÃ NGHIỆM THU (07/11/2026)

### BR-026 `[CONFIRMED]` Phạm vi Áp dụng của Quy tắc Một Đáp án Đúng
* Quy tắc **"Mỗi câu hỏi bắt buộc có đúng một đáp án đúng" CHỈ áp dụng duy nhất cho dạng `SINGLE_CHOICE`**.
* Tuyệt đối không áp đặt quy tắc này lên các dạng câu hỏi khác:
  * `MULTIPLE_CHOICE`: Validator kiểm tra số lượng đáp án đúng $\ge 2$.
  * `TRUE_FALSE_GROUP`: Validator kiểm tra đủ 4 nhận định độc lập, mỗi nhận định mang giá trị logic `TRUE` hoặc `FALSE`.
  * `DRAG_DROP` / `MATCHING`: Validator kiểm tra tính đầy đủ của ngân hàng token và mảng thứ tự hợp lệ `acceptedOrders`.
  * `TEXT_INPUT`: Validator kiểm tra danh sách `acceptedAnswers` không được rỗng, bảo đảm có ít nhất một chuỗi đáp án chuẩn.

### BR-027 `[CONFIRMED]` Bảo toàn Dấu Tiếng Việt trong Chuẩn hóa Văn bản `TEXT_INPUT`
* Khi thực hiện so khớp đáp án tự luận gõ phím (`TEXT_INPUT`):
  * **TUYỆT ĐỐI KHÔNG mặc định loại bỏ dấu tiếng Việt** (không sử dụng các thư viện chuyển đổi chuỗi có dấu thành không dấu như `unidecode` hay `removeVietnameseTones`).
  * **Quy tắc chuẩn hóa bắt buộc:**
    1. Chuẩn hóa mã hóa ký tự theo chuẩn Unicode NFC (`text.normalize('NFC')`).
    2. Cắt bỏ khoảng trắng đầu và cuối chuỗi (`trim()`).
    3. Rút gọn các khoảng trắng liên tiếp ở giữa thành 1 khoảng trắng duy nhất (`replace(/\s+/g, ' ')`).
    4. So khớp không phân biệt chữ hoa, chữ thường (`toLowerCase()`).
    5. So khớp chính xác với danh sách đáp án được chấp nhận `acceptedAnswers` đã khai báo từ nguồn đề thi.

### BR-028 `[CONFIRMED]` Hợp đồng API và Quy cách Trường `selectedKey`
* Trong hợp đồng API hiện đang vận hành (`POST /api/quiz/check-answer`):
  * **Trường `selectedKey` đối với dạng `SINGLE_CHOICE` chứa Option UUID (`Option.id`)**, **KHÔNG PHẢI** là chữ cái hiển thị $A, B, C, D$.
  * Đối với các dạng câu hỏi text (`TEXT_INPUT`, `MATCHING`), trường này chứa chuỗi nội dung do học viên nhập hoặc ghép.
  * **Không tự ý đổi tên trường `selectedKey`** trong hợp đồng API để bảo đảm tính tương thích ngược và giữ cho hệ thống client/server hiện hữu hoạt động ổn định tuyệt đối.

### BR-029 `[CONFIRMED]` Phân định Regression Test Tạm thời và Kế hoạch Test Suite Độc lập
* **Test Tạm thời (Ad-hoc Verification):**
  * Script `scratch/test_urgent_grading_fix.cjs` là công cụ kiểm thử nhanh trực tiếp trên cơ sở dữ liệu `ontap_db` nhằm xác thực tức thì lỗi đáp án môn Lịch sử Đảng.
  * Đây là công cụ hỗ trợ điều tra tạm thời, **không phải là bộ Regression Test chính thức của hệ thống**.
* **Kế hoạch Thiết lập Regression Test Suite Chính thức:**
  * Xây dựng bộ test độc lập trong thư mục `backend/test/` (ví dụ `single-choice.e2e-spec.ts`).
  * Cơ chế độc lập: Sử dụng runner Vitest, chạy trên schema test cô lập hoặc in-memory database mock (hoặc test database riêng `ontap_test_db`), tự động sinh dữ liệu seed giả lập và dọn sạch sau khi test hoàn tất.
  * Tuyệt đối không để bài test phụ thuộc vào hoặc làm biến đổi dữ liệu thực tế đang phục vụ học viên trên cơ sở dữ liệu sản xuất.

### BR-030 `[CONFIRMED]` Tình trạng Nghiệm thu của 4 Dạng Câu hỏi Còn lại
* Hệ thống **chỉ mới chính thức nghiệm thu dạng `SINGLE_CHOICE`** với bộ đề kiểm thử tham chiếu là môn Lịch sử Đảng (147 câu hỏi).
* Bốn dạng câu hỏi còn lại:
  1. `MULTIPLE_CHOICE`
  2. `TRUE_FALSE_GROUP`
  3. `DRAG_DROP`
  4. `TEXT_INPUT`
  Đang ở trạng thái **CHỜ KIỂM THỬ THỰC TẾ (PENDING REAL-WORLD VERIFICATION)**. Nghiêm cấm tuyên bố các dạng này đã hoàn thiện khi chưa có dữ liệu đề thi thực tế và chưa vượt qua bộ kiểm thử hồi quy tương ứng.

### BR-031 `[CONFIRMED]` Nguyên tắc Bất biến khi Mở rộng Môn học Mới
* Khi nạp thêm bất kỳ môn học mới nào trong tương lai (ví dụ: Triết học Mác - Lênin, Tư tưởng Hồ Chí Minh...):
  * Bắt buộc tái sử dụng 100% hệ thống quiz, randomizer, chấm điểm theo Option UUID, lưu nháp, F5 resume, nộp bài, làm lại câu sai và hợp nhất lịch sử đã nghiệm thu.
  * Tuyệt đối không tạo cơ chế làm bài hay luồng chấm điểm riêng biệt cho từng môn học.
  * Dữ liệu đề thi của mọi môn học mới phải được chuẩn hóa để thích ứng với hệ thống hiện tại, không được làm thay đổi hoặc phá vỡ các quy tắc nghiệp vụ `SINGLE_CHOICE` đã đóng băng.

### BR-032 `[CONFIRMED]` Quy chuẩn Nghiệp vụ Kéo thả Phân loại Đa cột (`MULTI_COLUMN_DRAG_DROP`)
* Dạng câu hỏi phân loại đa cột/khung mục tiêu ($N \ge 2$) tuân thủ nghiêm ngặt 4 nguyên tắc cốt lõi:
  1. **Nút "Xác nhận" bắt buộc:** Tuyệt đối không tự động chấm khi thả thẻ cuối cùng; người dùng chủ động bấm "Xác nhận" mới chấm điểm.
  2. **Cho phép thẻ dư / bỏ lẻ (Spare Items):** Không ép buộc học viên phải xếp hết 100% các thẻ trong ngân hàng thẻ vào cột.
  3. **Tương tác kéo thả thực thụ:** Kéo thả linh hoạt giữa ngân hàng thẻ và các cột, cũng như hoán đổi giữa các cột.
  4. **Hiển thị phản hồi 2 tầng tinh gọn (Two-Tier Clean Feedback UX):**
     - **Tầng 1 (Khu vực bài làm):** Giữ nguyên các thẻ học viên đã kéo, đổi màu xanh lá (nếu đúng cột) hoặc đỏ (nếu sai cột).
     - **Tầng 2 (Bảng chuẩn đối chiếu):** Chỉ xuất hiện khi bài làm có sai sót; hiển thị $N$ cột chuẩn với đầy đủ đáp án đúng bên dưới. Không dùng mũi tên chỉ trỏ chằng chịt, không dùng text giải thích đè lên thẻ.

### BR-033 `[CONFIRMED]` Tương thích Ngược và Quy chuẩn Metadata cho Phân loại Đa cột
* Trong cơ sở dữ liệu hiện tại, các câu hỏi phân loại đa cột thuộc môn Triết học Mác – Lênin được lưu với `questionType = 'MATCHING'`.
* Khi hệ thống phân tích câu hỏi:
  - Nếu `metadata.pairs` có các khóa `left` tạo thành $N \ge 2$ nhóm danh mục rõ rệt và các `right` tương ứng là các thẻ: Hệ thống tự động kích hoạt chế độ giao diện `MULTI_COLUMN_DRAG_DROP`.
  - Các câu hỏi sắp xếp thứ tự từ ngữ đơn hàng (môn Ngoại ngữ chuyên ngành / Anh văn 3) vẫn giữ nguyên layout một hàng tuyến tính của `MATCHING`, không bị ảnh hưởng.

---
*Tài liệu được thiết lập để bảo vệ tính toàn vẹn và chất lượng đào tạo cao nhất của Hệ thống Ôn tập Trực tuyến.*

