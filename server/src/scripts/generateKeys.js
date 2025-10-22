import { writeFileSync, mkdirSync } from "fs";
import { generateKeyPairSync } from "crypto";

mkdirSync("./keys", { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" }, // -> -----BEGIN PUBLIC KEY-----
    privateKeyEncoding: { type: "pkcs1", format: "pem" }, // -> -----BEGIN RSA PRIVATE KEY-----
});

writeFileSync("./keys/private.pem", privateKey, { mode: 0o600 });
writeFileSync("./keys/public.pem", publicKey, { mode: 0o644 });

console.log("=".repeat(80));
console.log("✅ RSA keys generated at ./keys/private.pem & ./keys/public.pem");
console.log("🔧 Add to .env:");
console.log("RSA_PRIVATE_PATH=./keys/private.pem");
console.log("RSA_PUBLIC_PATH=./keys/public.pem");
console.log("=".repeat(80));
