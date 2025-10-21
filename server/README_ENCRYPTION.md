# 🔐 Tích hợp Mã hóa AES + RSA cho ChatWeb

## ✅ Đã hoàn thành

Hệ thống chat của bạn đã được tích hợp **mã hóa lai (Hybrid Encryption)** sử dụng:

-   **AES-256-GCM**: Mã hóa nội dung tin nhắn
-   **RSA-2048**: Mã hóa khóa AES

## 📦 Các file đã được tạo/chỉnh sửa

### Files mới:

1. `src/lib/encryption.js` - Thư viện mã hóa/giải mã
2. `src/scripts/add-rsa-keys.js` - Script thêm RSA keys cho user hiện có
3. `src/scripts/test-encryption.js` - Script test mã hóa
4. `ENCRYPTION_GUIDE.md` - Hướng dẫn chi tiết
5. `SETUP.md` - Hướng dẫn cài đặt

### Files đã chỉnh sửa:

1. `src/models/user.model.js` - Thêm publicKey, privateKey
2. `src/models/message.model.js` - Thêm encryptedData, encryptedKey, iv
3. `src/controller/auth.controller.js` - Tạo RSA keys khi signup/login
4. `src/controller/message.controller.js` - Mã hóa/giải mã tin nhắn
5. `src/middleware/auth.middleware.js` - Update để lấy privateKey

## 🚀 Bắt đầu sử dụng

### Bước 1: Đã cài đặt dependencies ✓

```bash
npm install crypto-js node-rsa
```

### Bước 2: Chạy migration cho user hiện có

Nếu database đã có user, chạy lệnh này để thêm RSA keys:

```bash
node src/scripts/add-rsa-keys.js
```

### Bước 3: Test (tùy chọn)

```bash
node src/scripts/test-encryption.js
```

Kết quả mong đợi:

```
=== Testing Encryption System ===
✓ RSA keys generated successfully
✓ Message encrypted successfully
✓ Message decrypted successfully
✓ SUCCESS: Original message matches decrypted message!
=== All tests passed! ===
```

### Bước 4: Khởi động server

```bash
npm run dev
```

## 🔐 Cách hoạt động

### Flow mã hóa tin nhắn:

```
┌─────────┐                          ┌─────────┐
│ Sender  │                          │Receiver │
└────┬────┘                          └────┬────┘
     │                                     │
     │ 1. Gửi "Hello"                     │
     ├──────────────────►┌──────────┐     │
     │                   │  Server  │     │
     │                   └────┬─────┘     │
     │                        │           │
     │   2. Server lấy publicKey của Receiver
     │                        │           │
     │   3. Tạo khóa AES ngẫu nhiên      │
     │                        │           │
     │   4. Mã hóa "Hello" bằng AES      │
     │      → encryptedData               │
     │                        │           │
     │   5. Mã hóa khóa AES bằng RSA     │
     │      → encryptedKey                │
     │                        │           │
     │   6. Lưu DB:                       │
     │      {                             │
     │        encryptedData,              │
     │        encryptedKey,               │
     │        iv,                         │
     │        text: "[Encrypted]"         │
     │      }                             │
     │                        │           │
     │   7. Gửi tin nhắn đã mã hóa      │
     │                        ├──────────►│
     │                                    │
     │   8. Receiver yêu cầu tin nhắn    │
     │                   ◄────────────────┤
     │                        │           │
     │   9. Server giải mã:              │
     │      - Dùng privateKey giải mã    │
     │        encryptedKey → AES key     │
     │      - Dùng AES key giải mã       │
     │        encryptedData → "Hello"    │
     │                        │           │
     │   10. Trả về "Hello"              │
     │                        ├──────────►│
     │                                    │
```

## 📊 Dữ liệu trong Database

### Tin nhắn trước mã hóa:

```javascript
{
  senderId: "user1_id",
  receiverId: "user2_id",
  text: "Xin chào!",
  image: null
}
```

### Tin nhắn sau mã hóa:

```javascript
{
  senderId: "user1_id",
  receiverId: "user2_id",
  text: "[Encrypted]",
  image: null,
  encryptedData: "ec32617a480ad00def784cd62e8f542c:a1b2c3d4e5f6...",
  encryptedKey: "hnRVzPUM5x3HE7DsyX+m4YfX+Le74lQZBgQnK2+UWcU...",
  iv: "a1e70f9d0ef1ee3b5994d3c8ca2f90a1"
}
```

**Giải thích:**

-   `encryptedData`: Tin nhắn đã mã hóa bằng AES + Authentication Tag
-   `encryptedKey`: Khóa AES đã được mã hóa bằng RSA public key của người nhận
-   `iv`: Initialization Vector (16 bytes) cho AES
-   `text`: Placeholder "[Encrypted]"

## 🎯 API Changes

### 1. POST `/api/auth/signup`

**Response thêm:**

```json
{
    "data": {
        "_id": "...",
        "fullname": "...",
        "email": "...",
        "publicKey": "-----BEGIN PUBLIC KEY-----\nMII...",
        "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nMII..."
    }
}
```

### 2. POST `/api/auth/login`

**Response thêm:**

