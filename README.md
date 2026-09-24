# 💰 Expense Tracker - Ứng Dụng Quản Lý Chi Tiêu Cá Nhân

<p align="center">
  <img src="./assets/icon.png" width="100" height="100" alt="Expense Tracker Logo" style="border-radius: 20px;" />
</p>

<p align="center">
  <strong>Ứng dụng quản lý tài chính & chi tiêu cá nhân thông minh, bảo mật, tự động nhận diện biến động số dư ngân hàng và chạy ngầm theo mô hình Offline-First trên nền tảng React Native & Expo.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.0.5-4F46E5?style=for-the-badge" alt="Version 1.0.5" />
  <img src="https://img.shields.io/badge/Expo-v57.0-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-v0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-v5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-Offline_First-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Zustand-State_Management-443e38?style=for-the-badge" alt="Zustand" />
  <img src="https://img.shields.io/badge/Play_Protect-100%25_Clean-10B981?style=for-the-badge&logo=google-play&logoColor=white" alt="Play Protect Safe" />
</p>

---

## 🌟 Giới Thiệu (Overview)

**Expense Tracker** là ứng dụng di động giúp bạn quản lý tài chính và thu chi cá nhân một cách chặt chẽ, tức thời, trực quan và an toàn tuyệt đối.
* **100% Ngoại tuyến (Offline-First)**: Lưu trữ toàn bộ dữ liệu trên thiết bị bằng SQLite, bảo mật tuyệt đối, không gửi bất kỳ thông tin chi tiêu hay số dư nào lên máy chủ đám mây của bên thứ ba.
* **Tự động nhận diện biến động ngân hàng (SePay Open Banking & Bank Parser)**: Đồng bộ biến động từ hầu hết các ngân hàng tại Việt Nam (*Vietcombank, MBBank, Techcombank, TPBank, VPBank, ACB, BIDV, VietinBank, MoMo, ZaloPay...*).
* **Chạy ngầm tự động (Headless Background Sync)**: Tích hợp Android WorkManager và AlarmManager ở tầng lõi `index.ts`, tự động kiểm tra giao dịch và đẩy thông báo ngay cả khi **đã đóng hoàn toàn ứng dụng** hoặc **màn hình điện thoại đang khóa**.
* **Tác vụ nhanh trên thanh thông báo (Notification Bar Quick Actions)**: Thao tác 1 chạm trực tiếp trên thanh thông báo Android:
  - `[⚡ Ghi nhận ngay]`: Lưu giao dịch vào ví và danh mục thông minh tức thì.
  - `[✏️ Xem chi tiết]`: Mở app và kích hoạt ngay Dynamic Island / Modal chỉnh sửa.
  - `[❌ Bỏ qua]`: Loại bỏ giao dịch khỏi hàng đợi mà không ghi sổ.
* **Thanh Dynamic Island Banner**: Khi đang mở ứng dụng, thanh đảo thông minh nổi bật từ cạnh trên màn hình cho phép duyệt và xác nhận khoản chi chỉ với 1 chạm.
* **Tự động cập nhật ứng dụng (In-App Updater)**: Tự động kiểm tra bản phát hành mới trên GitHub Releases, tải file APK với thanh tiến trình trực quan và cài đặt trực tiếp không qua CH Play.
* **An toàn Google Play Protect**: Không sử dụng các quyền can thiệp nhạy cảm (Accessibility hay SMS), cài đặt mượt mà trên mọi thiết bị Android mà **không bị Play Protect cảnh báo**.

---

## 📥 Tải & Cài Đặt Ứng Dụng (Installation)

