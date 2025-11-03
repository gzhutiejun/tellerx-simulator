/**
 * TellerX Simulator Control Panel - Frontend
 */

let ws = null;
let incomingCount = 0;
let outgoingCount = 0;

// Notification definitions with parameters
const notifications = {
  "Session Controller": [
    {
      method: "SessionController.call_established",
      label: "Call Established",
      params: {
        call: {
          id: 2001,
          teller: 100,
        },
      },
    },
    {
      method: "SessionController.call_reestablished",
      label: "Call Reestablished",
      params: {
        success: true,
        call_id: 2001,
      },
    },
    {
      method: "SessionController.call_ended",
      label: "Call Ended",
      params: {
        session_id: 1001,
      },
    },
  ],
  "Card Reader Controller": [
    {
      method: "CardReaderController.card_read",
      label: "Card Read",
      params: {
        success: true,
        card_data: {
          track1: "B1234567890123456^DOE/JOHN^25121011234567890123",
          track2: "1234567890123456=25121011234567890",
          track3: "",
        },
      },
    },
    {
      method: "CardReaderController.card_inserted",
      label: "Card Inserted",
      params: {
        success: true,
      },
    },
    {
      method: "CardReaderController.card_removed",
      label: "Card Removed",
      params: {
        success: true,
      },
    },
  ],
  "Cash Dispenser Controller": [
    {
      method: "CashDispenserController.dispense_complete",
      label: "Dispense Complete",
      params: {
        success: true,
        amount: 100,
        notes: [{ denomination: 20, count: 5 }],
      },
    },
    {
      method: "CashDispenserController.present_complete",
      label: "Present Complete",
      params: {
        success: true,
      },
    },
    {
      method: "CashDispenserController.retract_complete",
      label: "Retract Complete",
      params: {
        success: true,
      },
    },
  ],
  "Signature Controller": [
    {
      method: "SignatureController.signature_captured",
      label: "Signature Captured",
      params: {
        success: true,
        response_code: 0,
        signature_data:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    },
    {
      method: "SignatureController.signature_cancelled",
      label: "Signature Cancelled",
      params: {
        success: false,
        response_code: -4,
      },
    },
  ],
  "Action Controller": [
    {
      method: "ActionServices.command_complete",
      label: "Command Complete",
      params: {
        id: "action_1",
        result: "success",
        detail: {},
      },
    },
    {
      method: "ActionServices.command_update",
      label: "Command Update",
      params: {
        id: "action_1",
        event: "progress",
        detail: "Processing...",
      },
    },
  ],
  "Chat Controller": [
    {
      method: "ChatController.message_received",
      label: "Message Received",
      params: {
        from: "teller",
        message: "Hello from teller",
        timestamp: Date.now(),
      },
    },
  ],
  "Transaction Events": [
    {
      method: "TransactionEventsController.transaction_approved",
      label: "Transaction Approved",
      params: {
        success: true,
        transaction_id: "TXN_001",
      },
    },
    {
      method: "TransactionEventsController.transaction_declined",
      label: "Transaction Declined",
      params: {
        success: false,
        reason: "Insufficient funds",
      },
    },
  ],
  "Availability Controller": [
    {
      method: "AvailabilityController.disconnection_notification",
      label: "Disconnection Notification",
      params: {
        wait_for_rejoin: true,
        close_code: 1000,
        close_code_reason: "Normal closure",
      },
    },
  ],
};

// Initialize
function init() {
  connectToServer();
  renderControls();
}

// Connect to WebSocket server for monitoring
function connectToServer() {
  ws = new WebSocket("ws://localhost:8080/ws/admin");

  ws.onopen = () => {
    updateConnectionStatus(true);
    addSystemMessage("Connected to server");
  };

  ws.onclose = () => {
    updateConnectionStatus(false);
    addSystemMessage("Disconnected from server");
    setTimeout(connectToServer, 3000);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  };
}

// Handle messages from server
function handleServerMessage(data) {
  switch (data.type) {
    case "client_count":
      updateClientCount(data.count);
      break;
    case "message_log":
      addMessage(data.direction, data.message);
      break;
    case "notification_sent":
      addSystemMessage(`Notification sent: ${data.method}`);
      break;
  }
}

// Update connection status
function updateConnectionStatus(connected) {
  const statusEl = document.getElementById("connectionStatus");
  if (connected) {
    statusEl.textContent = "Connected";
    statusEl.className = "status-value connected";
  } else {
    statusEl.textContent = "Disconnected";
    statusEl.className = "status-value disconnected";
  }
}

// Update client count
function updateClientCount(count) {
  document.getElementById("clientCount").textContent = count;
}

// Add message to log
function addMessage(direction, message) {
  const container = document.getElementById("messagesContainer");
  const messageEl = document.createElement("div");
  messageEl.className = `message ${direction}`;

  const directionText = direction === "incoming" ? "← Received" : "→ Sent";
  const time = new Date().toLocaleTimeString();

  if (direction === "incoming") {
    incomingCount++;
    document.getElementById("incomingCount").textContent = incomingCount;
  } else {
    outgoingCount++;
    document.getElementById("outgoingCount").textContent = outgoingCount;
  }

  messageEl.innerHTML = `
    <div class="message-header">
      <span class="message-direction">${directionText}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-content">${JSON.stringify(message, null, 2)}</div>
  `;

  container.appendChild(messageEl);
  container.scrollTop = container.scrollHeight;
}

// Add system message
function addSystemMessage(text) {
  const container = document.getElementById("messagesContainer");
  const messageEl = document.createElement("div");
  messageEl.style.cssText =
    "padding: 8px; margin-bottom: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; color: #856404;";
  messageEl.textContent = `[System] ${text}`;
  container.appendChild(messageEl);
  container.scrollTop = container.scrollHeight;
}

// Clear messages
function clearMessages() {
  document.getElementById("messagesContainer").innerHTML = "";
  incomingCount = 0;
  outgoingCount = 0;
  document.getElementById("incomingCount").textContent = "0";
  document.getElementById("outgoingCount").textContent = "0";
}

// Render control buttons with tabs
function renderControls() {
  const container = document.getElementById("controlsContainer");

  // Create tab navigation
  const tabNav = document.createElement("div");
  tabNav.className = "tab-nav";

  // Create tab contents container
  const tabContentsContainer = document.createElement("div");
  tabContentsContainer.style.flex = "1";
  tabContentsContainer.style.overflow = "hidden";
  tabContentsContainer.style.display = "flex";
  tabContentsContainer.style.flexDirection = "column";

  const controllerNames = Object.keys(notifications);

  controllerNames.forEach((groupName, index) => {
    // Create tab button
    const tabButton = document.createElement("button");
    tabButton.className = "tab-button" + (index === 0 ? " active" : "");
    tabButton.textContent = groupName;
    tabButton.onclick = () => switchTab(groupName);
    tabNav.appendChild(tabButton);

    // Create tab content
    const tabContent = document.createElement("div");
    tabContent.className = "tab-content" + (index === 0 ? " active" : "");
    tabContent.id = `tab-${groupName.replace(/\s+/g, "-")}`;
    tabContent.style.flex = "1";
    tabContent.style.overflowY = "auto";

    notifications[groupName].forEach((notification) => {
      const itemEl = document.createElement("div");
      itemEl.className = "control-item";

      const labelEl = document.createElement("label");
      labelEl.className = "control-label";
      labelEl.textContent = notification.label;
      itemEl.appendChild(labelEl);

      const textareaEl = document.createElement("textarea");
      textareaEl.className = "control-input";
      textareaEl.value = JSON.stringify(notification.params, null, 2);
      textareaEl.id = `params_${notification.method}`;
      itemEl.appendChild(textareaEl);

      const buttonEl = document.createElement("button");
      buttonEl.className = "control-button";
      buttonEl.textContent = "Send Notification";
      buttonEl.onclick = () => sendNotification(notification.method);
      itemEl.appendChild(buttonEl);

      tabContent.appendChild(itemEl);
    });

    tabContentsContainer.appendChild(tabContent);
  });

  container.appendChild(tabNav);
  container.appendChild(tabContentsContainer);
}

// Switch between tabs
function switchTab(groupName) {
  const tabId = `tab-${groupName.replace(/\s+/g, "-")}`;

  // Update tab buttons
  document.querySelectorAll(".tab-button").forEach((btn) => {
    if (btn.textContent === groupName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    if (content.id === tabId) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
}

// Send notification to clients
function sendNotification(method) {
  const paramsEl = document.getElementById(`params_${method}`);
  let params;

  try {
    params = JSON.parse(paramsEl.value);
  } catch (e) {
    alert("Invalid JSON format!\n" + e.message);
    return;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "send_notification",
        method: method,
        params: params,
      })
    );
  } else {
    alert("Not connected to server!");
  }
}

// Start
init();
