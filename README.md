# 💰 Expense Tracker - Ứng Dụng Quản Lý Chi Tiêu Cá Nhân

<p align="center">
  <img src="./assets/icon.png" width="100" height="100" alt="Expense Tracker Logo" style="border-radius: 20px;" />
</p>

<p align="center">
  <strong>Ứng dụng quản lý tài chính & chi tiêu cá nhân thông minh, bảo mật, tối ưu trải nghiệm người dùng trên nền tảng React Native & Expo.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-v57.0-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-v0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-v5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-Offline_First-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Zustand-State_Management-443e38?style=for-the-badge" alt="Zustand" />
</p>

---

## 🌟 Giới Thiệu (Overview)

**Expense Tracker** là ứng dụng di động được thiết kế nhằm giúp người dùng kiểm soát tài chính cá nhân một cách chặt chẽ, trực quan và an toàn. Ứng dụng hoạt động theo mô hình **Offline-First**, lưu trữ toàn bộ dữ liệu trên thiết bị bằng SQLite, đảm bảo tối đa tính riêng tư mà không phụ thuộc vào kết nối mạng.

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 1. 💳 Quản Lý Đa Ví (Multi-Wallet Management)
- Khởi tạo và quản lý nhiều nguồn tiền: **Tiền mặt, Tài khoản Ngân hàng, Ví điện tử, Thẻ tín dụng, Quỹ tiết kiệm**.
- Theo dõi số dư từng ví và tổng tài sản theo thời gian thực.
- Tính năng **Chuyển tiền nội bộ (Transfer)** giữa các ví với ghi chú và lịch sử chi tiết.

### 2. ⚡ Ghi Chép Giao Dịch Siêu Tốc (Quick Add & Keypad)
- Nhập nhanh giao dịch Thu (Income) / Chi (Expense) với bàn phím số tích hợp máy tính mini.
- Tự động gợi ý danh mục và lưu lại lịch sử chi tiêu.
- Chỉnh sửa, cập nhật hoặc xóa giao dịch dễ dàng.

### 3. 🎯 Quản Lý Ngân Sách Thông Minh (Budget Tracking)
- Thiết lập hạn mức chi tiêu theo tháng cho từng danh mục.
- Thanh tiến trình trực quan hiển thị % chi tiêu đã sử dụng.
- Cảnh báo tức thì khi chi tiêu đạt ngưỡng 80% hoặc vượt mức ngân sách (100%).

### 4. 📊 Phân Tích & Biểu Đồ Trực Quan (Analytics & Reports)
- Báo cáo phân bổ dòng tiền theo danh mục qua biểu đồ trực quan.
- So sánh tỷ lệ Thu - Chi qua các chu kỳ tuần, tháng, quý.
- Thống kê chi tiêu lớn nhất để kịp thời điều chỉnh kế hoạch tài chính.

### 5. 🔒 Bảo Mật Sinh Trắc Học (Biometric Security)
- Khóa ứng dụng an toàn với xác thực khuôn mặt (**Face ID**) hoặc vân tay (**Fingerprint**).
- Tùy chọn bật/tắt chế độ ẩn số dư tài sản trên màn hình trang chủ.

### 6. 🌓 Giao Diện Hiện Đại & Đa Dạng Chủ Đề
- Thiết kế chuẩn thẩm mỹ hiện đại với tông màu **Electric Royal Indigo** sang trọng.
- Hỗ trợ đầy đủ **Light Mode** và **Dark Mode** tự động theo hệ thống hoặc tùy chọn thủ công.

### 7. 💾 Sao Lưu, Xuất/Nhập Dữ Liệu (Backup & Export)
- Xuất lịch sử giao dịch ra file định dạng **CSV** để xem trên Excel / Google Sheets.
- Sao lưu toàn bộ cơ sở dữ liệu SQLite và khôi phục khi cần chuyển đổi thiết bị.

