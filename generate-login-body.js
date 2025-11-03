/**
 * Generate encrypted login credentials for Postman testing
 */

// Simple XOR encryption
function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Encrypt and encode to base64
function encrypt(text, key) {
  const encrypted = xorEncrypt(text, key);
  return Buffer.from(encrypted, 'utf-8').toString('base64');
}

// Configuration
const encryptionKey = '/A?D(G+KbPeSgVkYp3s6v9y$B&E)H@Mc';
const username = 'IK385001_T2';
const password = 'IK385001_T2';

// Generate encrypted credentials
const un_key_cookie = encrypt(username, encryptionKey);
const ps_key_cookie = encrypt(password, encryptionKey);

// Create JSON body
const loginBody = {
  un_key_cookie: un_key_cookie,
  ps_key_cookie: ps_key_cookie,
  ip: '127.0.0.1'
};

console.log('\n='.repeat(60));
console.log('📋 Postman Login Request Body');
console.log('='.repeat(60));
console.log('\n✅ Copy this JSON and paste it into Postman Body (raw JSON):\n');
console.log(JSON.stringify(loginBody, null, 2));
console.log('\n' + '='.repeat(60));
console.log('📝 Postman Configuration:');
console.log('='.repeat(60));
console.log('Method:  POST');
console.log('URL:     http://localhost:8080/login');
console.log('Headers: Content-Type: application/json');
console.log('Body:    raw (JSON)');
console.log('='.repeat(60));
console.log('\n✨ Expected Response (Success):\n');
console.log(JSON.stringify({
  result: 'Success',
  data: {
    token: '<random-token>',
    session_key: '<random-session-key>'
  }
}, null, 2));
console.log('\n' + '='.repeat(60) + '\n');

