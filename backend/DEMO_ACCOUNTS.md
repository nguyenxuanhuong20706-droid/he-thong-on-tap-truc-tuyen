# Danh sách Tài khoản & Hướng dẫn Demo

Tài liệu hướng dẫn đăng nhập, phân quyền và kiểm thử cho **Hệ thống Ôn tập Trực tuyến**.

---

## 1. Danh sách tài khoản hiện có trong Database

| STT | Username | Password (Mật khẩu) | Vai trò (Role) | Mô tả |
|---|---|---|---|---|
| 1 | `Admin` | `123456` | **ADMIN** | Quản trị viên hệ thống (truy cập Cổng Quản trị Hệ thống) |
| 2 | `duongthanh` | `123456` | **USER** | Học viên ôn tập trắc nghiệm |

> 🔒 **Bảo mật:** Mật khẩu trong Database được băm bằng thuật toán an toàn **Argon2id**, không lưu mật khẩu thô.

---

## 2. Cách đăng nhập thử nghiệm trên giao diện (Frontend)

1. Mở giao diện website tại trình duyệt (mặc định: `http://localhost:5173/`).
2. Màn hình hiển thị form **Đăng nhập**:
   - **Thử với quyền Quản trị viên:**
     - Tên đăng nhập: `Admin`
     - Mật khẩu: `123456`
     - 👉 Sau khi đăng nhập, trên thanh menu góc phải hiển thị tên `Admin` cùng nút `Quản trị Admin`.
   - **Thử với quyền Học viên:**
     - Tên đăng nhập: `duongthanh`
     - Mật khẩu: `123456`
     - 👉 Sau khi đăng nhập, học viên chỉ truy cập được các môn đã được cấp quyền. Các môn bị khóa sẽ bị khóa cứng (không thể truy cập).
3. Đăng xuất: Bấm nút **"Đăng xuất"** trên thanh Header. Phiên làm việc (Session) sẽ được thu hồi ngay lập tức trong Database.

---

## 3. Lệnh tạo thêm tài khoản ADMIN bất kỳ

Bạn có thể tạo thêm tài khoản Admin mới hoặc thăng cấp tài khoản User bất kỳ lên Admin thông qua CLI an toàn:

```bash
cd backend
npm run create:admin -- --username=<ten_admin_moi> --password=<mat_khau_moi>
```

**Ví dụ:**
```bash
npm run create:admin -- --username=admin2 --password=Admin@654321
```

---

## 4. Các API mẫu để kiểm tra phân quyền (Postman / cURL)

| Endpoint | Method | Quyền yêu cầu | Mô tả |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Đăng ký tài khoản (mặc định role `USER`) |
| `/api/auth/login` | `POST` | Public | Đăng nhập bằng `username` + `password` |
| `/api/auth/me` | `GET` | Đã đăng nhập | Xem thông tin tài khoản hiện tại |
| `/api/auth/logout` | `POST` | Đã đăng nhập | Đăng xuất và thu hồi session |
| `/api/admin/dashboard` | `GET` | **ADMIN** | Thống kê số lượng người dùng (USER thường bị từ chối `403 Forbidden`) |
| `/api/admin/users` | `GET` | **ADMIN** | Danh sách tất cả người dùng trong hệ thống |

