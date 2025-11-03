/**
 * Encryption utilities to match client-side encryption
 */
import crypto from 'crypto';

/**
 * Simple XOR encryption to match client implementation
 * @param {string} text - Text to encrypt/decrypt
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted/decrypted text
 */
export function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Decrypt base64 encoded encrypted text
 * @param {string} encrypted - Base64 encoded encrypted text
 * @param {string} key - Encryption key
 * @returns {string} - Decrypted text
 */
export function decrypt(encrypted, key) {
  try {
    const decoded = Buffer.from(encrypted, 'base64').toString('utf-8');
    return xorEncrypt(decoded, key);
  } catch (e) {
    console.error('Decryption error:', e);
    return null;
  }
}

/**
 * Generate a random token
 * @returns {string} - Random token
 */
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a random session key
 * @returns {string} - Random session key
 */
export function generateSessionKey() {
  return crypto.randomBytes(16).toString('hex');
}

