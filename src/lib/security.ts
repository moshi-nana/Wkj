import CryptoJS from 'crypto-js';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

// Kunci rahasia internal aplikasi (sebagai layer tambahan di atas enkripsi perangkat)
const INTERNAL_SECRET = 'CatatIn_Secure_V1_8a7b6c5d';

/**
 * Hash PIN satu arah (One-way Hash) 
 * Tidak pernah menyimpan teks asli PIN
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Enkripsi data untuk penyimpanan lokal.
 * Menggunakan AES (Advanced Encryption Standard).
 */
export function encryptData(data: string, pinHash?: string): string {
  // Gunakan PIN hash sebagai kunci jika ada, jika tidak, gunakan kunci internal
  const key = pinHash ? (pinHash + INTERNAL_SECRET) : INTERNAL_SECRET;
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Dekripsi data dari penyimpanan lokal.
 */
export function decryptData(cipherText: string, pinHash?: string): string | null {
  try {
    const key = pinHash ? (pinHash + INTERNAL_SECRET) : INTERNAL_SECRET;
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) return null;
    return decrypted;
  } catch (error) {
    // Jangan log error malformed UTF-8 secara berlebihan karena itu normal jika kunci salah
    return null;
  }
}

/**
 * Autentikasi biometrik Native via Capacitor
 */
export async function authenticateBiometric(): Promise<boolean> {
  // Check if we are truly on a native platform (Android/iOS)
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        console.warn("Biometric is not available on this native device");
        return false;
      }
      
      await NativeBiometric.verifyIdentity({
        reason: "Verifikasi untuk mengakses aplikasi",
        title: "Log In dengan Sidik Jari/Wajah",
        subtitle: "Buka CatatIn",
        description: "Amankan catatan keuangan Anda"
      });
      return true;
    } catch (error) {
      console.warn("Biometrik native gagal atau dibatalkan", error);
      return false;
    }
  } else {
    // Fallback: Simulasi biometrik untuk Web Browser
    // PENTING: Dialog biometrik browser HANYA bisa muncul jika dipicu oleh klik user secara langsung (SINKRON).
    
    // Opsi 1: Coba WebAuthn (Standard Browser Modern Android/iOS)
    const canUseWebAuthn = window.PublicKeyCredential && 
                           window.navigator && 
                           window.navigator.credentials;

    if (canUseWebAuthn) {
      try {
        // Cek apakah perangkat mendukung platform authenticator (Sidik Jari/FaceID)
        const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        
        if (isAvailable) {
          // Buat challenge & userId yang lebih robust
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);

          // Pemicu dialog Biometrik Sistem asli di Browser
          await window.navigator.credentials.create({
            publicKey: {
              challenge: challenge,
              rp: { name: "CatatIn" },
              user: {
                id: userId,
                name: "local-user@catatin.local",
                displayName: "User LokalCatatIn"
              },
              pubKeyCredParams: [
                { type: "public-key", alg: -7 },   // ES256 (Paling umum)
                { type: "public-key", alg: -257 }  // RS256
              ],
              authenticatorSelection: {
                authenticatorAttachment: "platform", // Ini yang memicu Biometrik HP
                userVerification: "required",
                residentKey: "preferred"
              },
              timeout: 60000
            }
          });
          return true;
        }
      } catch (err: any) {
        console.warn("WebAuthn failed or cancelled:", err.name, err.message);
        // Jika user membatalkan (NotAllowedError atau AbortError), kita return false
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          return false;
        }
        // Jika error lain, lanjut ke fallback confirm
      }
    }

    // Opsi 2: Konfirmasi Browser (Jika mode WebAuthn gagal atau tidak didukung)
    try {
      // Dilakukan secara sinkron agar tidak diblokir browser gesture check
      return window.confirm("🔒 KONFIRMASI KEAMANAN\n\nAktifkan login Sidik Jari / Wajah untuk aplikasi ini?\n\n(Catatan: Pastikan biometrik sudah terdaftar di pengaturan HP Anda)");
    } catch (e) {
      console.error("Window confirm error:", e);
      return true;
    }
  }
}
