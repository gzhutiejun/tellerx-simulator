/**
 * Simple logger utility
 */
import { config } from '../config.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info: (operation, message) => {
    if (config.debug) {
      console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} [${operation}] ${message}`);
    }
  },
  
  error: (operation, message, error) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} [${operation}] ${message}`, error || '');
  },
  
  warn: (operation, message) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} [${operation}] ${message}`);
  },
  
  success: (operation, message) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} [${operation}] ${message}`);
  },
  
  ws: (direction, message) => {
    if (config.debug) {
      const arrow = direction === 'in' ? '←' : '→';
      const color = direction === 'in' ? colors.blue : colors.magenta;
      console.log(`${color}[WS ${arrow}]${colors.reset} ${colors.dim}${timestamp()}${colors.reset} ${JSON.stringify(message, null, 2)}`);
    }
  }
};

