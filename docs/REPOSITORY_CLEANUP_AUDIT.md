# BÁO CÁO TỔNG KIỂM TOÁN REPOSITORY — 140 GIT CHANGES & KẾ HOẠCH DỌN DẸP AN TOÀN

> **Ngày kiểm toán:** 07/11/2026  
> **Trạng thái hệ thống:** Sẵn sàng kiểm toán — CHƯA THỰC HIỆN BẤT KỲ LỆNH XÓA/RESET/RESTORE NÀO.  
> **Cam kết an toàn:** Giữ nguyên dữ liệu PostgreSQL, các bản sao lưu `.sql`, và tài liệu nghiệp vụ chuẩn `docs/QUIZ_BUSINESS_RULES.md`.

## MỤC LỤC
1. [Giai đoạn 1 — Kiểm kê toàn bộ trạng thái Git](#giai-đoạn-1--kiểm-kê-toàn-bộ-trạng-thái-git)
2. [Giai đoạn 2 & 3 — Phân loại và Kiểm toán phụ thuộc](#giai-đoạn-2--3--phân-loại-và-kiểm-toán-phụ-thuộc)
3. [Giai đoạn 4 — Kiểm toán quy trình nạp môn học (Subject Import Pipeline)](#giai-đoạn-4--kiểm-toán-quy-trình-nạp-môn-học)
4. [Giai đoạn 5 — Kiểm toán an toàn dữ liệu và sao lưu (Data & Backup Safety)](#giai-đoạn-5--kiểm-toán-an-toàn-dữ-liệu-và-sao-lưu)
5. [Giai đoạn 6 — Đánh giá cấu trúc dự án & Kiến trúc đề xuất](#giai-đoạn-6--đánh-giá-cấu-trúc-dự-án--kiến-trúc-đề-xuất)
6. [Giai đoạn 7 — Ma trận kiểm toán chi tiết 140 Files](#giai-đoạn-7--ma-trận-kiểm-toán-chi-tiết-140-files)
7. [Giai đoạn 8 — Kế hoạch hành động từng bước & Đề xuất phê duyệt](#giai-đoạn-8--kế-hoạch-hành-động-từng-bước--đề-xuất-phê-duyệt)

---

## GIAI ĐOẠN 1 — KIỂM KÊ TOÀN BỘ TRẠNG THÁI GIT

- **Repository root:** `C:\Users\HUONG\.gemini\antigravity\scratch\lich-su-dang-quiz`
- **Nhánh hiện tại:** `main`
- **Commit HEAD:** `c50bfda` (*chore: cap nhat base URL theo ten repository moi he-thong-on-tap-truc-tuyen*)
- **Tổng số thay đổi ghi nhận:** **140 files** (Khớp 100% với hiển thị của Git Source Control)
  - **Tracked Modified (`M`):** `5` files (Core Frontend + `.gitignore`)
  - **Tracked Deleted (`D`):** `2` files (`src/data/lessons.ts`, `src/data/questions.ts`)
  - **Untracked (`??`):** `133` files (Toàn bộ source backend NestJS, Prisma migrations, backups, docs, assets)
- **Tình trạng `.gitignore`:**
  - Đã có ignore: `node_modules`, `dist`, `.env`, `.env.*`, `!.env.example`.
  - **Thiếu các mẫu ignore quan trọng:** `*.pyc`, `__pycache__/`, `*.tsbuildinfo`, `backups/*.sql`.

---

## GIAI ĐOẠN 2 & 3 — PHÂN LOẠI VÀ KIỂM TOÁN PHỤ THUỘC

### Bảng tổng hợp số lượng theo 6 nhóm nghiệp vụ:

| Nhóm phân loại | Định nghĩa nghiệp vụ | Số lượng | Tỷ lệ (%) | Định hướng xử lý |
| :--- | :--- | :---: | :---: | :--- |
| **A — CORE** | Mã nguồn, cấu hình, migrations đang chạy runtime | **72** | 51.4% | **STAGE & COMMIT vào Git** |
| **B — REQUIRED** | Tài liệu nghiệp vụ SSOT, tests chính thức, ảnh câu hỏi | **33** | 23.6% | **STAGE & COMMIT / BẢO TỒN** |
| **C — REDUNDANT** | Code cũ tĩnh, scripts ad-hoc đã hết nhiệm vụ | **19** | 13.6% | **LƯU TRỮ VÀO `tools/legacy/` HOẶC XÓA** |
| **D — TEMPORARY** | Bytecode `.pyc`, build cache `.tsbuildinfo`, script so sánh tạm | **7** | 5.0% | **XÓA & THÊM VÀO `.gitignore`** |
| **E — ARCHIVE_CANDIDATE** | Bản sao lưu `.sql`, file JSON trung gian sau parse | **9** | 6.4% | **LƯU TRỮ NGOÀI GIT / `.gitignore`** |
| **F — UNKNOWN** | File không rõ nguồn gốc | **0** | 0.0% | *Không có file nào không xác định* |
| **TỔNG CỘNG** | | **140** | **100%** | |

### Phân tích phụ thuộc hệ thống (Dependency Audit):

1. **Frontend Runtime:**
   - `src/App.tsx` phụ thuộc trực tiếp vào các component mới: `src/components/AdminPortal.tsx`, `src/components/AuthView.tsx`, `src/components/HistoryView.tsx`, `src/components/SubjectCard.tsx`, cùng các service `src/services/api.ts`, `src/services/deviceSecurity.ts` và context `src/context/AuthContext.tsx`.
   - `src/data/lessons.ts` và `src/data/questions.ts` không còn bất kỳ dòng import nào trong toàn bộ project. Việc đánh dấu xóa (`D`) trên git là hoàn toàn chính xác vì dữ liệu đã chuyển sang động qua REST API.
2. **Backend Runtime:**
   - NestJS core module (`backend/src/app.module.ts`) nạp `PrismaModule`, `AuthModule`, `SubjectsModule`, `QuizModule`, `AdminModule`.
   - Toàn bộ 40 files trong `backend/src/` đều có liên kết chặt chẽ qua Dependency Injection.
3. **Scripts ad-hoc & root:**
   - Các file `test-e2e-*.cjs` ở thư mục gốc và `backend/test_*.cjs` là các công cụ kiểm thử độc lập được tạo trong quá trình phát triển Phase 1 và Phase 2. Hiện tại backend đã có hệ thống test chuẩn bằng Vitest (`backend/test/app.e2e-spec.ts`, `backend/src/common/utils/quiz-randomizer.spec.ts`).

---

## GIAI ĐOẠN 4 — KIỂM TOÁN QUY TRÌNH NẠP MÔN HỌC & ĐỀ XUẤT HỢP NHẤT

### 1. Kiểm toán chi tiết 3 script import hiện có trong repository:

| Tên file script | Môn học phụ trách | Dữ liệu nguồn | Tình trạng sử dụng thực tế | Tính năng / Logic đặc thù |
| :--- | :--- | :--- | :---: | :--- |
| `backend/import_lich_su_dang.cjs` | **Lịch sử Đảng Cộng sản Việt Nam** | `lich_su_dang_parsed.json` | **ĐANG SỬ DỤNG THỰC TẾ (ACTIVE)** | Nạp 147 câu hỏi (5 bài học) đang trực tiếp phục vụ học viên thi trên hệ thống runtime. Logic chuẩn hóa UUID options. |
| `backend/import_anh_van_3.cjs` | **Anh văn 3 / Ngoại ngữ chuyên ngành** | `anh_van_3_clean_data.json` | **ĐÃ XÓA KHỎI DB (REFERENCE ONLY)** | Môn đã bị wipe khỏi DB. Chứa logic đặc thù: liên kết `imageUrl` (`public/images/nncn/`), hỗ trợ `FILL_BLANKS`, `MATCHING`. |
| `backend/import_ktctml.cjs` | **Kinh tế chính trị Mác - Lênin** | `ktctml_full_bank.json` | **ĐÃ XÓA KHỎI DB (REFERENCE ONLY)** | Môn đã bị wipe khỏi DB. Chứa logic đặc thù: nạp trường `explanation` (giải thích đáp án) cho câu hỏi. |

> [!NOTE]
> **Kết luận kiểm toán:** Script duy nhất kết nối với dữ liệu đang hoạt động là `backend/import_lich_su_dang.cjs`. Hai script còn lại không chạy định kỳ nhưng lưu giữ mã nguồn quý giá về các dạng câu hỏi nâng cao (ảnh minh họa, giải thích, điền từ).

### 2. Phân tích điểm tương đồng và bất cập hiện tại:
- **Điểm tương đồng (90% luồng xử lý trùng khớp):**
  1. Upsert bảng `Subject` (slug, title, description, orderIndex, isPublished).
  2. Vòng lặp các bài học: Upsert bảng `Lesson` (subjectId, slug, title, lessonNumber).
  3. Xóa dữ liệu câu hỏi cũ của bài học đó nếu re-import (`prisma.question.deleteMany`, `prisma.option.deleteMany`) để đảm bảo tính toàn vẹn (clean slate).
  4. Vòng lặp câu hỏi: Insert `Question` kèm mảng `options` với cờ `isCorrect`.
  5. Cấp quyền truy cập tự động cho toàn bộ user đang hoạt động (`UserSubjectAccess`).
- **Điểm bất cập:**
  - Đường dẫn file dữ liệu JSON bị hardcode cố định (`C:\Users\HUONG\...`).
  - Định dạng JSON trung gian chưa đồng nhất (`q.content` vs `q.questionContent`, `opt.text` vs `opt.content`).
  - Chưa hỗ trợ giao diện dòng lệnh (CLI) để nhận tham số linh hoạt.

### 3. Đề xuất Kiến trúc Bộ Import Hợp Nhất (Unified Import Suite):
Thay vì mỗi môn học viết một script riêng gây phân mảnh repository, đề xuất hợp nhất thành một bộ công cụ chuẩn hóa theo mô hình 3 tầng:

```text
tools/importer/
├── standard-quiz.schema.ts     # Interface JSON quy chuẩn cho mọi môn học
├── cli.ts                      # CLI điều khiển: chọn file, chọn môn, dry-run
├── parsers/                    # Tầng 1: Đọc và trích xuất dữ liệu thô
│   ├── docx-xml-parser.ts      # Giải nén XML docx, đọc run color (FF0000), trích xuất ảnh
│   └── validator.ts            # Kiểm tra tính toàn vẹn: SINGLE_CHOICE phải có đúng 1 đáp án đúng; các dạng khác có validator chuyên biệt tương ứng
└── loaders/                    # Tầng 2: Nạp dữ liệu vào PostgreSQL
    └── prisma-subject-loader.ts# Transaction loader duy nhất cho mọi môn học
```

**Mô hình dữ liệu chuẩn hóa (`StandardLesson`):**
```typescript
interface StandardOption {
  key: string;       // 'A' | 'B' | 'C' | 'D'
  text: string;      // Nội dung phương án
  isCorrect: boolean;// Đánh dấu đáp án đúng
}

interface StandardQuestion {
  questionNumber: number;
  content: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'FILL_BLANKS' | 'MATCHING';
  imageUrl?: string;
  explanation?: string;
  options: StandardOption[];
}

interface StandardSubjectPackage {
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: {
    slug: string;
    title: string;
    lessonNumber: number;
    questions: StandardQuestion[];
  }[];
}
```

**Cơ chế thực thi đề xuất:**
```bash
# Nạp bất kỳ môn học nào bằng 1 lệnh duy nhất:
npx ts-node tools/importer/cli.ts --file ./data/lich-su-dang.docx --slug lich-su-dang
```

---

## GIAI ĐOẠN 5 — KIỂM TOÁN AN TOÀN DỮ LIỆU VÀ SAO LƯU (DATA & BACKUP SAFETY)

### 1. Bản sao lưu cơ sở dữ liệu (`backups/`):
- `backups/ontap_db_backup_20261106.sql` (2.05 MB)
- `backups/ontap_db_backup_before_wipe_20261106.sql` (2.05 MB)
- `backups/ontap_db_backup_pre_phase2_20261106.sql` (1.23 MB)
- `backups/ontap_db_backup_pre_randomizer_20261106.sql` (1.23 MB)
> [!IMPORTANT]
> **Quy tắc an toàn:** Tuyệt đối không xóa 4 file backup này! Tuy nhiên, không nên commit file `.sql` dung lượng lớn vào Git repository để tránh phình to lịch sử Git. Cần bổ sung `backups/*.sql` vào `.gitignore` và sao chép một bản sang thư mục lưu trữ an toàn ngoài workspace.
### 2. Dữ liệu hình ảnh bài học (`public/images/nncn/`):
- Gồm 25 file ảnh (`image1.png` đến `image25.png`).
- Đây là tài nguyên minh họa câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành. Bắt buộc giữ lại trong repository hoặc đưa vào kho asset để đảm bảo khi môn học được kích hoạt lại, các câu hỏi có hình ảnh hiển thị bình thường.
### 3. File môi trường (`.env`):
- `backend/.env.example`: File mẫu chứa các biến môi trường chuẩn (PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGIN...). Cần commit vào Git.
- Các file cấu hình chứa mật khẩu thực tế (`.env`) đã được bảo vệ trong `.gitignore`.
### 4. Chuỗi Prisma Migrations (`backend/prisma/migrations/`):
- Gồm 8 thư mục migration và `migration_lock.toml`:
  1. `20261104114241_init_auth_rbac`
  2. `20261104115000_change_email_to_username`
  3. `20261104121500_add_content_quiz_orders`
  4. `20261105092500_add_enum_license_key`
  5. `20261105092600_add_license_key_system`
  6. `20261105101900_add_direct_access_and_audit_logs`
  7. `20261106032200_add_quiz_randomization_engine`
  8. `20261106130000_add_question_metadata_and_types`
> [!CAUTION]
> Tuyệt đối bảo tồn toàn bộ chuỗi migration này. Nếu xóa hoặc sửa đổi migration cũ sẽ làm gãy lịch sử `_prisma_migrations` trong PostgreSQL dẫn đến lỗi `PrismaClientKnownRequestError` khi migrate tương lai.

---

## GIAI ĐOẠN 6 — ĐÁNG GIÁ CẤU TRÚC DỰ ÁN & KIẾN TRÚC ĐỀ XUẤT

### 1. Hiện trạng phân bố thư mục:
- Dự án ban đầu là frontend thuần React Vite (`lich-su-dang-quiz`).
- Sau đó backend NestJS được khởi tạo bên trong thư mục `backend/`.
- Rất nhiều script kiểm thử, script python và file kết quả json bị để rải rác ngay tại thư mục gốc (`/`), gây rối mắt và làm Git hiển thị đến 140 thay đổi.
### 2. Kiến trúc tổ chức gọn gàng đề xuất (Target Structure):
```text
lich-su-dang-quiz/
├── docs/                      # Tài liệu nghiệp vụ & báo cáo kiểm toán
│   ├── QUIZ_BUSINESS_RULES.md
│   └── REPOSITORY_CLEANUP_AUDIT.md
├── src/                       # Frontend React + TypeScript + Vite
├── backend/                   # Backend NestJS + Prisma ORM
│   ├── src/
│   ├── prisma/
│   └── test/
├── tools/                     # Toàn bộ script tiện ích (thay vì để ở root)
│   ├── importers/             # Script nạp dữ liệu từ Word/JSON
│   └── legacy/                # Script ad-hoc đã lưu trữ
├── backups/                   # File SQL backup (được gitignore)
├── public/                    # Static assets (favicon, icons, images)
└── .gitignore                 # Cập nhật để loại trừ build artifacts & temp files
```

---

## GIAI ĐOẠN 7 — MA TRẬN KIỂM TOÁN CHI TIẾT 140 FILES

Dưới đây là bảng kiểm toán chi tiết cho **tất cả 140 files** trong Git Changes:

| STT | Đường dẫn File | Trạng thái Git | Kích thước | Phân loại | Chức năng nghiệp vụ | Phụ thuộc | Bằng chứng kiểm toán | Rủi ro | Đề xuất hành động |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `.gitignore` | `M` | 279 B | **A — CORE** | Frontend core UI/UX - chấm điểm tức thời, 3 luồng sau làm bài | React, Vite, Tailwind | Đang chạy runtime tại http://localhost:5173 | CỰC CAO (Không được xóa/revert) | **STAGE & COMMIT** |
| 2 | `backend/.env.example` | `??` | 621 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 3 | `backend/.oxlintrc.json` | `??` | 216 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 4 | `backend/.prettierrc` | `??` | 56 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 5 | `backend/docker-compose.yml` | `??` | 629 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 6 | `backend/nest-cli.json` | `??` | 179 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 7 | `backend/package-lock.json` | `??` | 237,771 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 8 | `backend/package.json` | `??` | 1,954 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 9 | `backend/prisma/migrations/20261104114241_init_auth_rbac/migration.sql` | `??` | 3,970 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 10 | `backend/prisma/migrations/20261104115000_change_email_to_username/migration.sql` | `??` | 342 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 11 | `backend/prisma/migrations/20261104121500_add_content_quiz_orders/migration.sql` | `??` | 6,799 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 12 | `backend/prisma/migrations/20261105092500_add_enum_license_key/migration.sql` | `??` | 63 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 13 | `backend/prisma/migrations/20261105092600_add_license_key_system/migration.sql` | `??` | 4,491 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 14 | `backend/prisma/migrations/20261105101900_add_direct_access_and_audit_logs/migration.sql` | `??` | 1,758 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 15 | `backend/prisma/migrations/20261106032200_add_quiz_randomization_engine/migration.sql` | `??` | 878 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 16 | `backend/prisma/migrations/20261106130000_add_question_metadata_and_types/migration.sql` | `??` | 362 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 17 | `backend/prisma/migrations/migration_lock.toml` | `??` | 127 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 18 | `backend/prisma/schema.prisma` | `??` | 17,151 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 19 | `backend/prisma/seed.ts` | `??` | 20,691 B | **A — CORE** | Database schema, seed và migration history chuẩn của PostgreSQL | Prisma Client, PostgreSQL | Prisma migrate status = in sync | CỰC CAO (Lệch schema DB) | **STAGE & COMMIT** |
| 20 | `backend/src/admin/admin.controller.ts` | `??` | 6,073 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 21 | `backend/src/admin/admin.module.ts` | `??` | 367 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 22 | `backend/src/admin/admin.service.ts` | `??` | 26,409 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 23 | `backend/src/admin/dto/create-lesson.dto.ts` | `??` | 371 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 24 | `backend/src/admin/dto/create-license-key.dto.ts` | `??` | 712 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 25 | `backend/src/admin/dto/create-question.dto.ts` | `??` | 765 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 26 | `backend/src/admin/dto/create-subject.dto.ts` | `??` | 390 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 27 | `backend/src/admin/dto/create-user.dto.ts` | `??` | 384 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 28 | `backend/src/app.controller.ts` | `??` | 903 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 29 | `backend/src/app.module.ts` | `??` | 980 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 30 | `backend/src/app.service.ts` | `??` | 150 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 31 | `backend/src/auth/auth.controller.ts` | `??` | 7,136 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 32 | `backend/src/auth/auth.module.ts` | `??` | 953 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 33 | `backend/src/auth/auth.service.ts` | `??` | 26,027 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 34 | `backend/src/auth/dto/bind-device.dto.ts` | `??` | 1,032 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 35 | `backend/src/auth/dto/change-password.dto.ts` | `??` | 477 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 36 | `backend/src/auth/dto/check-device.dto.ts` | `??` | 267 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 37 | `backend/src/auth/dto/login.dto.ts` | `??` | 740 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 38 | `backend/src/auth/dto/mfa-verify.dto.ts` | `??` | 313 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 39 | `backend/src/auth/dto/register.dto.ts` | `??` | 1,141 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 40 | `backend/src/auth/jwt.strategy.ts` | `??` | 1,060 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 41 | `backend/src/common/crypto/device-crypto.ts` | `??` | 1,787 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 42 | `backend/src/common/decorators/current-user.decorator.ts` | `??` | 489 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 43 | `backend/src/common/decorators/roles.decorator.ts` | `??` | 195 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 44 | `backend/src/common/guards/jwt-auth.guard.ts` | `??` | 2,182 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 45 | `backend/src/common/guards/roles.guard.ts` | `??` | 1,064 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 46 | `backend/src/common/utils/quiz-randomizer.ts` | `??` | 3,527 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 47 | `backend/src/main.ts` | `??` | 2,185 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 48 | `backend/src/prisma/prisma.module.ts` | `??` | 214 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 49 | `backend/src/prisma/prisma.service.ts` | `??` | 351 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 50 | `backend/src/quiz/dto/draft-answer.dto.ts` | `??` | 472 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 51 | `backend/src/quiz/dto/start-quiz.dto.ts` | `??` | 505 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 52 | `backend/src/quiz/dto/submit-quiz.dto.ts` | `??` | 402 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 53 | `backend/src/quiz/quiz.controller.ts` | `??` | 3,577 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 54 | `backend/src/quiz/quiz.module.ts` | `??` | 441 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 55 | `backend/src/quiz/quiz.service.ts` | `??` | 44,190 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 56 | `backend/src/scripts/create-admin.ts` | `??` | 2,071 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 57 | `backend/src/subjects/subjects.controller.ts` | `??` | 1,989 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 58 | `backend/src/subjects/subjects.module.ts` | `??` | 457 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 59 | `backend/src/subjects/subjects.service.ts` | `??` | 6,539 B | **A — CORE** | Backend NestJS service/controller/DTO/module core | NestJS runtime, Prisma | Đang chạy tại http://localhost:3000/api | CỰC CAO (Backend sập nếu mất) | **STAGE & COMMIT** |
| 60 | `backend/tsconfig.build.json` | `??` | 178 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 61 | `backend/tsconfig.json` | `??` | 624 B | **A — CORE** | Cấu hình backend NestJS và môi trường container/linting | Node.js, npm, Docker | npm run build/start phụ thuộc trực tiếp | CỰC CAO (Không build được backend) | **STAGE & COMMIT** |
| 62 | `src/App.tsx` | `M` | 28,569 B | **A — CORE** | Frontend core UI/UX - chấm điểm tức thời, 3 luồng sau làm bài | React, Vite, Tailwind | Đang chạy runtime tại http://localhost:5173 | CỰC CAO (Không được xóa/revert) | **STAGE & COMMIT** |
| 63 | `src/components/AdminPortal.tsx` | `??` | 57,821 B | **A — CORE** | Frontend service/component mới cho Auth, Security, Admin, History | src/App.tsx | Được import trực tiếp trong App.tsx | CỰC CAO (Mất tính năng frontend) | **STAGE & COMMIT** |
| 64 | `src/components/AuthView.tsx` | `??` | 11,684 B | **A — CORE** | Frontend service/component mới cho Auth, Security, Admin, History | src/App.tsx | Được import trực tiếp trong App.tsx | CỰC CAO (Mất tính năng frontend) | **STAGE & COMMIT** |
| 65 | `src/components/Header.tsx` | `M` | 6,528 B | **A — CORE** | Frontend core UI/UX - chấm điểm tức thời, 3 luồng sau làm bài | React, Vite, Tailwind | Đang chạy runtime tại http://localhost:5173 | CỰC CAO (Không được xóa/revert) | **STAGE & COMMIT** |
| 66 | `src/components/HistoryView.tsx` | `??` | 17,253 B | **A — CORE** | Frontend service/component mới cho Auth, Security, Admin, History | src/App.tsx | Được import trực tiếp trong App.tsx | CỰC CAO (Mất tính năng frontend) | **STAGE & COMMIT** |
| 67 | `src/components/QuestionCard.tsx` | `M` | 18,443 B | **A — CORE** | Frontend core UI/UX - chấm điểm tức thời, 3 luồng sau làm bài | React, Vite, Tailwind | Đang chạy runtime tại http://localhost:5173 | CỰC CAO (Không được xóa/revert) | **STAGE & COMMIT** |
| 68 | `src/components/ResultModal.tsx` | `M` | 10,416 B | **A — CORE** | Frontend core UI/UX - chấm điểm tức thời, 3 luồng sau làm bài | React, Vite, Tailwind | Đang chạy runtime tại http://localhost:5173 | CỰC CAO (Không được xóa/revert) | **STAGE & COMMIT** |
| 69 | `src/components/SubjectCard.tsx` | `??` | 2,725 B | **A — CORE** | Frontend service/component mới cho Auth, Security, Admin, History | src/App.tsx | Được import trực tiếp trong App.tsx | CỰC CAO (Mất tính năng frontend) | **STAGE & COMMIT** |
| 70 | `src/context/AuthContext.tsx` | `??` | 3,827 B | **A — CORE** | Frontend service/component mới cho Auth, Security, Admin, History | src/App.tsx | Được import trực tiếp trong App.tsx | CỰC CAO (Mất tính năng frontend) | **STAGE & COMMIT** |
| 71 | `src/services/api.ts` | `??` | 27,455 B | **A — CORE** | Frontend service/component mới cho Auth, Security, Admin, History | src/App.tsx | Được import trực tiếp trong App.tsx | CỰC CAO (Mất tính năng frontend) | **STAGE & COMMIT** |
| 72 | `src/services/deviceSecurity.ts` | `??` | 4,908 B | **A — CORE** | Frontend service/component mới cho Auth, Security, Admin, History | src/App.tsx | Được import trực tiếp trong App.tsx | CỰC CAO (Mất tính năng frontend) | **STAGE & COMMIT** |
| 73 | `backend/DEMO_ACCOUNTS.md` | `??` | 2,729 B | **B — REQUIRED** | Tài liệu đặc tả nghiệp vụ chuẩn (SSOT) và tài liệu vận hành | Team & Quy chuẩn hệ thống | Được chỉ định là quy chuẩn nghiệp vụ bất biến | CAO (Mất tài liệu chuẩn) | **STAGE & COMMIT** |
| 74 | `backend/README.md` | `??` | 7,105 B | **B — REQUIRED** | Tài liệu đặc tả nghiệp vụ chuẩn (SSOT) và tài liệu vận hành | Team & Quy chuẩn hệ thống | Được chỉ định là quy chuẩn nghiệp vụ bất biến | CAO (Mất tài liệu chuẩn) | **STAGE & COMMIT** |
| 75 | `backend/src/app.controller.spec.ts` | `??` | 645 B | **B — REQUIRED** | Bộ test unit/E2E chính thức của backend theo chuẩn Vitest | Vitest | package.json script test/test:e2e | TRUNG BÌNH (Mất test chuẩn) | **STAGE & COMMIT** |
| 76 | `backend/src/common/utils/quiz-randomizer.spec.ts` | `??` | 4,604 B | **B — REQUIRED** | Bộ test unit/E2E chính thức của backend theo chuẩn Vitest | Vitest | package.json script test/test:e2e | TRUNG BÌNH (Mất test chuẩn) | **STAGE & COMMIT** |
| 77 | `backend/test/app.e2e-spec.ts` | `??` | 757 B | **B — REQUIRED** | Bộ test unit/E2E chính thức của backend theo chuẩn Vitest | Vitest | package.json script test/test:e2e | TRUNG BÌNH (Mất test chuẩn) | **STAGE & COMMIT** |
| 78 | `backend/vitest.config.e2e.ts` | `??` | 256 B | **B — REQUIRED** | Bộ test unit/E2E chính thức của backend theo chuẩn Vitest | Vitest | package.json script test/test:e2e | TRUNG BÌNH (Mất test chuẩn) | **STAGE & COMMIT** |
| 79 | `backend/vitest.config.ts` | `??` | 363 B | **B — REQUIRED** | Bộ test unit/E2E chính thức của backend theo chuẩn Vitest | Vitest | package.json script test/test:e2e | TRUNG BÌNH (Mất test chuẩn) | **STAGE & COMMIT** |
| 80 | `docs/QUIZ_BUSINESS_RULES.md` | `??` | 45,419 B | **B — REQUIRED** | Tài liệu đặc tả nghiệp vụ chuẩn (SSOT) và tài liệu vận hành | Team & Quy chuẩn hệ thống | Được chỉ định là quy chuẩn nghiệp vụ bất biến | CAO (Mất tài liệu chuẩn) | **STAGE & COMMIT** |
| 81 | `public/images/nncn/image1.png` | `??` | 171,489 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 82 | `public/images/nncn/image10.png` | `??` | 80,412 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 83 | `public/images/nncn/image11.png` | `??` | 66,622 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 84 | `public/images/nncn/image12.png` | `??` | 136,818 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 85 | `public/images/nncn/image13.png` | `??` | 98,108 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 86 | `public/images/nncn/image14.png` | `??` | 55,329 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 87 | `public/images/nncn/image15.png` | `??` | 61,282 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 88 | `public/images/nncn/image16.png` | `??` | 60,195 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 89 | `public/images/nncn/image17.png` | `??` | 69,576 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 90 | `public/images/nncn/image18.png` | `??` | 58,410 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 91 | `public/images/nncn/image19.png` | `??` | 81,318 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 92 | `public/images/nncn/image2.png` | `??` | 361,445 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 93 | `public/images/nncn/image20.png` | `??` | 185,072 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 94 | `public/images/nncn/image21.png` | `??` | 71,696 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 95 | `public/images/nncn/image22.png` | `??` | 351,525 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 96 | `public/images/nncn/image23.png` | `??` | 93,298 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 97 | `public/images/nncn/image24.png` | `??` | 88,238 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 98 | `public/images/nncn/image25.png` | `??` | 24,939 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 99 | `public/images/nncn/image3.png` | `??` | 105,465 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 100 | `public/images/nncn/image4.png` | `??` | 41,441 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 101 | `public/images/nncn/image5.png` | `??` | 35,462 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 102 | `public/images/nncn/image6.png` | `??` | 47,389 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 103 | `public/images/nncn/image7.png` | `??` | 60,081 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 104 | `public/images/nncn/image8.png` | `??` | 54,218 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 105 | `public/images/nncn/image9.png` | `??` | 212,163 B | **B — REQUIRED** | 25 file ảnh câu hỏi của môn Anh văn 3 / Ngoại ngữ chuyên ngành | Database questions (image_url) | Ảnh được trích xuất từ đề thi gốc | CAO (Nếu môn AV3 được import lại sẽ hỏng hiển thị ảnh) | **STAGE & COMMIT (HOẶC LƯU MEDIA ASSETS)** |
| 106 | `add_question_type_test.sql` | `??` | 201 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 107 | `backend/add_columns_both_dbs.cjs` | `??` | 940 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 108 | `backend/alter_both_dbs.cjs` | `??` | 1,044 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 109 | `backend/check_db_schema.cjs` | `??` | 944 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 110 | `backend/check_import_result.cjs` | `??` | 897 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 111 | `backend/grant_access_all.cjs` | `??` | 902 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 112 | `backend/import_anh_van_3.cjs` | `??` | 5,432 B | **C — REDUNDANT** | Script import dữ liệu môn học riêng lẻ (AV3, KTCT, Lịch sử Đảng) | Prisma Client, JSON files | Mỗi môn có 1 file riêng, chưa thống nhất thành pipeline | CAO NẾU XÓA NGAY (Cần cho việc nạp lại dữ liệu) | **TÁI CẤU TRÚC THÀNH CLI LOADER CHUẨN TRONG tools/import/** |
| 113 | `backend/import_ktctml.cjs` | `??` | 5,171 B | **C — REDUNDANT** | Script import dữ liệu môn học riêng lẻ (AV3, KTCT, Lịch sử Đảng) | Prisma Client, JSON files | Mỗi môn có 1 file riêng, chưa thống nhất thành pipeline | CAO NẾU XÓA NGAY (Cần cho việc nạp lại dữ liệu) | **TÁI CẤU TRÚC THÀNH CLI LOADER CHUẨN TRONG tools/import/** |
| 114 | `backend/import_lich_su_dang.cjs` | `??` | 4,230 B | **C — REDUNDANT** | Script import dữ liệu môn học riêng lẻ (AV3, KTCT, Lịch sử Đảng) | Prisma Client, JSON files | Mỗi môn có 1 file riêng, chưa thống nhất thành pipeline | CAO NẾU XÓA NGAY (Cần cho việc nạp lại dữ liệu) | **TÁI CẤU TRÚC THÀNH CLI LOADER CHUẨN TRONG tools/import/** |
| 115 | `backend/inspect-last-result.cjs` | `??` | 497 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 116 | `backend/test_alter_enum.cjs` | `??` | 654 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 117 | `backend/test_e2e_anh_van_3.cjs` | `??` | 4,992 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 118 | `backend/test_live_check.cjs` | `??` | 2,199 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 119 | `src/data/lessons.ts` | `D` | 0 B (Deleted) | **C — REDUNDANT** | Dữ liệu tĩnh cũ của frontend trước khi có backend API | Không còn ai import (đã thay bằng dynamic backend) | Grep trong codebase không có import nào | KHÔNG CÓ | **XÁC NHẬN XÓA (COMMIT DELETION)** |
| 120 | `src/data/questions.ts` | `D` | 0 B (Deleted) | **C — REDUNDANT** | Dữ liệu tĩnh cũ của frontend trước khi có backend API | Không còn ai import (đã thay bằng dynamic backend) | Grep trong codebase không có import nào | KHÔNG CÓ | **XÁC NHẬN XÓA (COMMIT DELETION)** |
| 121 | `test-e2e-direct-access.cjs` | `??` | 11,918 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 122 | `test-e2e-phase2-suite.cjs` | `??` | 10,335 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 123 | `test-e2e-quiz-randomizer-and-auth.cjs` | `??` | 16,410 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 124 | `test-e2e-security-suite.cjs` | `??` | 18,213 B | **C — REDUNDANT** | Script kiểm thử và patch ad-hoc trong quá trình phát triển Phase 1 & 2 | Node.js/Prisma ad-hoc | Đã có Prisma migrations và test suite chuẩn Vitest thay thế | THẤP (Nếu đã lưu backup script) | **GOM VÀO tools/legacy/ HOẶC LƯU TRỮ TRƯỚC KHI DỌN** |
| 125 | `backend/__pycache__/analyze_nncn.cpython-314.pyc` | `??` | 4,870 B | **D — TEMPORARY** | Build artifact / cache tự động sinh của TypeScript / Python | Tự động sinh khi biên dịch | Có thể tự tái tạo 100% khi build | KHÔNG CÓ | **XÓA & THÊM VÀO .gitignore** |
| 126 | `backend/__pycache__/parse_lsd_full.cpython-314.pyc` | `??` | 9,381 B | **D — TEMPORARY** | Build artifact / cache tự động sinh của TypeScript / Python | Tự động sinh khi biên dịch | Có thể tự tái tạo 100% khi build | KHÔNG CÓ | **XÓA & THÊM VÀO .gitignore** |
| 127 | `backend/__pycache__/parse_nncn_full.cpython-314.pyc` | `??` | 7,707 B | **D — TEMPORARY** | Build artifact / cache tự động sinh của TypeScript / Python | Tự động sinh khi biên dịch | Có thể tự tái tạo 100% khi build | KHÔNG CÓ | **XÓA & THÊM VÀO .gitignore** |
| 128 | `backend/tsconfig.build.tsbuildinfo` | `??` | 188,450 B | **D — TEMPORARY** | Build artifact / cache tự động sinh của TypeScript / Python | Tự động sinh khi biên dịch | Có thể tự tái tạo 100% khi build | KHÔNG CÓ | **XÓA & THÊM VÀO .gitignore** |
| 129 | `extract_exact_10.py` | `??` | 4,182 B | **D — TEMPORARY** | Script Python kiểm toán ad-hoc độc lập để đối chiếu XML docx vs DB | python-docx / zipfile | Đã hoàn thành mục tiêu kiểm toán | THẤP | **LƯU TRỮ VÀO scratch/ HOẶC XÓA SAU XÁC NHẬN** |
| 130 | `scratch_audit_word_vs_db.py` | `??` | 3,560 B | **D — TEMPORARY** | Script Python kiểm toán ad-hoc độc lập để đối chiếu XML docx vs DB | python-docx / zipfile | Đã hoàn thành mục tiêu kiểm toán | THẤP | **LƯU TRỮ VÀO scratch/ HOẶC XÓA SAU XÁC NHẬN** |
| 131 | `scratch_compare_10.py` | `??` | 3,985 B | **D — TEMPORARY** | Script Python kiểm toán ad-hoc độc lập để đối chiếu XML docx vs DB | python-docx / zipfile | Đã hoàn thành mục tiêu kiểm toán | THẤP | **LƯU TRỮ VÀO scratch/ HOẶC XÓA SAU XÁC NHẬN** |
| 132 | `backups/ontap_db_backup_20261106.sql` | `??` | 3,939,968 B | **E — ARCHIVE_CANDIDATE** | Bản sao lưu SQL database PostgreSQL qua các mốc phát triển | PostgreSQL pg_dump/pg_restore | 4 file .sql dung lượng từ 1.2MB đến 2.1MB | CỰC CAO NẾU XÓA MẤT (Cần lưu trữ an toàn) | **LƯU TRỮ LÂU DÀI NGOÀI GIT / THÊM VÀO .gitignore** |
| 133 | `backups/ontap_db_backup_before_wipe_20261106.sql` | `??` | 4,650,992 B | **E — ARCHIVE_CANDIDATE** | Bản sao lưu SQL database PostgreSQL qua các mốc phát triển | PostgreSQL pg_dump/pg_restore | 4 file .sql dung lượng từ 1.2MB đến 2.1MB | CỰC CAO NẾU XÓA MẤT (Cần lưu trữ an toàn) | **LƯU TRỮ LÂU DÀI NGOÀI GIT / THÊM VÀO .gitignore** |
| 134 | `backups/ontap_db_backup_pre_phase2_20261106.sql` | `??` | 4,408,840 B | **E — ARCHIVE_CANDIDATE** | Bản sao lưu SQL database PostgreSQL qua các mốc phát triển | PostgreSQL pg_dump/pg_restore | 4 file .sql dung lượng từ 1.2MB đến 2.1MB | CỰC CAO NẾU XÓA MẤT (Cần lưu trữ an toàn) | **LƯU TRỮ LÂU DÀI NGOÀI GIT / THÊM VÀO .gitignore** |
| 135 | `backups/ontap_db_backup_pre_randomizer_20261106.sql` | `??` | 3,954,398 B | **E — ARCHIVE_CANDIDATE** | Bản sao lưu SQL database PostgreSQL qua các mốc phát triển | PostgreSQL pg_dump/pg_restore | 4 file .sql dung lượng từ 1.2MB đến 2.1MB | CỰC CAO NẾU XÓA MẤT (Cần lưu trữ an toàn) | **LƯU TRỮ LÂU DÀI NGOÀI GIT / THÊM VÀO .gitignore** |
| 136 | `compare_exact_10.json` | `??` | 33,024 B | **E — ARCHIVE_CANDIDATE** | File dữ liệu trung gian JSON sau phân tích đề thi và kết quả kiểm toán 10 câu | import_lich_su_dang.cjs cần lich_su_dang_parsed.json | Dữ liệu trích xuất từ docx và kiểm toán | TRUNG BÌNH (Cần giữ nếu muốn re-import không cần parse lại) | **LƯU TRỮ VÀO data/archive/ HOẶC .gitignore** |
| 137 | `comparison_10_results.json` | `??` | 20,274 B | **E — ARCHIVE_CANDIDATE** | File dữ liệu trung gian JSON sau phân tích đề thi và kết quả kiểm toán 10 câu | import_lich_su_dang.cjs cần lich_su_dang_parsed.json | Dữ liệu trích xuất từ docx và kiểm toán | TRUNG BÌNH (Cần giữ nếu muốn re-import không cần parse lại) | **LƯU TRỮ VÀO data/archive/ HOẶC .gitignore** |
| 138 | `db_10.json` | `??` | 35,396 B | **E — ARCHIVE_CANDIDATE** | File dữ liệu trung gian JSON sau phân tích đề thi và kết quả kiểm toán 10 câu | import_lich_su_dang.cjs cần lich_su_dang_parsed.json | Dữ liệu trích xuất từ docx và kiểm toán | TRUNG BÌNH (Cần giữ nếu muốn re-import không cần parse lại) | **LƯU TRỮ VÀO data/archive/ HOẶC .gitignore** |
| 139 | `final_10_comparison.json` | `??` | 26,445 B | **E — ARCHIVE_CANDIDATE** | File dữ liệu trung gian JSON sau phân tích đề thi và kết quả kiểm toán 10 câu | import_lich_su_dang.cjs cần lich_su_dang_parsed.json | Dữ liệu trích xuất từ docx và kiểm toán | TRUNG BÌNH (Cần giữ nếu muốn re-import không cần parse lại) | **LƯU TRỮ VÀO data/archive/ HOẶC .gitignore** |
| 140 | `lich_su_dang_parsed.json` | `??` | 144,605 B | **E — ARCHIVE_CANDIDATE** | File dữ liệu trung gian JSON sau phân tích đề thi và kết quả kiểm toán 10 câu | import_lich_su_dang.cjs cần lich_su_dang_parsed.json | Dữ liệu trích xuất từ docx và kiểm toán | TRUNG BÌNH (Cần giữ nếu muốn re-import không cần parse lại) | **LƯU TRỮ VÀO data/archive/ HOẶC .gitignore** |

---

### Tổng kết các danh sách xử lý cụ thể:

#### 1. Xử lý nhóm TEMPORARY (7 files):
- **Đã xóa an toàn khỏi đĩa (4 files cache & bytecode):**
  - `backend/tsconfig.build.tsbuildinfo` (Build cache của TypeScript, tự sinh khi chạy `nest build`)
  - `backend/__pycache__/analyze_nncn.cpython-314.pyc` (Python bytecode)
  - `backend/__pycache__/parse_lsd_full.cpython-314.pyc` (Python bytecode)
  - `backend/__pycache__/parse_nncn_full.cpython-314.pyc` (Python bytecode)
- **Giữ lại làm tài liệu tham chiếu thuật toán XML (3 files):**
  - `extract_exact_10.py` (Script trích xuất run/color XML)
  - `scratch_audit_word_vs_db.py` (Script đối chiếu docx vs db)
  - `scratch_compare_10.py` (Script so sánh đáp án)
  *Lý do giữ lại:* Bảo toàn mã nguồn thuật toán XML docx phục vụ thiết kế bộ import hợp nhất đa môn học.

#### 2. Danh sách CẦN LƯU TRỮ VÀO THƯ MỤC RIÊNG HOẶC GITIGNORE (Archive First — 28 files):
- **4 Bản sao lưu SQL (`backups/*.sql`):** Bổ sung vào `.gitignore` để không phình Git repo, giữ an toàn tại chỗ.
- **5 File JSON so sánh & ngân hàng:** `lich_su_dang_parsed.json`, `compare_exact_10.json`, `comparison_10_results.json`, `db_10.json`, `final_10_comparison.json` -> gom vào `tools/archive/` hoặc `backups/data/`.
- **19 File Script ad-hoc cũ:** `test-e2e-*.cjs`, `backend/test_*.cjs`, `add_question_type_test.sql`, `backend/add_columns_both_dbs.cjs`, `backend/alter_both_dbs.cjs`, `backend/check_*.cjs`, `backend/grant_access_all.cjs`, `backend/inspect-last-result.cjs`, `backend/import_*.cjs` -> Di chuyển gọn vào `tools/legacy/` trước khi xem xét dọn dẹp.

#### 3. Danh sách TUYỆT ĐỐI BẢO TỒN & STAGE VÀO GIT (Never Delete — 105 files):
- **72 File CORE (Nhóm A):** Toàn bộ NestJS backend (`backend/src/**`), Prisma schema & migrations (`backend/prisma/**`), Frontend components (`src/components/**`, `src/services/**`, `src/context/**`, `src/App.tsx`).
- **33 File REQUIRED (Nhóm B):** `docs/QUIZ_BUSINESS_RULES.md`, `public/images/nncn/*` (25 ảnh câu hỏi), tài liệu backend `README.md`, `DEMO_ACCOUNTS.md`, các bài test chuẩn `vitest` và config.

---

## GIAI ĐOẠN 8 — BÁO CÁO KẾT QUẢ THỰC HIỆN DỌN DẸP GIAI ĐOẠN 1 (ĐÃ HOÀN THÀNH)

> [!NOTE]
> **Tình trạng thực thi:** Giai đoạn 1 đã được thực hiện an toàn theo đúng phạm vi được phê duyệt có điều kiện của Chủ hệ thống. Chưa thực hiện commit, push, deploy hoặc can thiệp database.

### 1. Nhật ký các hành động đã thực hiện:

1. **Cập nhật `.gitignore` chuẩn hóa:**
   - Đã thêm các mẫu loại trừ vào `.gitignore`:
     - `*.tsbuildinfo` (loại trừ file cache của TypeScript compiler)
     - `__pycache__/` & `*.pyc`, `*.pyo` (loại trừ bytecode Python)
     - `backups/*.sql` (bảo vệ các file backup cơ sở dữ liệu khỏi việc bị commit vào Git repo)
2. **Kiểm tra và xử lý nhóm TEMPORARY:**
   - **Đã xóa an toàn khỏi đĩa (4 files cache/bytecode):**
     - `backend/tsconfig.build.tsbuildinfo` (188 KB - TypeScript incremental build cache, tự động tái tạo khi build)
     - `backend/__pycache__/analyze_nncn.cpython-314.pyc` (Python bytecode)
     - `backend/__pycache__/parse_lsd_full.cpython-314.pyc` (Python bytecode)
     - `backend/__pycache__/parse_nncn_full.cpython-314.pyc` (Python bytecode)
   - **Được giữ lại an toàn (3 files Python scratch/audit):**
     - `extract_exact_10.py`
     - `scratch_audit_word_vs_db.py`
     - `scratch_compare_10.py`
     - *Lý do giữ lại:* Các file này chứa thuật toán bóc tách XML docx (`word/document.xml`, thẻ `w:rPr`, `w:color`, text runs). Đây là tư liệu mã nguồn quan trọng phục vụ phân tích thiết kế bộ import hợp nhất đa môn học.
3. **Bảo tồn an toàn tuyệt đối các thành phần khác:**
   - Giữ nguyên 4 file backup SQL trong `backups/` (`ontap_db_backup_20261106.sql`...).
   - Giữ nguyên toàn bộ 19 file script nhóm REDUNDANT.
   - Giữ nguyên 5 file JSON trung gian sau parse.
   - Giữ nguyên 25 file ảnh trong `public/images/nncn/`.
   - Giữ nguyên chuỗi Prisma migrations và database PostgreSQL.
4. **Kiểm tra biên dịch hệ thống (Build verification):**
   - **Backend NestJS:** `npm run build` tại thư mục `backend/` -> **THÀNH CÔNG (Exit code 0, 0 errors)**.
   - **Frontend Vite:** `npm run build` tại thư mục gốc -> **THÀNH CÔNG (Exit code 0, 2062 modules transformed, built in 2.17s)**.
5. **Biến động số lượng Git Changes:**
   - Trước khi dọn: **140 files**.
   - Đã loại trừ khỏi Git: **8 files** (4 file `backups/*.sql`, 1 file `.tsbuildinfo`, 3 file `.pyc`).
   - File tài liệu mới bổ sung: **+1 file** (`docs/REPOSITORY_CLEANUP_AUDIT.md`).
   - Hiện tại hiển thị trên Git: **133 files**.

---
*Báo cáo kiểm toán được thiết lập tự động và chuẩn xác bởi Antigravity Assistant.*