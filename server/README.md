## SET UP

**1.** tạo file `.env` và setting theo `.env.example` .

**2.** chạy `npm install` để cài đặt dependencies.

**3.** chạy `npm run generate-keys` để tạo RSA key pair và AES key.

**4.** chạy `npm run add_user` để tạo người dùng mới có sẵn .

```
{
    "username": "nguyencongquan9211@gmail.com",
    "password": "123456"
},
{
    "username": "karina@gmail.com",
    "password": "123456"
},
{
    "username": "sophia@gmail.com",
    "password": "123456"
}
```

**6.** chạy `npm run test-encryption` test xem mã hóa có hoạt động không.

```
-> Nếu hiện "✅ Match: YES" → Encryption OK.
```

**7.** chạy `npm run dev` để khởi động server.

## ⚙️ Cách Hoạt Động

### Gửi tin nhắn

```
Client → [Tin nhắn] → AES Encrypt → Server → Lưu DB (mã hóa)

```

### Nhận tin nhắn

```
DB (mã hóa) → Server → AES Decrypt → Client → Hiển thị

```

## 🧠 Security Notes

✅ **Hiện tại (Demo)**

-   AES mã hóa text

-   Lưu tin nhắn mã hóa trong DB

-   Tự động giải mã khi render

🔄 **Cần làm thêm (Production)**

-   End-to-End Encryption (E2EE)

-   Key Exchange (Diffie-Hellman)

-   Key Rotation

-   File/Image encryption

-   Key Management (AWS KMS, Azure Vault)

-   Perfect Forward Secrecy

## Flow

```
User A: "Hello World"
↓
Client A → Server (AES encrypt)
↓
Database: "U2FsdGVkX1+..."
↓
Server → Client B (AES decrypt)
↓
Client B: "Hello World"

```

---

## 📜 License

MIT License

---
