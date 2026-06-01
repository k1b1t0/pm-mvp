# Money Backward — MVP Quản lý Tài chính Cá nhân

**Money Backward** là một ứng dụng quản lý tài chính cá nhân tối giản dạng Single Page Application (SPA), được thiết kế theo ngôn ngữ thiết kế của Apple và lấy cảm hứng từ ứng dụng Things 3 nổi tiếng. 

Dự án này là phiên bản sản phẩm khả dụng tối thiểu (MVP) được xây dựng hoàn toàn bằng **Vanilla HTML, CSS, và JavaScript**, không phụ thuộc vào framework hay backend phức tạp, giúp ứng dụng chạy cực nhẹ, trực quan và dễ dàng deploy lên **GitHub Pages**.

---

##  Giao diện và Phong cách Thiết kế (Apple & Things 3 Style)

Ứng dụng tuân thủ nghiêm ngặt các nguyên lý thiết kế của Apple:
* **Tối giản và Tập trung:** "Nội dung chính là giao diện". Khoảng trắng được thiết kế có ý đồ, các đường phân cách thanh mảnh, không có viền đậm hay đổ bóng quá đà.
* **Hỗ trợ Dark Mode tự động:** Tự động điều chỉnh giao diện Sáng/Tối (Light/Dark mode) theo thiết lập hệ thống của thiết bị.
* **Màu sắc Dropdown Select rõ ràng:** Khắc phục lỗi chữ bị tệp nền sáng trong Dark Mode trên Linux/Chrome bằng cách định nghĩa rõ thuộc tính màu chữ và nền cho thẻ `option`.
* **Custom Dialogs:** Toàn bộ thông báo hệ thống (Alert, Confirm) đều được tùy biến theo phong cách hộp thoại bo góc mờ đặc trưng của macOS/iOS thay vì dùng các pop-up mặc định của trình duyệt.
* **Phản hồi tương tác tinh tế:** Các hiệu ứng hover, focus trên các nút và trường nhập liệu hoạt động mượt mà, thời gian chuyển đổi tab nhanh dưới 220ms.

---

## 🌟 Các Tính năng Cốt lõi của MVP

### 1. Dashboard Tổng quan (Thống kê & Lịch sử Hợp nhất)
* **Số liệu tức thời (Widgets):** Hiển thị bốn thông số cốt lõi: Tổng thu nhập (màu xanh lá), Tổng chi tiêu (màu đỏ), Số dư khả dụng hiện tại (màu xanh dương) và Quỹ tiết kiệm hiện có (màu vàng/amber).
  * Công thức tính số dư: `Số dư hiện tại = Tổng thu nhập - Tổng chi tiêu - Tổng tiền gửi tiết kiệm`.
* **Tiến độ hạn mức chi tiêu:** Thanh tiến trình trực quan biểu thị phần trăm chi tiêu so với hạn mức tháng. Nếu chi tiêu vượt quá 100% hạn mức, thanh tiến trình sẽ chuyển sang màu đỏ và kích hoạt banner cảnh báo khẩn cấp ở đầu trang.
* **Biểu đồ kép trực quan (Dual Charts):** Tích hợp hai biểu đồ qua thư viện Chart.js hiển thị song song:
  * **Biểu đồ tròn (Doughnut Chart):** Phân rã chi phí chi tiết theo các danh mục.
  * **Biểu đồ cột (Bar Chart):** So sánh tương quan trực quan dòng tiền tháng giữa Thu nhập, Chi tiêu, và Tiết kiệm.
  * Cả hai biểu đồ đều tự động thích ứng chế độ Light/Dark mode của hệ thống cho các nhãn chữ và đường phân cách.
* **Lịch sử giao dịch gần đây (Hợp nhất):** 
  * Thay thế các bảng riêng lẻ bằng một bảng tổng hợp duy nhất tại tab Tổng quan.
  * Gom tất cả giao dịch (Thu nhập, Chi tiêu, Gửi tiết kiệm) lại, sắp xếp theo thời gian mới nhất lên đầu.
  * Hiển thị số tiền màu xanh lá cây kèm dấu `+` đối với Khoản thu nhập; số tiền màu đỏ kèm dấu `-` đối với Khoản chi tiêu; và số tiền màu đỏ kèm dấu `-` đối với Khoản gửi tiết kiệm.
  * Cột **Số dư lũy tiến** hiển thị biến động số tiền còn lại trong ví ngay sau khi mỗi giao dịch đó diễn ra.

### 2. Ghi nhận Thu nhập (Income Manager)
* **Form nhập liệu:** Hỗ trợ nhập Tên khoản thu, Nguồn thu, Số tiền (VNĐ) và Ngày nhận. Dữ liệu được ép kiểu số thực tế trước khi lưu.
* **Chính sách giữ form:** Nếu xảy ra lỗi validation dữ liệu nhập vào, hệ thống không xóa (clear) form để giúp người dùng chỉnh sửa dễ dàng hơn.

### 3. Ghi nhận Chi tiêu (Expense Manager)
* **Form nhập liệu:** Nhập Tên khoản chi, Số tiền (VNĐ), Danh mục phân loại cố định (Ăn uống, Di chuyển, Học tập & Sinh hoạt, Giải trí, Khác) và Ngày chi.
* **Chặn số dư âm:** Khi nhấn thêm khoản chi, hệ thống kiểm tra nếu số tiền lớn hơn số dư hiện có thì sẽ chặn giao dịch và báo lỗi: *"Tài khoản không đủ số dư để thực hiện giao dịch này!"*.
* **Chính sách giữ form:** Khi chặn giao dịch do thiếu số dư hoặc lỗi validation, dữ liệu form được giữ nguyên để người dùng sửa số tiền mà không phải gõ lại toàn bộ thông tin.

