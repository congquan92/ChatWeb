# ChatWeb - End-to-End Encrypted Messaging System

Hệ thống chat web với **mã hóa đầu cuối (E2EE)** sử dụng **RSA-AES Hybrid Encryption**.

---

## 🎯 Hệ Thống Làm Gì?

**ChatWeb** là ứng dụng nhắn tin thời gian thực với mã hóa đầu cuối, đảm bảo:

-   ✅ **Chỉ người gửi và người nhận** có thể đọc được nội dung tin nhắn
-   ✅ **Server không thể giải mã** tin nhắn (không có private key)
-   ✅ **Tin nhắn được mã hóa** trước khi gửi lên server
-   ✅ **Private key lưu trên trình duyệt** (IndexedDB), không lưu server

---

## 🔐 Cơ Chế Mã Hóa

Hệ thống sử dụng **RSA-AES Hybrid Encryption**:

### 1. Đăng ký / Đăng nhập

```
Client                    Server                    Database
  |                          |                          |
  |----(1) Signup/Login----->|                          |
  |                          |                          |
  |                     (2) Tạo RSA Key Pair            |
  |                     (Public + Private)              |
  |                          |                          |
  |                     (3) Mã hóa Private Key          |
  |                          |---(4) Lưu Public Key---> |
  |                          |                          |
  |<--(5) Gửi Private Key----|                          |
  |                          |                          |
(6) Lưu Private Key vào IndexedDB
```

### 2. Gửi tin nhắn

```
Client A                                          Server                   Client B
   |                                                 |                         |
(1) Nhập: "Hello"                                    |                         |
   |                                                 |                         |
(2) Tạo AES Key ngẫu nhiên                           |                         |
   |                                                 |                         |
(3) Mã hóa "Hello" → "U2FsdGVkX1+..."                |                         |
   |                                                 |                         |
(4) Lấy Public Key của B                             |                         |
   |                                                 |                         |
(5) Mã hóa AES Key bằng Public Key của B             |                         |
   |                                                 |                         |
   |---(6) Gửi {encryptedMessage, encryptedAESKey}-> |                         |
   |                                                 |                         |
   |                                        (7) Lưu DB (đã mã hóa)             |
   |                                                 |                         |
   |                                     (8) Socket.IO realtime                |
   |                                                 |----(9) Gửi tin đã mã--->|
   |                                                 |                         |
   |                                                 |         (10) Lấy Private Key từ IndexedDB
   |                                                 |                         |
   |                                                 |         (11) Giải mã AES Key
   |                                                 |                         |
   |                                                 |         (12) Giải mã "Hello"
   |                                                 |                         |
   |                                                 |         (13) Hiển thị: "Hello"
```

### 3. Nhận tin nhắn

-   **Client B** lấy Private Key từ IndexedDB
-   Dùng Private Key giải mã AES Key
-   Dùng AES Key giải mã nội dung tin nhắn
-   Server **không thể** giải mã vì không có Private Key

---

## 🚀 Cài Đặt & Chạy

### Backend (Server)

```bash
cd server
npm install
npm run add_user       # Tạo user demo
npm run dev           # Chạy server (port 5001)
```

### Frontend (Client)

```bash
cd client
npm install
npm run dev           # Chạy client (port 5173)
```

### User Demo

```
Email: nguyencongquan9211@gmail.com | karina@gmail.com | sophia@gmail.com
Password: 123456
```

---

## 🛠️ Công Nghệ Sử Dụng

| Phần     | Công nghệ                                            |
| -------- | ---------------------------------------------------- |
| Frontend | React + TypeScript + Vite + TailwindCSS + Socket.IO  |
| Backend  | Node.js + Express + MongoDB + Socket.IO              |
| Mã hóa   | RSA (2048-bit) + AES (256-bit) + CryptoJS + node-rsa |
| Lưu trữ  | MongoDB (tin nhắn mã hóa), IndexedDB (private key)   |

---

## 📁 Cấu Trúc Dự Án

```
ChatWeb/
├── client/          # Frontend (React + TypeScript)
│   └── src/
│       ├── lib/encryption.ts    # Mã hóa/giải mã client-side
│       └── store/               # State management (Zustand)
│
└── server/          # Backend (Node.js + Express)
    └── src/
        ├── lib/encryption.js    # Tạo RSA keys, mã hóa private key
        ├── models/
        │   └── message.model.js # Schema: encryptedMessage + encryptedAESKey
        └── controller/
            └── message.controller.js  # Chỉ lưu/chuyển tiếp (không giải mã)
```

---

## 🔑 Bảo Mật

✅ **Đã Triển Khai**

-   End-to-End Encryption (E2EE)
-   RSA-AES Hybrid Encryption
-   Private Key lưu IndexedDB (không gửi lên server sau lần đầu)
-   Server không thể đọc nội dung tin nhắn
-   JWT Authentication + bcrypt hashing password

⚠️ **Lưu Ý**

-   Private key chỉ tồn tại trên trình duyệt (nếu xóa cache → mất key → không đọc được tin cũ)
-   Chưa hỗ trợ backup/restore private key
-   Chưa hỗ trợ multi-device (cùng tài khoản nhiều thiết bị)
-   Chưa mã hóa file/hình ảnh

---

## 📜 License

MIT License
