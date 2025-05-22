// Azure Communication Services client setup
import 'dotenv/config';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import BotService, { SummaryService } from './bot-service.js';
import * as UI from './chat-ui.js';

// ===== Configuration and State Management =====
let endpointUrl = null;
let userAccessToken = null;
let ourUserId = null;
let chatClient = null;
let chatThreadClient = null;
let chatThreadId = null;
let notificationsStarted = false;
let currentCustomer = null;
let isAgentActive = false;
let lastMessageTime = null;

// ===== Message Tracking =====
const displayedMessageIds = new Set();
const threadLatestMessage = {};

// ===== Service Initialization =====
const botService = new BotService();
const summaryService = new SummaryService();

// ===== Token Management =====
async function fetchAcsToken() {
  try {
    const res = await fetch('http://localhost:3001/api/token');
    if (!res.ok) throw new Error('Failed to fetch ACS token');
    const data = await res.json();
    userAccessToken = data.token;
    ourUserId = data.userId;
    endpointUrl = data.endpointUrl;
    console.log('Successfully fetched ACS token and configuration');
    return true;
  } catch (err) {
    console.error('Could not fetch ACS token:', err);
    UI.showErrorUI('Token Error', 'Could not fetch ACS access token from backend.', err.message);
    return false;
  }
}

