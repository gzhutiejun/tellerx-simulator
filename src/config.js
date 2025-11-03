/**
 * TellerX Simulator Configuration
 */
export const config = {
  // Server ports
  httpPort: 8080,
  wsPort: 8080, // Same port for HTTP and WebSocket
  
  // WebSocket path
  wsPath: '/ws/tellerapp/client',
  
  // Mock credentials
  credentials: {
    username: 'IK385001_T2',
    password: 'IK385001_T2'
  },
  
  // Encryption key (same as client)
  encryptionKey: '/A?D(G+KbPeSgVkYp3s6v9y$B&E)H@Mc',
  
  // Mock data
  mockData: {
    sessionId: 1001,
    callId: 2001,
    tellerId: 100,
    tellerFirstName: 'John',
    tellerLastName: 'Doe',
    tellerUsername: 'john.doe'
  },
  
  // Enable debug logging
  debug: true
};

