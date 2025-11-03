/**
 * Message handlers for different TellerX controllers
 */
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { createResponse, createNotification } from "./jsonrpc.js";
import { logMessageToAdmins } from "./server.js";

/**
 * Helper function to send notification and log to admins
 */
function sendNotification(ws, method, params) {
  const notification = createNotification(method, params);
  ws.send(JSON.stringify(notification));
  logger.ws("out", notification);
  logMessageToAdmins("outgoing", notification);
}

/**
 * Handler registry
 */
export const handlers = {
  // Availability Controller
  "AvailabilityController.ping": handlePing,
  "AvailabilityController.available_tellers": handleAvailableTellers,

  // Session Controller
  "SessionController.create_session": handleCreateSession,
  "SessionController.request_help": handleRequestHelp,
  "SessionController.call_initialized": handleCallInitialized,
  "SessionController.rejoin_call": handleRejoinCall,
  "SessionController.close_session": handleCloseSession,

  // Terminal Status Controller
  "TerminalStatusController.update_terminal_status": handleUpdateTerminalStatus,

  // Action Controller
  "ActionServices.action_init": handleActionInit,
  "ActionServices.command_start": handleCommandStart,

  // Card Reader Controller
  "CardReaderController.read_card": handleReadCard,
  "CardReaderController.eject_card": handleEjectCard,

  // Cash Dispenser Controller
  "CashDispenserController.dispense": handleDispense,
  "CashDispenserController.present": handlePresent,
  "CashDispenserController.retract": handleRetract,

  // Signature Controller
  "SignatureController.request_signature": handleRequestSignature,
  "SignatureController.cancel_request_signature": handleCancelRequestSignature,

  // Transaction Events Controller
  "TransactionEventsController.confirm_transaction": handleConfirmTransaction,
  "TransactionEventsController.fulfillment": handleFulfillment,

  // EJ Controller
  "EJController.ej_log": handleEJLog,

  // Chat Controller
  "ChatController.send_message": handleSendMessage,
};

// Availability Controller Handlers

function handlePing(params, id, ws) {
  logger.info("Handler:Ping", "Ping received");
  return createResponse(id, { success: true });
}

function handleAvailableTellers(params, id, ws) {
  logger.info("Handler:AvailableTellers", "Available tellers request");
  return createResponse(id, {
    success: true,
    availability: 1,
    available_tellers: [
      {
        id: config.mockData.tellerId,
        user: {
          id: config.mockData.tellerId,
          username: config.mockData.tellerUsername,
          firstname: config.mockData.tellerFirstName,
          lastname: config.mockData.tellerLastName,
        },
        skills: [
          { id: 1, category: { id: 1, name: "Language", description: "Language skills" }, value: "English" },
          { id: 2, category: { id: 2, name: "Language", description: "Language skills" }, value: "Spanish" },
        ],
      },
    ],
    wait_time: 0,
  });
}

// Session Controller Handlers

function handleCreateSession(params, id, ws) {
  logger.info("Handler:CreateSession", `Creating session, selfservice: ${params?.selfservice}`);
  const sessionId = config.mockData.sessionId++;

  return createResponse(id, {
    success: true,
    session_id: sessionId,
  });
}

function handleRequestHelp(params, id, ws) {
  logger.info("Handler:RequestHelp", `Request help with skills: ${JSON.stringify(params?.skills)}`);

  // Simulate call establishment after a short delay
  setTimeout(() => {
    const callId = config.mockData.callId++;
    sendNotification(ws, "SessionController.call_established", {
      call: {
        id: callId,
        teller: config.mockData.tellerId,
      },
    });
  }, 1000);

  return createResponse(id, { success: true });
}

function handleCallInitialized(params, id, ws) {
  logger.info("Handler:CallInitialized", `Call initialized: ${params?.call_id}`);
  return createResponse(id, { success: true });
}

function handleRejoinCall(params, id, ws) {
  logger.info("Handler:RejoinCall", `Rejoin call: ${params?.call_id}`);

  setTimeout(() => {
    sendNotification(ws, "SessionController.call_reestablished", {
      success: true,
      call_id: params?.call_id,
    });
  }, 500);

  return createResponse(id, { success: true });
}