```json
{
    "data": {
        "publicKey": "-----BEGIN PUBLIC KEY-----...",
        "privateKey": "-----BEGIN RSA PRIVATE KEY-----..."
    }
}
```

### 3. GET `/api/messages/users` (getUserSidebar)

**Response:** Không trả về `privateKey` (bảo mật)

### 4. POST `/api/messages/send/:id`

**Không cần thay đổi từ client:**

```json
{
    "text": "Tin nhắn gốc"
}
```

Server tự động mã hóa trước khi lưu DB.

### 5. GET `/api/messages/:id`

**Response:** Tin nhắn đã được giải mã

```json
[
    {
        "_id": "...",
        "text": "Tin nhắn gốc", // Đã giải mã
        "senderId": "...",
        "receiverId": "..."
    }
]
```

## 🔧 Technical Details

### Thuật toán mã hóa:

1. **AES-256-GCM**

    - Key size: 256 bits (32 bytes)
    - Mode: GCM (Galois/Counter Mode)
    - IV size: 16 bytes
    - Cung cấp: Mã hóa + Xác thực (AEAD)

2. **RSA-2048**
    - Key size: 2048 bits
    - Padding: PKCS1
    - Dùng để mã hóa khóa AES

### Tại sao dùng Hybrid Encryption?

-   **RSA**: Chậm nhưng an toàn cho mã hóa asymmetric
-   **AES**: Nhanh và hiệu quả cho mã hóa symmetric
-   **Kết hợp**: Dùng RSA để mã hóa khóa AES nhỏ, dùng AES để mã hóa tin nhắn lớn

## 🔒 Security Notes

### ✅ Điểm mạnh:

1. Tin nhắn được mã hóa trong database
2. Mỗi tin nhắn có khóa AES riêng biệt (session key)
3. Khóa AES được bảo vệ bằng RSA
4. AES-GCM cung cấp authentication tag (chống giả mạo)
5. IV ngẫu nhiên cho mỗi tin nhắn (chống replay attack)

### ⚠️ Cần cải thiện:

1. **Private key trên server**: Hiện tại privateKey lưu trên server, nên chuyển sang client-side encryption thực sự (E2EE)
2. **HTTPS required**: Cần HTTPS để bảo vệ khi truyền tải
3. **Ảnh chưa mã hóa**: Chỉ URL được lưu, nội dung ảnh chưa mã hóa
4. **Key rotation**: Chưa có cơ chế thay đổi khóa định kỳ

### 💡 Roadmap cải thiện:

1. **Phase 2 - True E2EE**:

    - Mã hóa/giải mã hoàn toàn trên client
    - Private key chỉ lưu trên client (LocalStorage/IndexedDB)
    - Server chỉ chuyển tiếp dữ liệu mã hóa

2. **Phase 3 - Advanced Features**:
    - Key rotation
    - Forward secrecy (Diffie-Hellman)
    - Mã hóa file/ảnh
    - Group chat encryption

## 📝 Logs

Khi chạy server, bạn sẽ thấy:

```
Connected to database
Server running on port 5000
Socket.io connected: <socket_id>
```

Khi gửi tin nhắn, server sẽ tự động mã hóa (không có log riêng để tránh lộ thông tin).

## 🧪 Testing

### Test mã hóa:

```bash
node src/scripts/test-encryption.js
```

### Test với real server:

1. Đăng ký user mới
2. Kiểm tra response có `publicKey` và `privateKey`
3. Gửi tin nhắn
4. Kiểm tra MongoDB - tin nhắn phải có `encryptedData`, `encryptedKey`, `iv`
5. Đọc tin nhắn - phải nhận được tin nhắn gốc (đã giải mã)

## ❓ FAQ

**Q: Tin nhắn cũ có được mã hóa không?**  
A: Không. Chỉ tin nhắn mới được mã hóa. Tin nhắn cũ vẫn ở dạng plain text trong DB.

**Q: Làm sao để mã hóa tin nhắn cũ?**  
A: Cần viết script migration riêng, nhưng khó vì cần public key của người nhận lúc đó.

**Q: User cũ có RSA keys không?**  
A: Chạy `node src/scripts/add-rsa-keys.js` để thêm.

**Q: Có thể xem tin nhắn đã mã hóa trong DB không?**  
A: Có, nhưng chỉ thấy `encryptedData` (ciphertext), không đọc được nội dung.

**Q: Nếu mất privateKey thì sao?**  
A: Không thể giải mã tin nhắn. Cần implement key backup/recovery.

## 📚 Documentation

-   `SETUP.md` - Hướng dẫn cài đặt (file này)
-   `ENCRYPTION_GUIDE.md` - Chi tiết kỹ thuật
-   `src/lib/encryption.js` - Source code với comments

## 🎉 Kết luận

Hệ thống mã hóa đã hoạt động! Tin nhắn trong database đã được bảo vệ bằng AES-256-GCM + RSA-2048.

**Next steps:**

1. Chạy migration nếu có user cũ
2. Test với tin nhắn thực
3. Triển khai HTTPS
4. Cân nhắc chuyển sang E2EE hoàn toàn

Chúc bạn thành công! 🚀