### 4. Mục tiêu & Trích quỹ Tiết kiệm (Savings & Profile)
* **Trích quỹ gửi tiết kiệm (Mới):** Cung cấp form cho phép người dùng gửi tiền vào quỹ tiết kiệm. 
  * Số tiền gửi sẽ bị trừ trực tiếp vào "Số dư hiện tại" ở trang tổng quan và cộng dồn vào "Khoản tiết kiệm hiện có".
  * Ghi nhận một dòng giao dịch trong lịch sử tổng hợp với nhãn: `[Tích lũy] Trích quỹ tiết kiệm tháng`.
  * Chặn giao dịch (giữ form) nếu số tiền gửi tiết kiệm vượt quá số dư hiện tại của tài khoản.
* **Tiến độ tích lũy (Màu vàng chủ đạo):** Biểu thị phần trăm và số tiền còn thiếu để đạt mục tiêu tiết kiệm tháng với thanh tiến trình màu vàng gold. Khi tổng số tiền tích lũy (bao gồm số dư tiết kiệm khởi tạo và các khoản trích gửi mới) bằng mục tiêu, trạng thái tự động chuyển sang "Hoàn thành" kèm thông điệp chúc mừng.
* **Cập nhật hồ sơ tài chính:** Cho phép thay đổi nhanh ba chỉ số cấu hình bất kỳ lúc nào: Hạn mức chi tiêu tháng, Mục tiêu tiết kiệm tháng, Số dư tiết kiệm khởi tạo.
* **Vùng nguy hiểm (Danger Zone):** Cung cấp tính năng "Xóa tất cả dữ liệu" giúp người dùng xóa sạch storage, reset ứng dụng về trạng thái mặc định ban đầu.

---

## 🛠️ Công nghệ Sử dụng & Lưu trữ dữ liệu

1. **Frontend:** HTML5, CSS3 (sử dụng CSS Variables và phương pháp BEM), Vanilla JavaScript (ES6+).
2. **Lưu trữ cục bộ:** Sử dụng `window.localStorage` với key duy nhất `FINANCE_MVP_DATA`. Dữ liệu giao dịch và cấu hình của bạn được lưu trực tiếp trong trình duyệt và không bị mất đi khi bạn nhấn F5 hoặc tải lại trang.
3. **Thư viện Biểu đồ:** Chart.js (tải qua CDN).

---

## 📂 Cấu trúc Thư mục Dự án

```text
├── index.html          # File giao diện SPA chính (chứa HTML và cấu trúc layout)
├── css/
│   └── style.css       # Định dạng giao diện hệ thống (Apple/Things 3 style, Dark Mode)
├── js/
│   ├── app.js          # Xử lý Logic ứng dụng, quản lý state và sự kiện DOM
│   └── chart_config.js # Cấu hình và render biểu đồ Chart.js thích ứng Dark Mode
├── README.md           # Tài liệu hướng dẫn sử dụng nhanh (File này)
├── explain.md          # Giải thích chi tiết về kỹ thuật (Đã được gitignore)
└── .gitignore          # Cấu hình bỏ qua plan.md và explain.md khi git commit
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

Vì đây là dự án Web tĩnh chạy hoàn toàn ở client-side:

### Cách 1: Chạy trực tiếp (Không cần cài đặt)
Bạn chỉ cần click đúp vào file `index.html` trên máy tính để mở trực tiếp ứng dụng trong trình duyệt Chrome, Safari, Firefox hoặc Edge.

### Cách 2: Chạy qua Live Server (Khuyên dùng)
Nếu sử dụng VS Code, bạn có thể cài đặt Extension **Live Server**, sau đó chuột phải vào file `index.html` và chọn **Open with Live Server** để khởi chạy ứng dụng trên cổng local `http://127.0.0.1:5500`.

---

## 📝 Quy trình Kiểm thử (Demo Flow)

Để trải nghiệm đầy đủ các tính năng trong bản Demo:
1. Mở ứng dụng, kiểm tra dữ liệu mẫu đã có sẵn ở Dashboard (Số dư khởi tạo là `4.000.000 đ` sau khi trừ tiền nhà `3.500.000 đ` từ lương `8.000.000 đ` và `500.000 đ` gửi tiết kiệm mẫu nếu có, hoặc tính lũy tiến).
2. Thử thêm một khoản chi lớn hơn số dư khả dụng (ví dụ: `5.000.000 đ`). Xác nhận hệ thống báo lỗi *"Tài khoản không đủ số dư để thực hiện giao dịch này!"* và giữ nguyên dữ liệu trong form để bạn sửa lại.
3. Thêm một khoản chi hợp lệ (ví dụ: `2.000.000 đ`). Kiểm tra xem số dư hiện tại trên Dashboard giảm đi và dòng giao dịch mới xuất hiện trong **Lịch sử giao dịch gần đây** có số dư lũy tiến cập nhật chính xác.
4. Chuyển sang tab **Mục tiêu & Tiết kiệm**, nhập số tiền `500.000 đ` và bấm **Gửi tiết kiệm**.
   * Kiểm tra xem số dư hiện tại giảm đi `500.000 đ`.
   * Thanh tiến độ tích lũy tăng lên.
   * Một dòng giao dịch `[Tích lũy] Trích quỹ tiết kiệm tháng` xuất hiện trong bảng Lịch sử ở Dashboard.
5. Thử bấm nút xóa 🗑️ trên một dòng giao dịch bất kỳ, đồng ý ở hộp thoại xác nhận và kiểm tra biến động số dư lũy tiến của các giao dịch khác tự động tính toán lại.
6. Nhấn **F5** để tải lại trang, xác nhận dữ liệu của bạn không bị mất.
