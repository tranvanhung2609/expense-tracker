# 💰 Expense Tracker - Ứng Dụng Quản Lý Chi Tiêu Cá Nhân

<p align="center">
  <img src="./assets/icon.png" width="100" height="100" alt="Expense Tracker Logo" style="border-radius: 20px;" />
</p>

<p align="center">
  <strong>Ứng dụng quản lý tài chính & chi tiêu cá nhân thông minh, bảo mật, tự động nhận diện biến động số dư ngân hàng theo mô hình Offline-First trên nền tảng React Native & Expo.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-v57.0-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-v0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-v5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-Offline_First-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Zustand-State_Management-443e38?style=for-the-badge" alt="Zustand" />
  <img src="https://img.shields.io/badge/Play_Protect-100%25_Clean-10B981?style=for-the-badge&logo=google-play&logoColor=white" alt="Play Protect Safe" />
</p>

---

## 🌟 Giới Thiệu (Overview)

**Expense Tracker** là ứng dụng di động giúp bạn kiểm soát tài chính cá nhân một cách chặt chẽ, trực quan và an toàn.
* **100% Ngoại tuyến (Offline-First)**: Lưu trữ toàn bộ dữ liệu trên thiết bị bằng SQLite, bảo mật tuyệt đối, không gửi bất kỳ dữ liệu chi tiêu nào lên máy chủ đám mây.
* **Tự động nhận diện ngân hàng**: Nhận thông báo biến động từ Vietcombank, MB, Techcombank, TPBank, VPBank, ACB, BIDV, VietinBank, MoMo, ZaloPay... và đẩy thanh **Dynamic Island Banner** nổi lên màn hình để xác nhận chỉ với 1 chạm.
* **An toàn Google Play Protect**: Sử dụng kiến trúc Cầu nối Tự động hóa (Automation Bridge via Deep Link), không xin quyền nhạy cảm trong hệ thống, cài đặt file APK trên mọi điện thoại Android mà **không bị Play Protect chặn**.

---

## 📥 Tải & Cài Đặt Ứng Dụng (Installation)

