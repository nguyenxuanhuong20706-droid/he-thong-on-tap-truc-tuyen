# Hệ Thống Ôn Tập Trực Tuyến

> Online Quiz System for Vietnamese University Courses

**Live Demo (Frontend):** https://nguyenxuanhuong20706-droid.github.io/he-thong-on-tap-truc-tuyen/

---

## 📚 Môn học hiện có

| Môn học | Số câu | Loại câu hỏi |
|---------|--------|--------------|
| Lịch sử Đảng Cộng sản Việt Nam | 147 | SINGLE_CHOICE, MULTIPLE_CHOICE |
| Tiếng Anh 3 (Anh văn 3) | 270 | SINGLE_CHOICE, FILL_BLANKS, MATCHING |
| Triết học Mác – Lênin | 266 | SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE_GROUP, FILL_BLANKS, MATCHING |
| **Tổng** | **683** | 5 loại câu hỏi |

---

## 🏗️ Kiến trúc hệ thống

```
frontend/          ← React + TypeScript + Vite (GitHub Pages)
backend/           ← NestJS + TypeScript (self-hosted)
  └── prisma/      ← PostgreSQL schema & migrations
```

### Frontend (GitHub Pages)
- Tự động deploy qua GitHub Actions khi push lên `main`
- Base path: `/he-thong-on-tap-truc-tuyen/`
- Gọi API tới backend qua biến môi trường `VITE_API_URL`

### Backend (NestJS – cần tự deploy)
Xem hướng dẫn chi tiết: [backend/README.md](backend/README.md)

---

## 🚀 Chạy local

### Yêu cầu
- Node.js 20+
- PostgreSQL 16+ (hoặc Docker)

### Frontend
```bash
npm install
npm run dev        # http://localhost:5173
```

### Backend
```bash
cd backend
cp .env.example .env   # Điền thông tin thực
npm install
npx prisma migrate deploy
npm run start:dev  # http://localhost:3000/api
```

---

## ⚙️ Biến môi trường

Frontend (tạo `.env.local` ở thư mục gốc):
```
VITE_API_URL=https://your-backend-domain.com/api
```

Backend: xem [`backend/.env.example`](backend/.env.example)

---

## 📋 Tính năng
- 5 loại câu hỏi: Một lựa chọn, Nhiều lựa chọn, Nhóm Đúng/Sai, Điền khuyết, Kéo thả nối cặp
- Chấm điểm tức thời (instant grading)
- Xáo trộn câu hỏi và phương án thi mỗi lần thi
- Tự động lưu nháp – khôi phục khi F5
- Làm lại chỉ câu sai (retry wrong only)
- Lịch sử bài thi hợp nhất (1 dòng mỗi lượt thi chính thức)
- Bảo mật anti-cheat: không lộ đáp án qua API
- Phân quyền ADMIN / USER, xác thực JWT
