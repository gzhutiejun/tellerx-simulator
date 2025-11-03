/**
 * TellerX Simulator Server
 * Main entry point for the simulator
 */
import express from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { router } from "./http/routes.js";
import { initWebSocketServer, initAdminWebSocketServer } from "./websocket/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Support large base64 images
app.use(express.urlencoded({ extended: true }));

// Serve static files for admin panel
app.use("/admin", express.static(path.join(__dirname, "../public")));

// Request logging middleware
app.use((req, res, next) => {
  logger.info("HTTP", `${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use("/", router);

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket servers
const clientWss = initWebSocketServer(server, config.wsPath);
const adminWss = initAdminWebSocketServer(server, "/ws/admin", clientWss);

// Handle WebSocket upgrade requests
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === config.wsPath) {
    clientWss.handleUpgrade(request, socket, head, (ws) => {
      clientWss.emit("connection", ws, request);
    });
  } else if (pathname === "/ws/admin") {
    adminWss.handleUpgrade(request, socket, head, (ws) => {
      adminWss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start server
server.listen(config.httpPort, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 TellerX Simulator Server Started");
  console.log("=".repeat(60));
  console.log(`📡 HTTP Server:      http://localhost:${config.httpPort}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${config.wsPort}${config.wsPath}`);
  console.log(`🎮 Admin Panel:      http://localhost:${config.httpPort}/admin`);
  console.log("=".repeat(60));
  console.log("📋 Available Endpoints:");
  console.log(`   POST   /login`);
  console.log(`   POST   /teller/uploadCallImage`);
  console.log(`   GET    /<any-resource-path>`);
  console.log("=".repeat(60));
  console.log("🔐 Mock Credentials:");
  console.log(`   Username: ${config.credentials.username}`);
  console.log(`   Password: ${config.credentials.password}`);
  console.log("=".repeat(60));
  console.log("✅ Server is ready for connections");
  console.log("💡 Open http://localhost:" + config.httpPort + "/admin to access control panel\n");
});

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Server", "Shutting down gracefully...");
  server.close(() => {
    logger.success("Server", "Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  logger.info("Server", "Shutting down gracefully...");
  server.close(() => {
    logger.success("Server", "Server closed");
    process.exit(0);
  });
});
