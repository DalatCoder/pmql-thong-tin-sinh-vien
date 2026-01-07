# Hướng dẫn triển khai trên VPS với aaPanel

Tài liệu hướng dẫn chi tiết deploy hệ thống PMQL Thông tin Sinh viên trên VPS sử dụng aaPanel và Docker.

---

## Yêu cầu

- **VPS**: Ubuntu 20.04+ / CentOS 7+, tối thiểu 2GB RAM, 20GB SSD
- **aaPanel**: Đã cài đặt và truy cập được
- **Domain**: Đã trỏ về IP của VPS

---

## Bước 1: Cài đặt Docker trên aaPanel

### 1.1. Đăng nhập aaPanel

Truy cập: `http://your-vps-ip:8888`

### 1.2. Cài đặt Docker

Vào **App Store** → Tìm **Docker Manager** → **Install**

Hoặc qua SSH:

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# Cài Docker Compose
apt install docker-compose-plugin -y
```

Kiểm tra:
```bash
docker --version
docker compose version
```

---

## Bước 2: Clone dự án

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Tạo thư mục
mkdir -p /www/wwwroot
cd /www/wwwroot

# Clone dự án
git clone https://github.com/your-repo/pmql-thong-tin-sinh-vien.git
cd pmql-thong-tin-sinh-vien
```

---

## Bước 3: Cấu hình môi trường

### 3.1. Tạo file .env

```bash
cp .env.production.example .env
nano .env
```

### 3.2. Cập nhật các giá trị

```env
# Database (Docker sẽ tự tạo)
DATABASE_URL="postgresql://postgres:YOUR_SECURE_PASSWORD@db:5432/pmql_sinh_vien?schema=public"

# NextAuth - Tạo secret mới
# Chạy: openssl rand -base64 32
AUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
AUTH_URL="https://your-domain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Portal API
PORTAL_API_KEY="pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzvL2auxaFJBvw=="
PORTAL_CLIENT_ID="vhu"
```

### 3.3. Cập nhật docker-compose.yml

Sửa password PostgreSQL:

```yaml
services:
  db:
    environment:
      - POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD  # Phải trùng với DATABASE_URL
```

---

## Bước 4: Build và chạy

```bash
# Build và start containers
docker compose up -d --build

# Xem logs
docker compose logs -f app

# Chờ app khởi động xong (khoảng 1-2 phút)
```

### 4.1. Chạy Prisma Migration

```bash
docker compose exec app npx prisma migrate deploy
```

### 4.2. Kiểm tra

```bash
# Xem status containers
docker compose ps

# Test app
curl http://localhost:3001
```

---

## Bước 5: Cấu hình Reverse Proxy trên aaPanel

### 5.1. Tạo Website

1. Vào **Website** → **Add site**
2. Nhập domain: `pmql.your-domain.com`
3. PHP Version: **Pure static** (không cần PHP)
4. **Submit**

### 5.2. Cấu hình Reverse Proxy

1. Click vào site vừa tạo
2. Chọn tab **Reverse proxy**
3. **Add reverse proxy**:
   - **Proxy Name**: `nextjs`
   - **Target URL**: `http://127.0.0.1:3001`
   - **Send domain**: `$host`
4. **Submit**

### 5.3. Cấu hình Nginx thủ công (nếu cần)

Vào **Config** của site, thêm vào block `server`:

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

---

## Bước 6: Cấu hình SSL

### 6.1. Let's Encrypt (Miễn phí)

1. Vào site → tab **SSL**
2. Chọn **Let's Encrypt**
3. Chọn domain → **Apply**
4. Bật **Force HTTPS**

### 6.2. Cập nhật AUTH_URL

```bash
nano .env
# Sửa: AUTH_URL="https://pmql.your-domain.com"

# Restart app
docker compose restart app
```

---

## Bước 7: Cấu hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Vào **APIs & Services** → **Credentials**
3. Chỉnh sửa OAuth Client:
   - **Authorized JavaScript origins**: `https://pmql.your-domain.com`
   - **Authorized redirect URIs**: `https://pmql.your-domain.com/api/auth/callback/google`
4. **Save**

---

## Bước 8: Quản lý & Bảo trì

### Xem logs
```bash
docker compose logs -f app
docker compose logs -f db
```

### Restart services
```bash
docker compose restart
```

### Update code
```bash
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

### Backup database
```bash
docker compose exec db pg_dump -U postgres pmql_sinh_vien > backup_$(date +%Y%m%d).sql
```

### Restore database
```bash
cat backup.sql | docker compose exec -T db psql -U postgres pmql_sinh_vien
```

---

## Troubleshooting

### App không khởi động
```bash
# Xem logs chi tiết
docker compose logs app

# Kiểm tra .env
cat .env
```

### Database connection failed
```bash
# Kiểm tra db container
docker compose ps db
docker compose logs db

# Restart db
docker compose restart db
```

### 502 Bad Gateway
- Kiểm tra app đang chạy: `docker compose ps`
- Kiểm tra port: `curl http://localhost:3001`
- Kiểm tra reverse proxy config

### Permission denied
```bash
chown -R www:www /www/wwwroot/pmql-thong-tin-sinh-vien
```

---

## Cấu trúc thư mục trên VPS

```
/www/wwwroot/pmql-thong-tin-sinh-vien/
├── .env                    # Cấu hình môi trường
├── docker-compose.yml      # Docker config
├── Dockerfile              # Build image
└── ... (source code)

Volumes:
├── postgres_data           # Database storage
```

---

## Firewall

Đảm bảo các port sau được mở:
- **80**: HTTP
- **443**: HTTPS
- **8888**: aaPanel (nên giới hạn IP)

Không cần mở port **3001** ra ngoài (chỉ dùng internal).

---

## Tài liệu tham khảo

- [aaPanel Documentation](https://www.aapanel.com/reference.html)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
