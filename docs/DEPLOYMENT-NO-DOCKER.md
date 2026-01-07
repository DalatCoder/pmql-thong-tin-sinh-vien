# Hướng dẫn triển khai trên VPS (Không dùng Docker)

Tài liệu hướng dẫn chi tiết deploy hệ thống PMQL Thông tin Sinh viên trực tiếp trên VPS với aaPanel, không sử dụng Docker.

---

## Yêu cầu

- **VPS**: Ubuntu 20.04+ / CentOS 7+, tối thiểu 2GB RAM, 20GB SSD
- **aaPanel**: Đã cài đặt
- **Domain**: Đã trỏ về IP của VPS

---

## Bước 1: Cài đặt các thành phần cần thiết

### 1.1. Đăng nhập SSH

```bash
ssh root@your-vps-ip
```

### 1.2. Cài đặt Node.js 20

```bash
# Cài nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Cài Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Kiểm tra
node --version  # v20.x.x
npm --version
```

### 1.3. Cài đặt PostgreSQL trên aaPanel

1. Đăng nhập aaPanel (`http://your-vps-ip:8888`)
2. Vào **App Store** → Tìm **PostgreSQL** → **Install**
3. Hoặc qua SSH:

```bash
# Ubuntu
apt update
apt install postgresql postgresql-contrib -y

# Start service
systemctl start postgresql
systemctl enable postgresql
```

### 1.4. Cài đặt PM2 (Process Manager)

```bash
npm install -g pm2
```

---

## Bước 2: Cấu hình PostgreSQL

### 2.1. Tạo database và user

```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Tạo user
CREATE USER pmql_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';

# Tạo database
CREATE DATABASE pmql_sinh_vien OWNER pmql_user;

# Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE pmql_sinh_vien TO pmql_user;

# Thoát
\q
```

### 2.2. Cấu hình cho phép kết nối local

Sửa file `pg_hba.conf`:

```bash
# Tìm file
sudo find /etc -name "pg_hba.conf" 2>/dev/null

# Sửa file (đường dẫn có thể khác)
nano /etc/postgresql/14/main/pg_hba.conf
```

Thêm dòng:
```
local   all   pmql_user   md5
host    all   pmql_user   127.0.0.1/32   md5
```

Restart PostgreSQL:
```bash
systemctl restart postgresql
```

---

## Bước 3: Clone và cấu hình dự án

### 3.1. Clone dự án

```bash
cd /www/wwwroot
git clone https://github.com/your-repo/pmql-thong-tin-sinh-vien.git
cd pmql-thong-tin-sinh-vien
```

### 3.2. Cài đặt dependencies

```bash
npm install
```

### 3.3. Tạo file .env

```bash
cp .env.example .env
nano .env
```

Nội dung file `.env`:

```env
# Database
DATABASE_URL="postgresql://pmql_user:YOUR_SECURE_PASSWORD@localhost:5432/pmql_sinh_vien?schema=public"

# NextAuth
# Tạo secret: openssl rand -base64 32
AUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
AUTH_URL="https://pmql.your-domain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Portal API
PORTAL_API_KEY="pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzvL2auxaFJBvw=="
PORTAL_CLIENT_ID="vhu"
```

### 3.4. Tạo secret key

```bash
openssl rand -base64 32
# Copy kết quả vào AUTH_SECRET trong .env
```

---

## Bước 4: Build dự án

### 4.1. Chạy Prisma Migration

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4.2. Build Next.js

```bash
npm run build
```

Quá trình build sẽ mất 1-3 phút.

---

## Bước 5: Chạy với PM2

### 5.1. Tạo ecosystem file

```bash
nano ecosystem.config.js
```

Nội dung:

```javascript
module.exports = {
  apps: [
    {
      name: "pmql-app",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      cwd: "/www/wwwroot/pmql-thong-tin-sinh-vien",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
```

### 5.2. Khởi động app

```bash
pm2 start ecosystem.config.js

# Xem status
pm2 status

# Xem logs
pm2 logs pmql-app
```

### 5.3. Cấu hình tự động khởi động khi reboot

```bash
pm2 startup
pm2 save
```

---

## Bước 6: Cấu hình Nginx (aaPanel)

### 6.1. Tạo Website trên aaPanel

1. Vào **Website** → **Add site**
2. Nhập domain: `pmql.your-domain.com`
3. PHP Version: **Pure static**
4. **Submit**

### 6.2. Cấu hình Reverse Proxy

**Cách 1: Qua aaPanel UI**