1. Truy cập mục [GitHub Releases](https://github.com/tranvanhung2609/expense-tracker/releases/latest) của dự án.
2. Tải về file `ExpenseTracker-vX.X.X.apk` mới nhất.
3. Mở file APK trên điện thoại Android và bấm **Cài đặt**.
   > **Lưu ý:** Ứng dụng đã được tinh chỉnh sạch hoàn toàn các quyền nhạy cảm, bạn có thể cài đặt mượt mà trên mọi thiết bị (Xiaomi/HyperOS, Samsung One UI, Oppo, Vivo, Pixel...).

---

## ⚡ Hướng Dẫn Kích Hoạt Tự Động Ghi Chép Qua SePay (1 Phút)

**Expense Tracker** hỗ trợ kết nối trực tiếp với hạ tầng Open Banking **[SePay (sepay.vn)](https://sepay.vn)** — giải pháp Fintech chính thống hàng đầu tại Việt Nam, hỗ trợ hầu hết các ngân hàng (Vietcombank, MB, Techcombank, TPBank, VPBank, ACB, BIDV, Agribank...):

1. **Đăng ký tài khoản SePay**: Truy cập [my.sepay.vn](https://my.sepay.vn) và tạo tài khoản miễn phí.
2. **Liên kết ngân hàng**: Vào mục **Tài khoản ngân hàng** ➔ Thêm tài khoản ngân hàng bạn muốn theo dõi biến động số dư.
3. **Lấy API Token**:
   - Vào mục **Tích hợp web / API** ➔ Bấm **Tạo API Key** và sao chép mã Token.
   - Mở app **Expense Tracker** ➔ Vào tab **Cài đặt** ➔ **Cấu hình SePay (API & Webhook)** ➔ Dán mã Token và bấm **"Kiểm tra & Lưu kết nối"**.

> 💡 **Trải nghiệm:** 
> - **Tự động đồng bộ khi mở app**: Hệ thống tự động kéo các giao dịch mới nhất từ SePay và phân loại danh mục thông minh.
> - **Thanh Dynamic Island Banner**: Khi có giao dịch mới, thanh Dynamic Island Banner sẽ lập tức nổi lên màn hình để bạn xác nhận với 1 chạm!
> - **Chống trùng lặp tuyệt đối**: Tự động khử trùng lặp giao dịch theo mã tham chiếu (`reference_number`), không bao giờ bị ghi trùng lặp.
> - **Hỗ trợ SePay Webhook**: Có sẵn công cụ giả lập & kiểm tra Webhook payload trực tiếp ngay trong ứng dụng.

---

## 📖 Hướng Dẫn Sử Dụng Cơ Bản (User Guide)

### 1. Quản lý Danh sách Ví (Wallets)
- Vào tab **Ví** (Wallets): Bạn có sẵn các ví mặc định (*Tiền mặt, Tài khoản ngân hàng, Thẻ tín dụng*).
- Bấm nút **"+"** để tạo ví mới (chọn tên ví, icon ngân hàng, màu sắc và số dư ban đầu).
- Tính năng **Chuyển tiền giữa các ví (Transfer)**: Hỗ trợ ghi nhận khi bạn rút tiền ATM về ví tiền mặt hoặc chuyển khoản giữa các ngân hàng.

### 2. Ghi chép Thu / Chi thủ công
- Bấm nút tròn **"+"** nổi bật ở thanh điều hướng dưới cùng.
- Chọn loại giao dịch: **Chi tiêu (Expense)** hoặc **Thu nhập (Income)**.
- Bàn phím số tích hợp sẵn máy tính (cộng, trừ, nhân, chia) giúp bạn tính nhanh tiền giỏ hàng/hóa đơn.
- Chọn danh mục tương ứng và bấm **"Lưu giao dịch"**.

### 3. Thiết lập Ngân sách Chi tiêu (Budget)
- Vào tab **Ngân sách** (Budget):
- Đặt hạn mức chi tiêu hàng tháng cho từng danh mục (ví dụ: *Ăn uống tối đa 4,000,000 đ/tháng*).
- Ứng dụng sẽ tự động cảnh báo màu vàng khi bạn dùng quá 80% ngân sách và cảnh báo đỏ khi chạm ngưỡng 100%.

### 4. Báo cáo & Phân tích Dòng tiền (Analytics)
- Vào tab **Báo cáo** (Analytics):
- Xem biểu đồ tròn phân bổ chi tiêu theo danh mục.
- Biểu đồ cột so sánh tương quan giữa Thu và Chi theo Tuần / Tháng / Quý.
- Danh sách top các khoản chi lớn nhất trong kỳ.

### 5. Sao lưu & Xuất dữ liệu (Backup & CSV)
- Vào tab **Cài đặt** (Settings) ➔ **Sao lưu & Lưu trữ**:
- **Xuất dữ liệu bảng tính CSV**: Xuất danh sách giao dịch ra file CSV để mở trên Microsoft Excel hoặc Google Sheets.
- **Sao lưu cơ sở dữ liệu**: Xuất file database SQLite ra bộ nhớ máy hoặc Google Drive để khôi phục khi đổi điện thoại.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện |
| :--- | :--- |
| **Framework** | [React Native 0.86](https://reactnative.dev/), [Expo SDK 57](https://expo.dev/) (New Architecture) |
| **Routing / Navigation** | [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based Routing) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Local SQLite Storage) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **UI Components** | [React Native Paper](https://callstack.github.io/react-native-paper/), [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| **Deep Link & Automation** | `expo-linking`, URL Scheme Integration (`expense-tracker://`) |
| **Biometrics** | [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) |
| **Icons & Charts** | `@expo/vector-icons`, `react-native-svg`, `react-native-svg-charts` |
| **Form & Validation** | `react-hook-form`, `zod` |
| **CI/CD** | GitHub Actions (Lint, Typecheck, Build Release APK ký Keystore tự động) |

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```text
expense-tracker/
├── .github/
│   └── workflows/              # GitHub Actions CI & Build APK
├── app/                        # Expo Router Pages
│   ├── (tabs)/                 # Bottom Navigation Tabs
│   │   ├── index.tsx           # Trang chủ & Danh sách ví
│   │   ├── analytics.tsx       # Báo cáo thống kê & Biểu đồ
│   │   ├── budget.tsx          # Quản lý hạn mức ngân sách
│   │   ├── categories.tsx      # Quản lý danh mục thu/chi
│   │   ├── wallets.tsx         # Quản lý ví tiền
│   │   └── settings.tsx        # Cài đặt ứng dụng & Tự động hóa
│   ├── transaction/[id].tsx    # Chi tiết giao dịch
│   ├── transfer.tsx            # Chuyển khoản giữa các ví
│   ├── onboarding.tsx          # Màn hình chào mừng người dùng mới
│   └── _layout.tsx             # Root layout & Deep link listener
├── assets/                     # Icons, splash screen, hình ảnh
├── docs/                       # Tài liệu kiến trúc & hướng dẫn chi tiết
│   ├── ARCHITECTURE.md         # Kiến trúc hệ thống
│   ├── AUTO_BANK_DETECTION.md  # Chi tiết giải pháp tự động hóa ngân hàng
│   ├── DATABASE_SCHEMA.md      # Thiết kế cơ sở dữ liệu SQLite
│   ├── DEVELOPMENT_GUIDE.md    # Hướng dẫn cho lập trình viên
│   └── RELEASE_GUIDE.md        # Hướng dẫn build & release APK
├── src/
│   ├── components/             # Reusable UI components & Dynamic Island
│   ├── constants/              # Theme, màu sắc, danh mục mặc định
│   ├── db/                     # SQLite schema & DB client
│   ├── hooks/                  # Custom React hooks
│   ├── repositories/           # Tầng truy xuất dữ liệu (Data Access Layer)
│   ├── services/               # DeepLink, Bank Parser, Auto Categorizer, Update
│   ├── stores/                 # Zustand state stores
│   └── utils/                  # Tiện ích tiền tệ, ngày tháng, backup, CSV
├── app.json                    # Cấu hình Expo
└── package.json                # Dependencies & scripts
```

---

## 💻 Dành Cho Lập Trình Viên (Developer Guide)

### 1. Khởi chạy cục bộ
```bash
# Cài đặt thư viện
npm install

# Khởi động Metro Bundler
npx expo start
```
- Nhấn `a` để mở ứng dụng trên thiết bị Android Emulator hoặc điện thoại thật qua USB Debugging.

### 2. Kiểm tra lỗi kiểu dữ liệu (TypeScript)
```bash
npm run typecheck
```

### 3. Đóng gói APK Release với GitHub Actions
Dự án đã tích hợp sẵn GitHub Actions workflow tại `.github/workflows/build-apk.yml`. Khi bạn tạo một tag mới (ví dụ `v1.0.2`), hệ thống sẽ:
1. Setup môi trường Java 17 và Android SDK.
2. Chạy `npx expo prebuild` tạo native project.
3. Biên dịch bản Release APK với Gradle.
4. Ký chứng chỉ tự động bằng file Keystore bí mật trên GitHub Secrets.
5. Đẩy file APK lên GitHub Releases để người dùng tải về cài đặt.

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có thể tự do sử dụng, chỉnh sửa và đóng góp cho dự án.