// ===== Chat Client Management =====
async function initializeChatClient() {
  if (!endpointUrl || !userAccessToken) {
    throw new Error('Missing required credentials. Please ensure fetchAcsToken completed successfully.');
  }
  try {
    const cleanToken = userAccessToken.trim().replace(/^['"]|['"]$/g, '');
    chatClient = new ChatClient(endpointUrl, new AzureCommunicationTokenCredential(cleanToken));
    console.log('Successfully initialized chat client');
    return true;
  } catch (error) {
    console.error('Error creating chat client:', error);
    UI.showErrorUI('Chat Client Error', 'Failed to initialize Azure Communication Services chat client.', error.message);
    return false;
  }
}

// ===== Application Initialization =====
async function initialize() {
  UI.validateUIElements();
  const tokenOk = await fetchAcsToken();
  if (!tokenOk) return;
  const clientOk = await initializeChatClient();
  if (!clientOk) return;
  await initializeChat();
}

// Start the application
initialize().catch(error => {
  console.error('Failed to initialize application:', error);
  UI.showErrorUI('Initialization Error', 'Failed to start the application.', error.message);
});

// Handle agent taking over conversation
async function handleTakeOver() {
  if (!isAgentActive) {
    isAgentActive = true;
    const handoffMessage = await botService.deactivate();
    const agentJoinMessage = "A customer service agent has joined the conversation.";
    await sendSystemMessage(handoffMessage);
    await sendSystemMessage(agentJoinMessage);
    UI.removeAIHandlingBanner();
    UI.enableAgentInput();
  }
}

// Create chat thread with participants
async function createChatThread() {
  if (!chatClient) {
    throw new Error('Chat client is not initialized');
  }
  try {
    const createChatThreadRequest = { topic: "Flight Information" };
    const createChatThreadOptions = {
      participants: [
        { id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de7-5368-e138-8e3a0d00c891' }, displayName: 'Sarah Jones' },
        { id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de8-ad3e-7137-8e3a0d00d703' }, displayName: 'Support Agent' }
      ]
    };
    const createChatThreadResult = await chatClient.createChatThread(
      createChatThreadRequest,
      createChatThreadOptions
    );
    chatThreadId = createChatThreadResult.chatThread.id;
    return chatThreadId;
  } catch (error) {
    console.error('Error creating chat thread:', error);
    throw error;
  }
}

// Add customer to list (wrapper for UI)
function addCustomerToList(customerId, displayName, lastMessage, timestamp) {
  UI.addCustomerToList(customerId, displayName, lastMessage, timestamp, selectCustomer);
}

// Select customer (wrapper for UI)
function selectCustomer(customerId) {
  UI.selectCustomer(customerId);
  currentCustomer = customerId;
}

// Update customer list (wrapper for UI)
function updateCustomerList() {
  UI.updateCustomerList(chatThreadId, threadLatestMessage, addCustomerToList, selectCustomer);
}

// Update latest message and refresh list (wrapper for UI)
function setLatestMessage(threadId, message) {
  threadLatestMessage[threadId] = message;
  updateCustomerList();
}

// Add message to customer UI (wrapper for UI)
function addMessageToCustomerUI(message, isCustomer = false, messageId = null, isBot = false) {
  UI.addMessageToCustomerUI(message, isCustomer, messageId, isBot, chatThreadId, displayedMessageIds, setLatestMessage);
}

// Add message to agent UI (wrapper for UI)
function addMessageToAgentUI(message, isAgent = false, sender = null, messageId = null) {
  UI.addMessageToAgentUI(message, isAgent, sender, messageId, chatThreadId, displayedMessageIds, setLatestMessage);
}

// Add summary to agent UI (wrapper for UI)
function addSummaryToAgentUI(summary) {
  UI.addSummaryToAgentUI(summary);
}

// Display error message in UI (wrapper for UI)
function showErrorInUI(message) {
  UI.showErrorInUI(message);
}

// Show AI handling banner and disable input (wrapper for UI)
function showAIHandlingBanner() {
  UI.showAIHandlingBanner(handleTakeOver);
}

// Remove AI handling banner (wrapper for UI)
function removeAIHandlingBanner() {
  UI.removeAIHandlingBanner();
}

// Enable agent input (wrapper for UI)
function enableAgentInput() {
  UI.enableAgentInput();
}

// Handle summarize button click
const handleSummarizeClick = async () => {
  const summarizeButton = document.getElementById('summarizeButton');
  if (!summarizeButton || !chatThreadClient) {
    console.error('Required elements not initialized');
    return;
  }
  summarizeButton.disabled = true;
  try {
    const messages = [];
    const iterator = chatThreadClient.listMessages();
    for await (const message of iterator) {
      messages.push(message);
    }
    const summary = await summaryService.generateSummary(messages);
    addSummaryToAgentUI(summary);
    lastMessageTime = new Date();
  } catch (error) {
    console.error('Error generating summary:', error);
    showErrorInUI('Failed to generate conversation summary');
  } finally {
    summarizeButton.disabled = false;
  }
};

// Send customer message
async function sendCustomerMessage(content) {
  if (!content.trim()) {
    return;
  }
  try {
    const sendMessageRequest = { content: content };
    const sendMessageOptions = { senderDisplayName: 'Sarah Jones', type: 'text' };
    const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
    addMessageToCustomerUI(content, true, sendChatMessageResult.id, false);
    addMessageToAgentUI(content, false, 'Sarah Jones', sendChatMessageResult.id);
    customerInput.value = '';
    if (botService.isEnabled()) {
      const botResponse = await botService.processMessage(content);
      if (botResponse) {
        const botMessageRequest = { content: botResponse };
        const botMessageOptions = { senderDisplayName: 'AI Assistant', type: 'text' };
        const botMessageResult = await chatThreadClient.sendMessage(botMessageRequest, botMessageOptions);
        addMessageToCustomerUI(botResponse, false, botMessageResult.id, true);
        addMessageToAgentUI(botResponse, false, 'AI Assistant', botMessageResult.id);
      }
    }
    lastMessageTime = new Date();
    const summarizeButton = document.getElementById('summarizeButton');
    if (summarizeButton) {
      summarizeButton.disabled = false;
    }
  } catch (error) {
    console.error('Error in message flow:', error);
    showErrorInUI('Failed to process message: ' + error.message);
  }
}

// Send agent message
async function sendAgentMessage(content) {
  if (!content.trim()) {
    return;
  }
  const sendMessageRequest = { content: content };
  const sendMessageOptions = { senderDisplayName: 'Support Agent', type: 'text' };
  try {
    if (!chatThreadClient) {
      throw new Error('Chat thread client is not initialized');
    }
    const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
    addMessageToAgentUI(content, true, 'Support Agent', sendChatMessageResult.id);
    agentInput.value = '';
    lastMessageTime = new Date();
    const summarizeButton = document.getElementById('summarizeButton');
    if (summarizeButton) {
      summarizeButton.disabled = false;
    }
  } catch (error) {
    console.error('Error sending agent message:', error);
    showErrorInUI('Failed to send agent message: ' + error.message);
  }
}

// Send system message
async function sendSystemMessage(content) {
  try {
    const messageRequest = { content: content };
    const messageOptions = { senderDisplayName: 'System', type: 'text' };
    const messageResult = await chatThreadClient.sendMessage(messageRequest, messageOptions);
    const systemMessageId = `system-${messageResult.id}`;
    addMessageToCustomerUI(content, false, systemMessageId, false);
    addMessageToAgentUI(content, false, 'System', messageResult.id);
  } catch (error) {
    console.error('Error sending system message:', error);
  }
}

// Set up event handlers
async function setupEventHandlers() {
  if (!chatClient) {
    console.error('Cannot set up event handlers - Chat client is not initialized');
    return false;
  }
  try {
    chatClient.on("chatMessageReceived", (e) => {
      const senderDisplayName = e.senderDisplayName || 'Unknown';
      const messageContent = e.content || e.message || 'No content';
      const messageId = e.id || '';
      const isAgent = senderDisplayName === 'Support Agent';
      const isCustomer = senderDisplayName === 'Sarah Jones';
      if (isAgent) {
        addMessageToCustomerUI(messageContent, false, messageId, false);
      }
      if (isCustomer) {
        addMessageToAgentUI(messageContent, false, 'Sarah Jones', messageId);
      }
    });
    chatClient.on("participantsAdded", (e) => {
      console.log('New participants added:', e.participantsAdded.map(p => p.displayName).join(', '));
    });
    chatClient.on("participantsRemoved", (e) => {
      console.log('Participants removed:', e.participantsRemoved.map(p => p.displayName).join(', '));
    });
    chatClient.on("typingIndicatorReceived", (e) => {
      console.log(`${e.sender.displayName || 'Someone'} is typing...`);
    });
    return true;
  } catch (error) {
    console.error('Error setting up event handlers:', error);
    return false;
  }
}

// Initialize chat
async function initializeChat() {
  try {
    if (!chatClient) {
      throw new Error('Chat client is not initialized. Cannot proceed with initialization. Please check your environment variables.');
    }
    if (!endpointUrl || !userAccessToken) {
      throw new Error('Missing required credentials. Please set ACS_ENDPOINT_URL and ACS_USER_ACCESS_TOKEN in your .env file.');
    }
    try {
      await chatClient.startRealtimeNotifications();
      notificationsStarted = true;
      await setupEventHandlers();
    } catch (notifError) {
      console.error('Failed to start real-time notifications:', notifError);
      showErrorInUI('Failed to start real-time notifications. Chat will not update in real-time.');
    }
    const threadId = await createChatThread();
    chatThreadId = threadId;
    chatThreadClient = chatClient.getChatThreadClient(threadId);
    if (!chatThreadClient) {
      throw new Error('Failed to create chat thread client');
    }
    // Initialize customer list
    updateCustomerList();
    const greeting = await botService.startConversation();
    const botMessageRequest = { content: greeting };
    const botMessageOptions = { senderDisplayName: 'AI Assistant', type: 'text' };
    const botMessageResult = await chatThreadClient.sendMessage(botMessageRequest, botMessageOptions);
    addMessageToCustomerUI(greeting, false, botMessageResult.id, true);
    addMessageToAgentUI(greeting, false, 'AI Assistant', botMessageResult.id);
    showAIHandlingBanner();
    const summarizeButton = document.getElementById('summarizeButton');
    if (summarizeButton) {
      summarizeButton.addEventListener('click', handleSummarizeClick);
    }
    customerSendButton.addEventListener('click', () => {
      sendCustomerMessage(customerInput.value);
    });
    customerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendCustomerMessage(customerInput.value);
      }
    });
    agentSendButton.addEventListener('click', () => {
      sendAgentMessage(agentInput.value);
    });
    agentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendAgentMessage(agentInput.value);
      }
    });
  } catch (error) {
    console.error('Error initializing chat:', error);
    showErrorInUI('Chat initialization failed: ' + error.message);
  }
}

// Check browser capabilities
if (!window.WebSocket) {
  console.error('WebSockets not supported - real-time notifications may not work');
  UI.showErrorUI('Your browser does not support WebSockets. Real-time chat updates will not work.');
}

