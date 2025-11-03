/**
 * HTTP Routes for TellerX Simulator
 */
import express from 'express';
import { config } from '../config.js';
import { decrypt, generateToken, generateSessionKey } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Store active sessions
const sessions = new Map();

/**
 * POST /login
 * Authenticate terminal and return token
 */
router.post('/login', (req, res) => {
  const operation = 'HTTP:Login';
  logger.info(operation, 'Login request received');
  
  try {
    const { un_key_cookie, ps_key_cookie, ip } = req.body;
    
    if (!un_key_cookie || !ps_key_cookie) {
      logger.error(operation, 'Missing credentials');
      return res.status(400).json({
        result: 'Failed',
        message: 'Missing credentials'
      });
    }
    
    // Decrypt credentials
    const username = decrypt(un_key_cookie, config.encryptionKey);
    const password = decrypt(ps_key_cookie, config.encryptionKey);
    
    logger.info(operation, `Attempting login for user: ${username}`);
    
    // Validate credentials
    if (username === config.credentials.username && password === config.credentials.password) {
      const token = generateToken();
      const sessionKey = generateSessionKey();
      
      // Store session
      sessions.set(token, {
        username,
        sessionKey,
        createdAt: Date.now()
      });
      
      logger.success(operation, `Login successful for user: ${username}`);
      
      return res.json({
        result: 'Success',
        data: {
          token,
          session_key: sessionKey
        }
      });
    } else {
      logger.warn(operation, `Invalid credentials for user: ${username}`);
      return res.status(401).json({
        result: 'Failed',
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    logger.error(operation, 'Login error', error);
    return res.status(500).json({
      result: 'Failed',
      message: 'Internal server error'
    });
  }
});

/**
 * POST /teller/uploadCallImage
 * Upload signature image
 */
router.post('/teller/uploadCallImage', (req, res) => {
  const operation = 'HTTP:UploadCallImage';
  logger.info(operation, 'Upload call image request received');
  
  try {
    const token = req.headers['x-csrftoken'];
    
    if (!token || !sessions.has(token)) {
      logger.warn(operation, 'Invalid or missing token');
      return res.status(401).json({
        result: 'Failed',
        message: 'Unauthorized'
      });
    }
    
    const { image, description, call_id, session_id } = req.body;
    
    if (!image) {
      logger.error(operation, 'Missing image data');
      return res.status(400).json({
        result: 'Failed',
        message: 'Missing image data'
      });
    }
    
    // Mock response - simulate successful upload
    const imageId = Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();
    
    logger.success(operation, `Image uploaded successfully. ID: ${imageId}, Description: ${description}`);
    
    return res.json({
      result: 'Success',
      data: {
        id: imageId,
        image: {
          id: imageId,
          creation_date: now,
          file: `/media/call_images/${imageId}.png`
        }
      }
    });
  } catch (error) {
    logger.error(operation, 'Upload error', error);
    return res.status(500).json({
      result: 'Failed',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /<resourceUrl>
 * Download resource (generic handler for any resource path)
 */
router.get('*', (req, res) => {
  const operation = 'HTTP:DownloadResource';
  const resourceUrl = req.path;
  logger.info(operation, `Download resource request: ${resourceUrl}`);
  
  try {
    const token = req.headers['x-csrftoken'];
    
    if (!token || !sessions.has(token)) {
      logger.warn(operation, 'Invalid or missing token');
      return res.status(401).json({
        result: 'Failed',
        message: 'Unauthorized'
      });
    }
    
    // Mock response - return a simple text file or JSON
    // In real implementation, this would serve actual files
    if (resourceUrl.includes('.json')) {
      logger.success(operation, `Serving JSON resource: ${resourceUrl}`);
      return res.json({
        result: 'Success',
        data: {
          message: 'Mock resource data',
          path: resourceUrl
        }
      });
    } else if (resourceUrl.includes('.png') || resourceUrl.includes('.jpg')) {
      logger.success(operation, `Serving image resource: ${resourceUrl}`);
      // Return a 1x1 transparent PNG
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      res.set('Content-Type', 'image/png');
      return res.send(transparentPng);
    } else {
      logger.success(operation, `Serving text resource: ${resourceUrl}`);
      return res.send(`Mock resource content for: ${resourceUrl}`);
    }
  } catch (error) {
    logger.error(operation, 'Download error', error);
    return res.status(500).json({
      result: 'Failed',
      message: 'Internal server error'
    });
  }
});

export { router, sessions };

