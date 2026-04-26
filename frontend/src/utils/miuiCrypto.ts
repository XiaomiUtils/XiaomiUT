import CryptoJS from 'crypto-js';

const MIUI_KEY = CryptoJS.enc.Utf8.parse('miuiotavalided11');
const MIUI_IV = CryptoJS.enc.Utf8.parse('0102030405060708');

export const miuiEncrypt = (data: object): string => {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, MIUI_KEY, {
    iv: MIUI_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
};

export const miuiDecrypt = (base64String: string): any => {
  const decrypted = CryptoJS.AES.decrypt(base64String, MIUI_KEY, {
    iv: MIUI_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  const lastBracket = decryptedText.lastIndexOf('}');
  return JSON.parse(decryptedText.substring(0, lastBracket + 1));
};