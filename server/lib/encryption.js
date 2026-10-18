import dotenv from "dotenv"
import crypto from "node:crypto";
dotenv.config();


function getKey() {
  if (!/^[a-f0-9]{64}$/i.test(process.env.SMTP_SECRET || "")) {
    throw new Error("SMTP_SECRET must contain 64 hex characters.");
  }
  return Buffer.from(process.env.SMTP_SECRET, "hex");
}

export function encryptPassword(pass) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(pass, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedPassword: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

export function decryptPassword({ encryptedPassword, iv, authTag }) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPassword, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
