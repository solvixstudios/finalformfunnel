// Simple encryption utility for sending sensitive data to backend
// In production, use a proper encryption library like crypto-js

const ENCRYPTION_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || "default-key-change-in-production";

export async function encryptData(data: string): Promise<string> {
  // Use Web Crypto API for encryption
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Create a key from the encryption key string
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    dataBuffer
  );

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export interface EncryptedCredentials {
  subdomain: string;
  encryptedClientId: string;
  encryptedClientSecret: string;
}

export async function encryptShopifyCredentials(
  subdomain: string,
  clientId: string,
  clientSecret: string
): Promise<EncryptedCredentials> {
  const [encryptedClientId, encryptedClientSecret] = await Promise.all([
    encryptData(clientId),
    encryptData(clientSecret),
  ]);

  return {
    subdomain,
    encryptedClientId,
    encryptedClientSecret,
  };
}
