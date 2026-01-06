# PMQL Thông tin Sinh viên

Hệ thống quản lý thông tin sinh viên cho giảng viên - Đại học Đà Lạt

## Tổng quan

Hệ thống cho phép giảng viên:
- Đồng bộ thông tin sinh viên từ Portal DLU
- Bổ sung thông tin liên hệ (SĐT, địa chỉ tạm trú, ghi chú...)
- Cung cấp API cho các hệ thống nội bộ khác

---

## Trạng thái chức năng

### ✅ Đã hoàn thành

#### Backend & Database
- [x] **Database Schema** - Prisma + PostgreSQL
  - Model: User, Student, Class, SyncLog, ApiKey
  - Lưu trữ thông tin Portal + thông tin bổ sung
- [x] **Authentication** - NextAuth.js v5
  - Google OAuth (giới hạn @dlu.edu.vn)
  - Phân quyền theo role
- [x] **Portal API Client** - Kết nối Portal DLU
  - Đăng nhập lấy token
  - Lấy danh sách sinh viên theo lớp
  - Lấy thông tin chi tiết sinh viên
- [x] **Sync Service** - Đồng bộ dữ liệu
  - Đồng bộ theo lớp
  - Đồng bộ theo mã sinh viên
  - Bảo toàn dữ liệu bổ sung khi sync

#### API Routes
- [x] `/api/auth/[...nextauth]` - NextAuth handlers
- [x] `/api/portal-auth` - Đăng nhập Portal (POST/GET/DELETE)
- [x] `/api/students` - Danh sách sinh viên (GET)
- [x] `/api/students/[id]` - Chi tiết & cập nhật (GET/PATCH)
- [x] `/api/sync` - Trigger sync & logs (POST/GET)
- [x] `/api/v1/students` - External API
- [x] `/api/v1/students/[studentId]` - External API detail

#### UI Dashboard
- [x] **Layout** - Sidebar, Header, Navigation
- [x] **Dashboard** - Stats cards, Quick actions
- [x] **Quản lý Sinh viên**
  - Bảng danh sách với pagination
  - Tìm kiếm theo tên/mã SV
  - Lọc theo lớp
- [x] **Chi tiết Sinh viên**
  - Hiển thị thông tin từ Portal
  - Form cập nhật thông tin bổ sung
- [x] **Quản lý Lớp học**
  - Danh sách lớp với sĩ số
  - Chi tiết lớp với danh sách SV
  - Thống kê nam/nữ
- [x] **Đồng bộ Dữ liệu**
  - Form đăng nhập Portal
  - Đồng bộ theo lớp/mã SV
  - Lịch sử đồng bộ

---

### ❌ Chưa hoàn thành

- [ ] **Cấu hình Google OAuth** - Cần CLIENT_ID và SECRET
- [ ] **API Documentation** - Swagger/OpenAPI
- [ ] **Deployment** - Vercel + Production DB
- [ ] **Background Sync** - Đồng bộ tự động định kỳ
- [ ] **Export dữ liệu** - Excel/CSV
- [ ] **Gửi email hàng loạt** - Thông báo sinh viên

---

## Cài đặt & Chạy

```bash
# 1. Clone và cài đặt
npm install

# 2. Cấu hình môi trường
cp .env.example .env
# Cập nhật DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET

# 3. Chạy migration
npx prisma migrate dev

# 4. Start dev server
npm run dev

# 5. Mở trình duyệt
open http://localhost:3000
```

---

## Tech Stack

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Next.js | 16 | React Framework |
| TypeScript | 5 | Type-safe |
| Prisma | 7 | ORM |
| PostgreSQL | - | Database |
| NextAuth.js | v5 | Authentication |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | - | UI Components |

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── (dashboard)/      # Dashboard pages
│   ├── api/              # API routes
│   └── login/            # Login page
├── components/
│   ├── features/         # Feature components
│   ├── layout/           # Layout components
│   └── ui/               # shadcn components
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   ├── portal-api.ts     # Portal API client
│   └── utils.ts          # Utilities
├── services/
│   └── sync.service.ts   # Sync logic
└── types/
    └── next-auth.d.ts    # Type extensions
```

---

## Liên hệ

Khoa Công nghệ Thông tin - Đại học Đà Lạt