1. Click vào site → **Reverse proxy**
2. **Add reverse proxy**:
   - Name: `nextjs`
   - Target URL: `http://127.0.0.1:3001`
3. **Submit**

**Cách 2: Chỉnh sửa Nginx config**

1. Click vào site → **Config**
2. Thay nội dung trong block `server`:

```nginx
server {
    listen 80;
    server_name pmql.your-domain.com;
    
    # Logs
    access_log /www/wwwlogs/pmql.your-domain.com.log;
    error_log /www/wwwlogs/pmql.your-domain.com.error.log;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
}
```

3. **Save** và **Reload Nginx**

---

## Bước 7: Cấu hình SSL

### 7.1. Let's Encrypt qua aaPanel

1. Vào site → tab **SSL**
2. Chọn **Let's Encrypt**
3. Chọn domain → **Apply**
4. Bật **Force HTTPS**

### 7.2. Cập nhật AUTH_URL

```bash
nano /www/wwwroot/pmql-thong-tin-sinh-vien/.env
# Đổi AUTH_URL="https://pmql.your-domain.com"

# Restart app
pm2 restart pmql-app
```

---

## Bước 8: Cấu hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Vào **APIs & Services** → **Credentials**
3. Chọn OAuth Client đã tạo, thêm:
   - **Authorized JavaScript origins**: `https://pmql.your-domain.com`
   - **Authorized redirect URIs**: `https://pmql.your-domain.com/api/auth/callback/google`
4. **Save**

---

## Quản lý & Bảo trì

### PM2 Commands

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs pmql-app
pm2 logs pmql-app --lines 100

# Restart
pm2 restart pmql-app

# Stop
pm2 stop pmql-app

# Delete
pm2 delete pmql-app

# Monitor CPU/RAM
pm2 monit
```

### Update code

```bash
cd /www/wwwroot/pmql-thong-tin-sinh-vien

# Pull code mới
git pull

# Cài dependencies (nếu có thay đổi)
npm install

# Run migrations (nếu có)
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart pmql-app
```

### Backup Database

```bash
# Backup
pg_dump -U pmql_user -h localhost pmql_sinh_vien > backup_$(date +%Y%m%d).sql

# Restore
psql -U pmql_user -h localhost pmql_sinh_vien < backup.sql
```

---

## Troubleshooting

### App không khởi động

```bash
# Xem logs chi tiết
pm2 logs pmql-app --lines 200

# Kiểm tra .env
cat .env

# Thử chạy trực tiếp
npm run start
```

### Database connection failed

```bash
# Test kết nối
psql -U pmql_user -h localhost -d pmql_sinh_vien

# Kiểm tra PostgreSQL status
systemctl status postgresql

# Xem logs PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log
```

### 502 Bad Gateway

```bash
# Kiểm tra app đang chạy
pm2 status

# Test local
curl http://localhost:3001

# Kiểm tra Nginx error log
tail -f /www/wwwlogs/pmql.your-domain.com.error.log
```

### Build failed

```bash
# Xóa cache và build lại
rm -rf .next
npm run build

# Nếu thiếu memory
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Permission issues

```bash
# Set ownership
chown -R www:www /www/wwwroot/pmql-thong-tin-sinh-vien

# Fix node_modules
rm -rf node_modules
npm install
```

---

## So sánh với Docker

| Tiêu chí | Không Docker | Docker |
|----------|--------------|--------|
| Setup ban đầu | Phức tạp hơn | Đơn giản hơn |
| Tài nguyên | Nhẹ hơn | Tốn thêm overhead |
| Update code | Nhanh hơn | Cần rebuild image |
| Isolation | Không | Có |
| Portability | Thấp | Cao |
| Debug | Dễ hơn | Khó hơn một chút |

---

## Cấu trúc thư mục

```
/www/wwwroot/pmql-thong-tin-sinh-vien/
├── .env                    # Cấu hình môi trường
├── .next/                  # Build output
├── node_modules/           # Dependencies
├── prisma/                 # Database schema
├── src/                    # Source code
├── ecosystem.config.js     # PM2 config
└── package.json
```

---

## Checklist triển khai

- [ ] Cài Node.js 20
- [ ] Cài PostgreSQL
- [ ] Tạo database và user
- [ ] Clone dự án
- [ ] Cấu hình .env
- [ ] Chạy prisma migrate
- [ ] Build dự án
- [ ] Cấu hình PM2
- [ ] Cấu hình Nginx reverse proxy
- [ ] Cấu hình SSL
- [ ] Cấu hình Google OAuth
- [ ] Test đăng nhập
- [ ] Cấu hình PM2 startup
