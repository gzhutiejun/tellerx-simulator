/**
 * JSON-RPC 2.0 Message Handlers
 */
import { logger } from '../utils/logger.js';

/**
 * Create a JSON-RPC 2.0 response
 */
export function createResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

/**
 * Create a JSON-RPC 2.0 notification
 */
export function createNotification(method, params) {
  return {
    jsonrpc: '2.0',
    method,
    params
  };
}

/**
 * Create a JSON-RPC 2.0 request
 */
export function createRequest(method, params, id) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id
  };
}

/**
 * Create a JSON-RPC 2.0 error response
 */
export function createError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data
    }
  };
}

/**
 * Parse and validate JSON-RPC message
 */
export function parseMessage(data) {
  try {
    const message = JSON.parse(data);
    
    if (message.jsonrpc !== '2.0') {
      return { error: 'Invalid JSON-RPC version' };
    }
    
    return { message };
  } catch (error) {
    logger.error('JSON-RPC', 'Failed to parse message', error);
    return { error: 'Invalid JSON' };
  }
}

/**
 * Check if message is a request (has id and method)
 */
export function isRequest(message) {
  return message.id !== undefined && message.method !== undefined;
}

/**
 * Check if message is a notification (has method but no id)
 */
export function isNotification(message) {
  return message.id === undefined && message.method !== undefined;
}

/**
 * Check if message is a response (has id and result)
 */
export function isResponse(message) {
  return message.id !== undefined && message.result !== undefined;
}

