# Decrypting Chat Messages in React Native

Chat message `content` returned by the backend (e.g. from **GET /chat/conversation/:id/messages** or in **lastMessage** on conversation list) is **encrypted** (AES-256-GCM, base64). Decrypt it in the app to show plaintext to the user.

You must use the **same secret** as the backend: `CHAT_MESSAGE_ENCRYPTION_KEY` (min 16 characters). Store it securely (e.g. in app config or fetch from a secure backend endpoint) and never commit it to the repo.

---

## Payload format (matches backend)

- One **base64** string.
- Decoded = **IV (12 bytes)** + **Auth tag (16 bytes)** + **Ciphertext**.
- Algorithm: **AES-256-GCM**.
- Key: 32 bytes from **scrypt(secret, salt, 32)** with salt `caregiver-chat-message-v1`.

---

## Option 1: Using `react-native-quick-crypto` + `@noble/hashes` (recommended)

`react-native-quick-crypto` does **not** provide `scryptSync` (even in recent versions like 0.7.x), so key derivation must be done separately. Use **@noble/hashes** for scrypt (same result as Node’s `crypto.scryptSync`) and **react-native-quick-crypto** only for AES-GCM decryption. This matches the backend behavior and works on all supported React Native / Expo setups.

### 1. Install

```bash
npm install react-native-quick-crypto @noble/hashes
# or
yarn add react-native-quick-crypto @noble/hashes
```

Use **react-native-quick-crypto** at a version that supports `createDecipheriv` (e.g. `"react-native-quick-crypto": "^0.7.17"` or newer). Follow the library’s setup (e.g. pod install for iOS, linking if needed).

### 2. Decrypt helper

```javascript
import { createDecipheriv } from 'react-native-quick-crypto';
import { scrypt } from '@noble/hashes/scrypt';
import { utf8ToBytes } from '@noble/hashes/utf8';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT = 'caregiver-chat-message-v1';

// Match Node's default scrypt params so the key is identical to the backend
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

/**
 * Derive the 32-byte key from the same secret and salt as the backend.
 * Uses @noble/hashes scrypt (same output as Node crypto.scryptSync with default N, r, p).
 * @param {string} secret - CHAT_MESSAGE_ENCRYPTION_KEY (min 16 chars)
 * @returns {Buffer} 32-byte key
 */
function getKey(secret) {
  if (!secret || secret.length < 16) {
    throw new Error('CHAT_MESSAGE_ENCRYPTION_KEY must be at least 16 characters');
  }
  const keyBytes = scrypt(
    utf8ToBytes(secret),
    utf8ToBytes(SALT),
    { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, dkLen: KEY_LENGTH }
  );
  return Buffer.from(keyBytes);
}

/**
 * Decrypt message content returned by the chat API.
 * @param {string} encryptedBase64 - message.content from API
 * @param {string} secret - CHAT_MESSAGE_ENCRYPTION_KEY
 * @returns {string} plaintext
 */
export function decryptMessageContent(encryptedBase64, secret) {
  const key = getKey(secret);
  const raw = Buffer.from(encryptedBase64, 'base64');

  if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted message format');
  }

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}
```

### 3. Using with API response

```javascript
import { decryptMessageContent } from './chatDecrypt';

const secret = process.env.EXPO_PUBLIC_CHAT_ENCRYPTION_KEY; // or from secure config

// After fetching messages: GET /chat/conversation/:id/messages
const messages = response.data.messages;

const decryptedMessages = messages.map((msg) => ({
  ...msg,
  content: (() => {
    try {
      return decryptMessageContent(msg.content, secret);
    } catch {
      return msg.content; // fallback to raw if decrypt fails (e.g. old or corrupted)
    }
  })(),
}));
```

---

## Option 2: Using Expo (expo-crypto) + buffer

If you use **Expo**, use **Option 1** (react-native-quick-crypto for AES-GCM + @noble/hashes for scrypt) inside your Expo app if the libraries are compatible with your Expo version (install and link as per their docs).

If you cannot use `react-native-quick-crypto` at all, you need:

- **scrypt**: e.g. `@noble/hashes/scrypt` (as in Option 1) or `react-native-scrypt`, with the same N/r/p/dkLen as the backend.
- **AES-256-GCM decrypt**: a library that supports GCM (the backend uses GCM; CBC-only libs will not work).

Option 1 is still the recommended approach: same key derivation as the backend and decryption that works without relying on `scryptSync` in react-native-quick-crypto.

---

## Option 3: Using global Buffer

React Native doesn’t ship `Buffer`. With **react-native-quick-crypto** you often get a Node-like `Buffer`. If not, add a polyfill:

```bash
npm install buffer
```

Then at app entry (e.g. `App.js`):

```javascript
import { Buffer } from 'buffer';
global.Buffer = Buffer;
```

Use the same decrypt logic as in Option 1; `Buffer.from(encryptedBase64, 'base64')` and `.subarray()` will work.

---

## Where to get the secret

- **Build-time / env:** e.g. `EXPO_PUBLIC_CHAT_ENCRYPTION_KEY` or your app’s env (same value as backend `CHAT_MESSAGE_ENCRYPTION_KEY`). Use only if your build pipeline keeps env out of source control.
- **Runtime from backend:** e.g. a protected endpoint like `GET /chat/config` that returns `{ messageEncryptionKey }` for the authenticated user. Store in memory or secure storage and use it only for decrypt.

Never log or expose the key in UI or analytics.

---

## Summary

| Item        | Value                          |
|------------|---------------------------------|
| Algorithm  | AES-256-GCM                     |
| Key length | 32 bytes                        |
| Key derivation | scrypt(secret, `caregiver-chat-message-v1`, 32) |
| Payload    | base64( IV \|\| authTag \|\| ciphertext ) |
| IV length  | 12 bytes                        |
| Auth tag   | 16 bytes                        |

Decrypt only when displaying message content; store and send the encrypted `content` as received from the API if you persist it locally.