1. Truy cập mục [GitHub Releases](https://github.com/tranvanhung2609/expense-tracker/releases/latest) của dự án.
2. Tải về file `ExpenseTracker-vX.X.X.apk` mới nhất.
3. Mở file APK trên điện thoại Android và chọn **Cài đặt**.
4. Khởi chạy ứng dụng và thực hiện tour giới thiệu 5 bước để làm quen các tính năng.

---

## ⚡ Hướng Dẫn Kích Hoạt Tự Động Ghi Chép Qua SePay (1 Phút)

Ứng dụng hỗ trợ kết nối trực tiếp với cổng Open Banking **[SePay (sepay.vn)](https://sepay.vn)**:

1. **Đăng ký tài khoản SePay**: Truy cập [my.sepay.vn](https://my.sepay.vn) và đăng ký tài khoản miễn phí.
2. **Liên kết tài khoản ngân hàng**: Vào mục **Tài khoản ngân hàng** ➔ Thêm tài khoản ngân hàng bạn muốn theo dõi.
3. **Lấy API Token**:
   - Truy cập: [my.sepay.vn/companyapi](https://my.sepay.vn/companyapi) (hoặc vào mục **Cấu hình Công ty** ➔ **API Access**).
   - Bấm **+ Thêm API**, đặt tên (ví dụ: `ExpenseTracker Mobile`), chọn trạng thái `Hoạt động` và bấm **Thêm**.
   - Sao chép chuỗi mã Token vừa được cấp.
4. **Kích hoạt trên ứng dụng**:
   - Mở app **Expense Tracker** ➔ Vào tab **Cài đặt** ➔ chọn **Cấu hình SePay (API & Webhook)**.
   - Dán mã Token vào ô **SePay API Token** và bấm **"Kiểm tra & Lưu kết nối"**.
5. **Cấp quyền chạy ngầm không giới hạn (Quan trọng cho Android)**:
   - Trong tab Cài đặt hoặc trong popup SePay, bấm vào mục **"Chạy ngầm không giới hạn (Tắt tối ưu pin)"**.
   - Chọn **Không hạn chế (Unrestricted)** để hệ điều hành không đóng băng tiến trình ngầm khi bạn tắt màn hình.
   - Bấm nút **"Thử thông báo"** để kiểm tra hoạt động của 3 nút tác vụ nhanh trên thanh thông báo.

---

## 🔔 Cơ Chế Nhận Diện & Tác Vụ Thanh Thông Báo (Notification System)

| Tình huống | Hành vi ứng dụng |
| :--- | :--- |
| **Khi app đang mở (Active)** | Thông báo hệ thống được ẩn, thanh **Dynamic Island Banner** lập tức trượt xuống từ đỉnh màn hình với danh mục tự động đề xuất, nút xác nhận và chọn nhanh danh mục ăn uống, cà phê, mua sắm. |
| **Khi app chạy ngầm / đóng (Background / Killed)** | Tiến trình Headless Task định kỳ kéo giao dịch từ SePay và bắn thông báo ưu tiên cao ra thanh trạng thái (Notification Bar) và màn hình khóa kèm 3 nút tác vụ: `[⚡ Ghi nhận ngay]`, `[✏️ Xem chi tiết]`, `[❌ Bỏ qua]`. |
| **Bấm `⚡ Ghi nhận ngay`** | Giao dịch được lưu trực tiếp vào cơ sở dữ liệu SQLite và ví mặc định ngay lập tức mà không cần mở app. |
| **Bấm `✏️ Xem chi tiết` hoặc chạm thông báo** | Ứng dụng mở ra (hỗ trợ cả Cold Start từ trạng thái tắt hoàn toàn), hiển thị ngay màn hình chi tiết để bạn kiểm tra số tiền, sửa ghi chú hoặc đổi ví/danh mục. |
| **Bấm `❌ Bỏ qua`** | Bỏ qua giao dịch chờ và đóng thông báo mà không ghi vào sổ chi tiêu. |

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết (User Guide)

### 1. Quản lý Danh sách Ví (Wallets)
- Vào tab **Ví**: Quản lý nhiều tài khoản ví (*Tiền mặt, Tài khoản ngân hàng, Thẻ tín dụng, Ví điện tử...*).
- Bấm **"+"** để thêm ví mới với màu sắc và icon riêng biệt.
- **Chuyển tiền giữa các ví (Transfer)**: Ghi nhận luân chuyển tiền (rút tiền ATM, chuyển khoản giữa các ví) mà không làm biến động tổng thu chi.

### 2. Ghi chép Thu / Chi thủ công
- Bấm nút tròn **"+"** nổi bật ở thanh điều hướng.
- Bàn phím số tích hợp máy tính mini (cộng, trừ, nhân, chia) hỗ trợ tính nhanh hóa đơn.
- Chọn danh mục, ngày giờ, ví thanh toán và nhập ghi chú.

### 3. Ngân sách & Hạn mức Chi tiêu (Budget)
- Vào tab **Ngân sách**: Đặt hạn mức chi tiêu hàng tháng cho từng danh mục (*Ăn uống, Mua sắm, Di chuyển...*).
- Theo dõi tiến độ chi tiêu theo thời gian thực: Cảnh báo vàng khi vượt 80% và cảnh báo đỏ khi chạm 100% hạn mức.

### 4. Báo cáo & Phân tích Dòng tiền (Analytics)
- Vào tab **Báo cáo**:
  - Biểu đồ tròn phân bổ cơ cấu chi tiêu theo danh mục.
  - Biểu đồ cột so sánh tương quan Thu và Chi theo Tuần / Tháng / Quý.
  - Danh sách top các khoản chi tiêu lớn nhất trong kỳ.

### 5. Sao lưu, Xuất CSV & Khôi phục Dữ liệu
- Vào tab **Cài đặt** ➔ **Sao lưu & Lưu trữ**:
  - **Xuất bảng tính CSV**: Xem và quản lý chi tiêu trên Excel hoặc Google Sheets.
  - **Sao lưu toàn bộ (JSON)**: Xuất file backup chứa toàn bộ ví, danh mục, giao dịch và hạn mức.
  - **Khôi phục dữ liệu**: Nạp lại dữ liệu dễ dàng khi đổi thiết bị.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện |
| :--- | :--- |
| **Framework** | [React Native 0.86](https://reactnative.dev/), [Expo SDK 57](https://expo.dev/) (New Architecture) |
| **Routing / Navigation** | [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based Routing) |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) |
| **Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Local SQLite Storage) |
| **Background Tasks** | [expo-task-manager](https://docs.expo.dev/versions/latest/sdk/task-manager/), [expo-background-fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/) |
| **Notifications** | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) (Interactive Notification Categories & Actions) |
| **In-App Updater** | [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/), [expo-intent-launcher](https://docs.expo.dev/versions/latest/sdk/intent-launcher/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **UI & Animations** | [React Native Paper](https://callstack.github.io/react-native-paper/), [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| **Forms & Validation** | `react-hook-form`, `zod` |
| **CI/CD** | GitHub Actions (Lint, Typecheck, Build Release APK ký Keystore tự động) |

---

## 💻 Dành Cho Lập Trình Viên (Developer Guide)

### 1. Khởi chạy cục bộ
```bash
# Cài đặt thư viện
npm install

# Khởi động Metro Bundler
npx expo start
```
- Nhấn `a` để chạy trên thiết bị Android Emulator hoặc điện thoại thật kết nối USB Debugging.

### 2. Kiểm tra lỗi kiểu dữ liệu (TypeScript)
```bash
npm run typecheck
```

### 3. Đóng gói APK Release với GitHub Actions
Dự án tích hợp sẵn GitHub Actions workflow tại `.github/workflows/build-apk.yml`. Khi bạn tạo một tag mới (ví dụ `v1.0.5`), hệ thống sẽ:
1. Cấu hình môi trường Node 22, Java 17 và Android SDK.
2. Chạy `npx expo prebuild` tạo native project Android.
3. Biên dịch bản Release APK với Gradle.
4. Ký chứng chỉ tự động bằng file Keystore cấu hình trên GitHub Secrets.
5. Đẩy file APK lên GitHub Releases để người dùng tải về cài đặt.

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn có thể tự do sử dụng, tùy biến và đóng góp cho dự án.
