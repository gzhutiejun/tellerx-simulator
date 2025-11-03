/**
 * Simple test client for TellerX Simulator
 * Run with: node test-client.js
 */
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8080/ws/tellerapp/client';
const HTTP_URL = 'http://localhost:8080';

let messageId = 0;

function getNextId(method) {
  return `${method}_${++messageId}`;
}

function createRequest(method, params) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: getNextId(method)
  };
}

async function testHttpLogin() {
  console.log('\n🧪 Testing HTTP Login...');
  
  try {
    const response = await fetch(`${HTTP_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        un_key_cookie: Buffer.from('IK385001_T2').toString('base64'),
        ps_key_cookie: Buffer.from('IK385001_T2').toString('base64'),
        ip: '127.0.0.1'
      })
    });
    
    const data = await response.json();
    console.log('✅ Login response:', data);
    return data.data?.token;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return null;
  }
}

async function testWebSocket() {
  console.log('\n🧪 Testing WebSocket Connection...');
  
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
    
    // Test sequence
    setTimeout(() => testPing(ws), 1000);
    setTimeout(() => testCreateSession(ws), 2000);
    setTimeout(() => testRequestHelp(ws), 3000);
    setTimeout(() => testReadCard(ws), 5000);
    setTimeout(() => testDispense(ws), 7000);
    setTimeout(() => {
      console.log('\n✅ All tests completed');
      ws.close();
    }, 12000);
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('📨 Received:', JSON.stringify(message, null, 2));
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
    process.exit(0);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
}

function testPing(ws) {
  console.log('\n🧪 Testing Ping...');
  const message = createRequest('AvailabilityController.ping', {});
  ws.send(JSON.stringify(message));
}

function testCreateSession(ws) {
  console.log('\n🧪 Testing Create Session...');
  const message = createRequest('SessionController.create_session', {
    selfservice: false
  });
  ws.send(JSON.stringify(message));
}

function testRequestHelp(ws) {
  console.log('\n🧪 Testing Request Help...');
  const message = createRequest('SessionController.request_help', {
    skills: { Language: 'English' },
    current_session: {
      session_id: 1001,
      video_id: 'test_terminal',
      receipt_width: 600
    }
  });
  ws.send(JSON.stringify(message));
}

function testReadCard(ws) {
  console.log('\n🧪 Testing Read Card...');
  const message = createRequest('CardReaderController.read_card', {});
  ws.send(JSON.stringify(message));
}

function testDispense(ws) {
  console.log('\n🧪 Testing Cash Dispense...');
  const message = createRequest('CashDispenserController.dispense', {
    amount: 100,
    currency: 'USD',
    notes: [
      { denomination: 20, count: 5 }
    ]
  });
  ws.send(JSON.stringify(message));
}

// Run tests
console.log('🚀 Starting TellerX Simulator Tests...');
console.log('=' .repeat(60));

testHttpLogin().then(token => {
  if (token) {
    console.log(`\n🔑 Token received: ${token.substring(0, 20)}...`);
  }
  testWebSocket();
});

