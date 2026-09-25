# 🚀 Hướng Dẫn Toàn Diện: Lấy API Keys, Thiết Lập GitHub & Publish Cloudflare cho StudyStream

Tài liệu này cung cấp hướng dẫn chi tiết từng bước từ **A đến Z** để lấy đầy đủ các API keys, thiết lập repository và secrets trên **GitHub**, đồng thời xuất bản (publish) hệ thống **StudyStream** lên **Cloudflare**.

---

## 📑 Mục Lục
1. [Kiến Trúc Triển Khai Production](#1-kiến-trúc-triển-khai-production)
2. [Phần 1: Hướng Dẫn Lấy Toàn Bộ API Keys & Cấu Hình Backend](#2-phần-1-hướng-dẫn-lấy-toàn-bộ-api-keys--cấu-hình-backend)
   - [2.1. Clerk Authentication (Xác thực người dùng)](#21-clerk-authentication-xác-thực-người-dùng)
   - [2.2. Convex Database & Realtime WebSocket Backend](#22-convex-database--realtime-websocket-backend)
   - [2.3. LiveKit Cloud (WebRTC SFU Camera/Micro)](#23-livekit-cloud-webrtc-sfu-cameramicro)
3. [Phần 2: Cấu Hình Trên GitHub](#3-phần-2-cấu-hình-trên-github)
   - [3.1. Tạo GitHub Repository & Đẩy Code (Push)](#31-tạo-github-repository--đẩy-code-push)
   - [3.2. Cấu Hình GitHub Actions Secrets](#32-cấu-hình-github-actions-secrets)
4. [Phần 3: Cấu Hình & Xuất Bản Lên Cloudflare](#4-phần-3-cấu-hình--xuất-bản-lên-cloudflare)
   - [4.1. Triển khai qua Cloudflare Pages (Khuyên dùng)](#41-triển-khai-qua-cloudflare-pages-khuyên-dùng)
   - [4.2. Cấu hình Biến Môi Trường (Environment Variables) trên Cloudflare](#42-cấu-hình-biến-môi-trường-environment-variables-trên-cloudflare)
   - [4.3. Cấu hình Custom Domain & Cloudflare DNS (Tối ưu WebRTC/WebSocket)](#43-cấu-hình-custom-domain--cloudflare-dns-tối-ưu-webrtcwebsocket)
5. [Phần 4: Bảng Kiểm Thử Nghiệm Thu (Smoke Testing Checklist)](#5-phần-4-bảng-kiểm-thử-nghiệm-thu-smoke-testing-checklist)
6. [Phần 5: Khắc Phục Sự Cố Phổ Biến (Troubleshooting)](#6-phần-5-khắc-phục-sự-cố-phổ-biến-troubleshooting)

---

## 1. Kiến Trúc Triển Khai Production

```
                               ┌───────────────────────────────────────────────┐
                               │             Người Dùng (Browser)              │
                               └───────┬───────────────────────────────┬───────┘
                                       │                               │
                       HTTPS / SSR     │                               │ WebRTC Audio/Video
                                       ▼                               ▼
                 ┌───────────────────────────────┐           ┌───────────────────┐
                 │       Cloudflare Pages        │           │   LiveKit Cloud   │
                 │   (Next.js 15 Edge/Static)    │           │ (WebRTC SFU Grid) │
                 └──────────────┬────────────────┘           └─────────▲─────────┘
                                │                                      │
                 Clerk JWT / WS │                                      │ Generate Token
                                ▼                                      │
                 ┌─────────────────────────────────────────────────────┴─┐
                 │                    Convex Backend                     │
                 │  (Reactive DB, Server-authoritative Pomo, Room State) │
                 └──────────────────────────────┬────────────────────────┘
                                                │
                               Webhook / Svix   ▼
                                 ┌────────────────────────┐
                                 │    Clerk Auth Core     │
                                 └────────────────────────┘
```

---

## 2. Phần 1: Hướng Dẫn Lấy Toàn Bộ API Keys & Cấu Hình Backend

### 2.1. Clerk Authentication (Xác thực người dùng)

#### Bước 1: Tạo ứng dụng trên Clerk
1. Truy cập [dashboard.clerk.com](https://dashboard.clerk.com) và đăng nhập.
2. Nhấp vào **"Add application"** (hoặc **"Create Application"**).
3. Đặt tên: `StudyStream`.
4. Chọn các phương thức đăng nhập: **Email**, **Google**, **GitHub** (tùy chọn).
5. Nhấp **"Create Application"**.

#### Bước 2: Lấy API Keys
1. Trong menu bên trái, vào mục **Configure** > **API Keys**.
2. Sao chép 2 giá trị:
   - `Publishable key` (Bắt đầu bằng `pk_test_...` hoặc `pk_live_...`) ➔ đặt vào:
     ```env
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
     ```
   - `Secret key` (Bắt đầu bằng `sk_test_...` hoặc `sk_live_...`) ➔ đặt vào:
     ```env
     CLERK_SECRET_KEY=sk_live_...
     ```

#### Bước 3: Cấu hình JWT Template (CỰC KỲ QUAN TRỌNG CHO CONVEX)
Convex cần xác thực token JWT được cấp phát từ Clerk:
1. Trong Clerk Dashboard, vào **Configure** > **JWT Templates**.
2. Nhấp vào nút **"+ New template"**.
3. Chọn template có sẵn tên là **Convex**.
4. Kiểm tra các thông số:
   - **Name**: phải đặt chính xác là `convex` (viết thường).
   - **Token lifetime**: 3600 giây (mặc định).
   - **Claims**: đảm bảo có trường:
     ```json
     {
       "aud": "convex"
     }
     ```
5. Sao chép giá trị tại dòng **Issuer** (Ví dụ: `https://fond-ladybird-34.clerk.accounts.dev` hoặc domain custom của bạn):
   ➔ Đặt vào:
   ```env
   CLERK_JWT_ISSUER_DOMAIN=https://YOUR_CLERK_INSTANCE.clerk.accounts.dev
   ```
6. Nhấp **"Apply changes"** (Lưu).

#### Bước 4: Cấu hình Clerk Webhooks (Đồng bộ User sang Convex)
1. Trong Clerk Dashboard, vào **Configure** > **Webhooks**.
2. Nhấp **"Add Endpoint"**.
3. Tại ô **Endpoint URL**, nhập URL HTTP actions của Convex (sẽ có sau bước 2.2):
   ```
   https://<YOUR-CONVEX-DEPLOYMENT-NAME>.convex.site/clerk-users-webhook
   ```
4. Tại mục **Subscribe to events**, tích chọn:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Nhấp **"Create"**.
6. Sau khi tạo, tại mục **Signing Secret**, nhấp biểu tượng con mắt để xem và sao chép mã (bắt đầu bằng `whsec_...`):
   ➔ Đặt vào:
   ```env
   CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
   ```

---

### 2.2. Convex Database & Realtime WebSocket Backend

Convex là nguồn dữ liệu thời gian thực (source of truth) cho StudyStream.

#### Bước 1: Đăng nhập và Triển khai Convex Production
1. Mở terminal tại thư mục dự án `studystream`:
   ```bash
   npx convex login
   ```
2. Triển khai lên Production:
   ```bash
   npx convex deploy
   ```
3. Sau khi lệnh chạy thành công, Convex CLI sẽ xuất ra:
   - `CONVEX_DEPLOYMENT`: Ví dụ `prod:studystream-prod-1234`
   - Production URL: `https://studystream-prod-1234.convex.cloud`
   - Production Site URL: `https://studystream-prod-1234.convex.site`

4. Ghi lại các giá trị:
   ```env
   CONVEX_DEPLOYMENT=prod:studystream-prod-1234
   NEXT_PUBLIC_CONVEX_URL=https://studystream-prod-1234.convex.cloud
   NEXT_PUBLIC_CONVEX_SITE_URL=https://studystream-prod-1234.convex.site
   ```

#### Bước 2: Thiết lập Biến Môi Trường Trên Convex Dashboard
Convex function cần các khóa bí mật để xác thực token và webhook:
1. Mở trang quản trị [dashboard.convex.dev](https://dashboard.convex.dev).
2. Chọn dự án `studystream` > chọn môi trường **Production**.
3. Vào **Settings** > **Environment Variables**.
4. Thêm các biến sau:

| Tên Biến Môi Trường | Giá Trị Cần Điền | Ghi Chú |
| :--- | :--- | :--- |
| `CLERK_JWT_ISSUER_DOMAIN` | `https://YOUR_CLERK_INSTANCE.clerk.accounts.dev` | Khớp với Issuer URL trong template Clerk |
| `CLERK_WEBHOOK_SIGNING_SECRET` | `whsec_...` | Lấy từ Clerk Webhook Signing Secret |
| `LIVEKIT_API_KEY` | `API...` | Lấy từ LiveKit Cloud (bước 2.3) |
| `LIVEKIT_API_SECRET` | `Secret...` | Lấy từ LiveKit Cloud (bước 2.3) |
| `NEXT_PUBLIC_LIVEKIT_WS_URL` | `wss://...livekit.cloud` | Lấy từ LiveKit Cloud (bước 2.3) |

---

### 2.3. LiveKit Cloud (WebRTC SFU Camera/Micro)

LiveKit xử lý hạ tầng truyền phát camera 100% qua trình duyệt mà không cần cài đặt phần mềm.

#### Bước 1: Tạo dự án LiveKit Cloud
1. Truy cập [cloud.livekit.io](https://cloud.livekit.io) và đăng ký tài khoản (miễn phí 50GB băng thông/tháng).
2. Nhấp vào **"Create Project"**.
3. Đặt tên: `studystream`.
4. Chọn cụm khu vực gần bạn nhất (ví dụ: `Singapore` hoặc `Tokyo` cho người dùng Đông Nam Á/Việt Nam).

#### Bước 2: Lấy API Credentials
1. Trong LiveKit Cloud Dashboard, vào mục **Settings** > **Keys**.
2. Nhấp **"Generate Key"** (hoặc dùng key mặc định đã tạo).
3. Bạn sẽ nhận được:
   - **WebSocket URL**: dạng `wss://studystream-xxxxxx.livekit.cloud`
   - **API Key**: dạng `APIxxxxxxxxxxxx`
   - **API Secret**: chuỗi ký tự bí mật

4. Ghi nhận các khóa:
   ```env
   LIVEKIT_API_KEY=APIxxxxxxxxxxxx
   LIVEKIT_API_SECRET=your_livekit_api_secret_here
   NEXT_PUBLIC_LIVEKIT_WS_URL=wss://studystream-xxxxxx.livekit.cloud
   ```

---

## 3. Phần 2: Cấu Hình Trên GitHub

### 3.1. Tạo GitHub Repository & Đẩy Code (Push)

Nếu bạn chưa tạo repository trên GitHub:
1. Truy cập [github.com/new](https://github.com/new).
2. Tạo repository mới tên là `studystream` (chọn **Private** để bảo vệ cấu hình).
3. Đẩy nhánh `main` từ máy cục bộ lên GitHub:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/studystream.git
   git push -u origin main
   ```
4. Nếu muốn đẩy cả nhánh phát triển `dev`:
   ```bash
   git push -u origin dev
   ```

### 3.2. Cấu Hình GitHub Actions Secrets

GitHub Actions đã được tích hợp sẵn file `.github/workflows/ci.yml` tự động kiểm tra Typecheck, Lint, Vitest và Build test.

Để CI Pipeline và các script tự động hóa chạy trơn tru:
1. Trên GitHub, vào repository **studystream** > **Settings**.
2. Tại menu bên trái, chọn **Secrets and variables** > **Actions**.
3. Nhấp nút **"New repository secret"** cho từng biến sau:

| Secret Name | Mô Tả |
| :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key (`pk_...`) |
| `CLERK_SECRET_KEY` | Clerk Secret Key (`sk_...`) |
| `CLERK_JWT_ISSUER_DOMAIN` | Domain Issuer của Clerk |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Signing secret của Svix webhook |
| `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL (`https://...convex.cloud`) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Production Convex Site URL (`https://...convex.site`) |
| `CONVEX_DEPLOYMENT` | Tên triển khai Convex (`prod:...`) |
| `LIVEKIT_API_KEY` | LiveKit API Key |
| `LIVEKIT_API_SECRET` | LiveKit API Secret |
| `NEXT_PUBLIC_LIVEKIT_WS_URL` | LiveKit WebSocket URL (`wss://...`) |

---

## 4. Phần 3: Cấu Hình & Xuất Bản Lên Cloudflare

Có 2 phương thức chính để triển khai StudyStream lên Cloudflare:

### 4.1. Triển khai qua Cloudflare Pages (Khuyên dùng)

Cloudflare Pages hỗ trợ kết nối trực tiếp với GitHub và tự động build mỗi khi push code lên nhánh `main`.

#### Bước 1: Kết nối GitHub Repository
1. Truy cập [dash.cloudflare.com](https://dash.cloudflare.com) và đăng nhập.
2. Vào mục **Workers & Pages** > chọn **Create application** > chọn tab **Pages**.
3. Chọn **"Connect to Git"**.
4. Cấp quyền truy cập GitHub và chọn repository `studystream`.

#### Bước 2: Thiết lập cấu hình Build (Build Settings)
1. **Project name**: `studystream` (hoặc tên tùy chọn).
2. **Production branch**: `main`.
3. **Framework preset**: Chọn `Next.js` (hoặc `None` nếu sử dụng OpenNext).
4. **Build command**:
   ```bash
   npx @cloudflare/next-on-pages@1
   ```
   *(Hoặc `npm run build` tùy theo cấu hình adapter)*
5. **Build output directory**:
   ```
   .vercel/output/static
   ```
6. **Node.js Compatibility Flag**:
   - Vào **Settings** > **Functions** > **Compatibility Flags**.
   - Thêm cờ: `nodejs_compat`.
   - Compatibility date: `2024-09-23` (hoặc ngày gần nhất).

---

### 4.2. Cấu hình Biến Môi Trường (Environment Variables) trên Cloudflare

Trong Cloudflare Dashboard:
1. Vào dự án Pages vừa tạo: **Settings** > **Environment variables**.
2. Nhấp **"Add variable"** tại mục **Production** (và **Preview** nếu muốn test PR).
3. Nhập đầy đủ danh sách biến sau:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/explore
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/explore
CLERK_JWT_ISSUER_DOMAIN=https://YOUR_CLERK_INSTANCE.clerk.accounts.dev
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://YOUR_PROD_DEPLOYMENT.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://YOUR_PROD_DEPLOYMENT.convex.site
CONVEX_DEPLOYMENT=prod:YOUR_PROD_DEPLOYMENT

# LiveKit
LIVEKIT_API_KEY=APIxxxxxxxxxxxx
LIVEKIT_API_SECRET=your_livekit_api_secret_here
NEXT_PUBLIC_LIVEKIT_WS_URL=wss://YOUR_PROJECT.livekit.cloud

# App
NEXT_PUBLIC_APP_URL=https://studystream.pages.dev
NODE_VERSION=20
```

4. Nhấp **"Save"** và nhấp **"Retry deployment"** để build lại trang.

---

### 4.3. Cấu hình Custom Domain & Cloudflare DNS (Tối ưu WebRTC/WebSocket)

Nếu bạn sở hữu tên miền riêng (ví dụ: `studystream.live` hoặc `studystream.vn`):

1. Vào Cloudflare Dashboard > **Workers & Pages** > chọn dự án `studystream` > chọn tab **Custom domains**.
2. Nhấp **"Set up a custom domain"** và nhập tên miền của bạn (ví dụ: `app.studystream.live`).
3. Cloudflare sẽ tự động tạo bản ghi CNAME trỏ đến Pages và cấp chứng chỉ SSL miễn phí.
4. **Cấu hình tối ưu mạng (Network Settings)**:
   - Vào tên miền trong Cloudflare > mục **Network**:
     - **WebSockets**: Bật **ON** (Cần thiết cho kết nối realtime Convex).
     - **gRPC**: Bật **ON**.
     - **HTTP/3 (with QUIC)**: Bật **ON** (Giảm độ trễ kết nối).
     - **0-RTT Connection Resumption**: Bật **ON**.
   - Vào mục **SSL/TLS**:
     - Đặt chế độ mã hóa: **Full (strict)**.

> [!NOTE]
> Luồng WebRTC Media (Camera/Mic) giữa trình duyệt và LiveKit SFU là kết nối trực tiếp ngang hàng/UDP (DTLS-SRTP), không đi qua proxy của Cloudflare nên sẽ đạt độ trễ cực thấp (< 50ms).

---

## 5. Phần 4: Bảng Kiểm Thử Nghiệm Thu (Smoke Testing Checklist)

Sau khi trang web đã được xuất bản (Publish) thành công, thực hiện quy trình kiểm thử 6 bước sau:

| STT | Hạng Mục Kiểm Thử | Thao Tác Kiểm Tra | Kết Quả Mong Đợi | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Landing Page** | Truy cập trang chủ `/` | Hiển thị giao diện Midnight Espresso, chuyển đổi ngôn ngữ VI/EN mượt mà | [ ] |
| 2 | **Xác thực Clerk** | Nhấp "Đăng nhập" / "Vào phòng" | Đăng nhập thành công bằng Email hoặc Google, chuyển hướng vào `/explore` | [ ] |
| 3 | **Đồng bộ User & Convex** | Đăng nhập lần đầu | Tên và avatar xuất hiện ở Sidebar, bản ghi user được tạo trong Convex DB | [ ] |
| 4 | **Tham gia Phòng Học** | Vào một phòng bất kỳ trên `/explore` | Kết nối tức thì không cần lobby chờ, nhận token LiveKit tự động | [ ] |
| 5 | **Camera & Pomodoro** | Bật Camera & theo dõi đồng hồ Pomo | Video hiển thị sắc nét trong lưới, đồng hồ đếm ngược đồng bộ toàn phòng | [ ] |
| 6 | **Âm thanh nền (Audio Dock)** | Mở thanh audio hoặc YouTube stream | Âm thanh phát mượt mà, chuyển trang vẫn phát liên tục không bị ngắt quãng | [ ] |

---

## 6. Phần 5: Khắc Phục Sự Cố Phổ Biến (Troubleshooting)

### 1. Lỗi: `getToken({ template: 'convex' }) trả về NULL`
- **Nguyên nhân**: Trong Clerk Dashboard chưa tạo template tên là `convex`.
- **Cách khắc phục**: Vào Clerk Dashboard > `JWT Templates` > tạo template mới với tên chính xác là `convex` và claims `{"aud": "convex"}` (xem mục 2.1 - Bước 3).

### 2. Lỗi: `aud mismatch! Token có aud="...", nhưng Convex cần aud="convex"`
- **Nguyên nhân**: JWT template trong Clerk thiếu claim `"aud": "convex"`.
- **Cách khắc phục**: Sửa claims trong JWT template của Clerk thành `{"aud": "convex"}` rồi lưu lại.

### 3. Lỗi: Webhook Svix báo `401 Unauthorized` hoặc `Signature verification failed`
- **Nguyên nhân**: Biến `CLERK_WEBHOOK_SIGNING_SECRET` trong Convex Dashboard không khớp với Signing Secret trong Clerk.
- **Cách khắc phục**: Sao chép lại chuỗi `whsec_...` từ Clerk Webhook Endpoint và dán vào Environment Variables của Convex Dashboard.

### 4. Lỗi: Video LiveKit không kết nối được (`Connection timed out` hoặc `Token expired`)
- **Nguyên nhân**: Khóa `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, hoặc `NEXT_PUBLIC_LIVEKIT_WS_URL` bị sai hoặc thiếu trong Convex Dashboard.
- **Cách khắc phục**: Kiểm tra lại 3 biến này trong cả Convex Dashboard lẫn Cloudflare Environment Variables.

---

*Tài liệu được cập nhật tự động cho phiên bản StudyStream Production Release.*
