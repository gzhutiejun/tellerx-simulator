/**
 * WebSocket Server for JSON-RPC communication
 */
import { WebSocketServer } from "ws";
import { logger } from "../utils/logger.js";
import { parseMessage, isRequest, isNotification, createNotification, createError } from "./jsonrpc.js";
import { handlers } from "./handlers.js";

// Store admin connections for broadcasting
let adminConnections = new Set();

/**
 * Broadcast message to all admin connections
 */
function broadcastToAdmins(data) {
  const message = JSON.stringify(data);
  adminConnections.forEach((ws) => {
    if (ws.readyState === 1) {
      // OPEN
      ws.send(message);
    }
  });
}

/**
 * Export function to broadcast to admins (for use in handlers)
 */
export function logMessageToAdmins(direction, message) {
  broadcastToAdmins({
    type: "message_log",
    direction: direction,
    message: message,
  });
}

/**
 * Initialize WebSocket server for clients
 */
export function initWebSocketServer(server, path) {
  const wss = new WebSocketServer({
    noServer: true,
  });

  logger.info("WebSocket", `Client WebSocket server initialized on path: ${path}`);

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    logger.success("WebSocket", `Client connected from ${clientIp}`);

    // Notify admins about client count
    broadcastToAdmins({
      type: "client_count",
      count: wss.clients.size,
    });

    // Send connection established notification
    const connectionMsg = createNotification("connection_established", {
      success: true,
      timestamp: Date.now(),
    });
    ws.send(JSON.stringify(connectionMsg));
    logger.ws("out", connectionMsg);

    // Broadcast to admins
    broadcastToAdmins({
      type: "message_log",
      direction: "outgoing",
      message: connectionMsg,
    });

    // Handle incoming messages
    ws.on("message", (data) => {
      handleMessage(ws, wss, data);
    });

    // Handle connection close
    ws.on("close", () => {
      logger.info("WebSocket", `Client disconnected from ${clientIp}`);
      // Notify admins about client count
      broadcastToAdmins({
        type: "client_count",
        count: wss.clients.size,
      });
    });

    // Handle errors
    ws.on("error", (error) => {
      logger.error("WebSocket", "WebSocket error", error);
    });
  });

  // Store path for later use
  wss.path = path;

  return wss;
}

/**
 * Initialize WebSocket server for admin panel
 */
export function initAdminWebSocketServer(server, path, clientWss) {
  const wss = new WebSocketServer({
    noServer: true,
  });

  logger.info("WebSocket", `Admin WebSocket server initialized on path: ${path}`);

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    logger.success("WebSocket", `Admin connected from ${clientIp}`);

    // Add to admin connections
    adminConnections.add(ws);

    // Send current client count
    ws.send(
      JSON.stringify({
        type: "client_count",
        count: clientWss.clients.size,
      })
    );

    // Handle admin commands
    ws.on("message", (data) => {
      try {
        const command = JSON.parse(data);

        if (command.type === "send_notification") {
          // Send notification to all clients
          const notification = createNotification(command.method, command.params);
          const notificationStr = JSON.stringify(notification);

          clientWss.clients.forEach((client) => {
            if (client.readyState === 1) {
              // OPEN
              client.send(notificationStr);
            }
          });

          logger.info("Admin", `Notification sent to ${clientWss.clients.size} clients: ${command.method}`);

          // Log to admins
          broadcastToAdmins({
            type: "message_log",
            direction: "outgoing",
            message: notification,
          });

          // Confirm to sender
          ws.send(
            JSON.stringify({
              type: "notification_sent",
              method: command.method,
            })
          );
        }
      } catch (e) {
        logger.error("Admin", "Failed to process admin command", e);
      }
    });

    // Handle connection close
    ws.on("close", () => {
      logger.info("WebSocket", `Admin disconnected from ${clientIp}`);
      adminConnections.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      logger.error("WebSocket", "Admin WebSocket error", error);
    });
  });

  // Store path for later use
  wss.path = path;

  return wss;
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(ws, wss, data) {
  const { message, error } = parseMessage(data);

  if (error) {
    logger.error("WebSocket", `Invalid message: ${error}`);
    const errorResponse = createError(null, -32700, "Parse error", error);
    ws.send(JSON.stringify(errorResponse));
    return;
  }

  logger.ws("in", message);

  // Broadcast to admins
  broadcastToAdmins({
    type: "message_log",
    direction: "incoming",
    message: message,
  });

  // Handle request (has id and method)
  if (isRequest(message)) {
    handleRequest(ws, wss, message);
  }
  // Handle notification (has method but no id)
  else if (isNotification(message)) {
    handleNotificationMessage(ws, message);
  }
  // Unknown message type
  else {
    logger.warn("WebSocket", `Unknown message type: ${JSON.stringify(message)}`);
  }
}

/**
 * Handle JSON-RPC request
 */
function handleRequest(ws, wss, message) {
  const { method, params, id } = message;

  // Find handler for this method
  const handler = handlers[method];

  if (handler) {
    try {
      const response = handler(params, id, ws);
      if (response) {
        ws.send(JSON.stringify(response));
        logger.ws("out", response);

        // Broadcast to admins
        broadcastToAdmins({
          type: "message_log",
          direction: "outgoing",
          message: response,
        });
      }
    } catch (error) {
      logger.error("WebSocket", `Handler error for ${method}`, error);
      const errorResponse = createError(id, -32603, "Internal error", error.message);
      ws.send(JSON.stringify(errorResponse));
      logger.ws("out", errorResponse);

      // Broadcast to admins
      broadcastToAdmins({
        type: "message_log",
        direction: "outgoing",
        message: errorResponse,
      });
    }
  } else {
    logger.warn("WebSocket", `No handler found for method: ${method}`);
    const errorResponse = createError(id, -32601, "Method not found", method);
    ws.send(JSON.stringify(errorResponse));
    logger.ws("out", errorResponse);

    // Broadcast to admins
    broadcastToAdmins({
      type: "message_log",
      direction: "outgoing",
      message: errorResponse,
    });
  }
}

/**
 * Handle JSON-RPC notification (no response expected)
 */
function handleNotificationMessage(ws, message) {
  const { method, params } = message;
  logger.info("WebSocket", `Notification received: ${method}`);

  // Notifications don't require a response, but we can still process them
  const handler = handlers[method];
  if (handler) {
    try {
      handler(params, undefined, ws);
    } catch (error) {
      logger.error("WebSocket", `Handler error for notification ${method}`, error);
    }
  }
}