### 8. 🔄 Tự Động Cập Nhật (In-app Update Checker)
- Tích hợp dịch vụ kiểm tra phiên bản mới từ GitHub Releases và thông báo cập nhật ngay trong ứng dụng.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện |
| :--- | :--- |
| **Framework** | [React Native 0.86](https://reactnative.dev/), [Expo SDK 57](https://expo.dev/) (New Architecture) |
| **Routing / Navigation** | [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based Routing) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Local SQLite storage) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **UI Components** | [React Native Paper](https://callstack.github.io/react-native-paper/), [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| **Biometrics** | [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) |
| **Icons & Charts** | `@expo/vector-icons`, `react-native-svg`, `react-native-svg-charts` |
| **Form & Validation** | `react-hook-form`, `zod` |
| **CI/CD** | GitHub Actions (Lint, Typecheck, Build Release Android) |

---

## 📂 Cấu Trúc Thư Mục (Project Structure)

```text
expense-tracker/
├── .github/
│   └── workflows/              # GitHub Actions CI & Build APK
├── app/                        # Expo Router Pages
│   ├── (tabs)/                 # Bottom Tabs
│   │   ├── index.tsx           # Trang chủ & Tổng quan ví
│   │   ├── analytics.tsx       # Báo cáo & Thống kê
│   │   ├── budget.tsx          # Quản lý ngân sách
│   │   ├── categories.tsx      # Danh mục thu/chi
│   │   ├── wallets.tsx         # Quản lý danh sách ví
│   │   └── settings.tsx        # Cài đặt ứng dụng
│   ├── transaction/[id].tsx    # Chi tiết giao dịch
│   ├── transfer.tsx            # Màn hình chuyển khoản giữa các ví
│   ├── onboarding.tsx          # Hướng dẫn người dùng mới
│   └── _layout.tsx             # Root layout & Navigation providers
├── assets/                     # Icons, splash screen, hình ảnh
├── src/
│   ├── components/             # Reusable UI components
│   ├── constants/              # Theme, màu sắc, danh mục mặc định, enums
│   ├── db/                     # SQLite schema & DB client
│   ├── hooks/                  # Custom hooks (Theme, ...)
│   ├── repositories/           # Tầng truy xuất dữ liệu (Data Access Layer)
│   ├── services/               # Dịch vụ kiểm tra cập nhật, network, ...
│   ├── stores/                 # Zustand state stores
│   └── utils/                  # Tiện ích tiền tệ, ngày tháng, backup, CSV
├── app.json                    # Cấu hình Expo
├── eas.json                    # Cấu hình EAS Build
└── package.json                # Dependencies & scripts
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Getting Started)

### Yêu Cầu Tiên Quyết
- **Node.js**: >= 20.x
- **npm** hoặc **yarn**
- Ứng dụng **Expo Go** trên điện thoại (iOS / Android) hoặc giả lập (Android Studio / Xcode)

### 1. Clone dự án & cài đặt dependencies
```bash
# Clone repository
git clone https://github.com/<tai-khoan>/expense-tracker.git
cd expense-tracker

# Cài đặt thư viện
npm install
```

### 2. Khởi chạy ứng dụng
```bash
# Khởi động Metro Bundler
npx expo start
```

Sau khi chạy lệnh:
- **Quét mã QR** hiển thị trong terminal bằng ứng dụng camera (iOS) hoặc **Expo Go** (Android).
- Nhấn `a` để mở trên Android Emulator.
- Nhấn `w` để chạy thử nghiệm trên Web.

### 3. Kiểm tra mã nguồn (Validation)
```bash
# Kiểm tra TypeScript typecheck
npx tsc --noEmit
```

---

## 📱 Đóng Gói Ứng Dụng (Building Release)

Dự án đã được cấu hình sẵn GitHub Actions trong `.github/workflows/release-android.yml` và `eas.json` để tự động build file APK phát hành khi tạo Release/Tag trên GitHub.

Nếu muốn build APK cục bộ qua EAS CLI:
```bash
# Đăng nhập Expo EAS
npx eas-cli login

# Tạo bản build preview APK cho Android
npx eas-cli build --platform android --profile preview
```

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có thể tự do tham khảo, tái sử dụng và tùy biến theo nhu cầu cá nhân.