function handleCloseSession(params, id, ws) {
  logger.info("Handler:CloseSession", `Close session: ${params?.session_id}`);

  setTimeout(() => {
    sendNotification(ws, "SessionController.call_ended", {
      session_id: params?.session_id,
    });
  }, 500);

  return createResponse(id, { success: true });
}

// Terminal Status Controller Handlers

function handleUpdateTerminalStatus(params, id, ws) {
  logger.info("Handler:UpdateTerminalStatus", `Status: ${params?.status}`);
  return createResponse(id, { success: true });
}

// Action Controller Handlers

function handleActionInit(params, id, ws) {
  logger.info("Handler:ActionInit", `Action: ${params?.action}`);
  return createResponse(id, {
    action: params?.action,
    status: "ok",
    commands: [
      { id: "confirm", enabled: true, label: "Confirm" },
      { id: "cancel", enabled: true, label: "Cancel" },
    ],
    data: {},
  });
}

function handleCommandStart(params, id, ws) {
  logger.info("Handler:CommandStart", `Command: ${params?.command}`);

  setTimeout(() => {
    sendNotification(ws, "ActionServices.command_complete", {
      id: params?.id,
      result: "success",
      detail: {},
    });
  }, 1000);

  return createResponse(id, { success: true });
}

// Card Reader Controller Handlers

function handleReadCard(_params, id, ws) {
  logger.info("Handler:ReadCard", "Reading card");

  setTimeout(() => {
    sendNotification(ws, "CardReaderController.card_read", {
      success: true,
      card_data: {
        track1: "B1234567890123456^DOE/JOHN^25121011234567890123",
        track2: "1234567890123456=25121011234567890",
        track3: "",
      },
    });
  }, 2000);

  return createResponse(id, { success: true });
}

function handleEjectCard(params, id, ws) {
  logger.info("Handler:EjectCard", "Ejecting card");
  return createResponse(id, { success: true });
}

// Cash Dispenser Controller Handlers

function handleDispense(params, id, ws) {
  logger.info("Handler:Dispense", `Amount: ${params?.amount}`);

  // Simulate dispense completion
  setTimeout(() => {
    sendNotification(ws, "CashDispenserController.dispense_complete", {
      success: true,
      amount: params?.amount,
      notes: params?.notes || [],
    });
  }, 3000);

  return createResponse(id, { success: true });
}

function handlePresent(params, id, ws) {
  logger.info("Handler:Present", "Presenting cash");
  return createResponse(id, { success: true });
}

function handleRetract(params, id, ws) {
  logger.info("Handler:Retract", "Retracting cash");
  return createResponse(id, { success: true });
}

// Signature Controller Handlers

function handleRequestSignature(params, id, ws) {
  logger.info("Handler:RequestSignature", `Source: ${params?.source}`);

  // Simulate signature capture
  setTimeout(() => {
    sendNotification(ws, "SignatureController.signature_captured", {
      success: true,
      response_code: 0,
      signature_data:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });
  }, 2000);

  return createResponse(id, { success: true });
}

function handleCancelRequestSignature(params, id, ws) {
  logger.info("Handler:CancelRequestSignature", "Cancelling signature request");
  return createResponse(id, { success: true });
}

// Transaction Events Controller Handlers

function handleConfirmTransaction(params, id, ws) {
  logger.info("Handler:ConfirmTransaction", `Transaction type: ${params?.type}`);
  return createResponse(id, { success: true });
}

function handleFulfillment(params, id, ws) {
  logger.info("Handler:Fulfillment", "Transaction fulfillment");
  return createResponse(id, {
    success: true,
    status: 0,
    message: "Transaction completed successfully",
  });
}

// EJ Controller Handlers

function handleEJLog(params, id, ws) {
  logger.info("Handler:EJLog", `Message: ${params?.message}`);
  return createResponse(id, { success: true });
}

// Chat Controller Handlers

function handleSendMessage(params, id, ws) {
  logger.info("Handler:SendMessage", `Message: ${params?.message}`);

  // Echo message back as received
  setTimeout(() => {
    sendNotification(ws, "ChatController.message_received", {
      from: "teller",
      message: `Echo: ${params?.message}`,
      timestamp: Date.now(),
    });
  }, 500);

  return createResponse(id, { success: true });
}
