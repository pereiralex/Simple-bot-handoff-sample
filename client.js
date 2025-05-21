// Azure Communication Services client setup
import 'dotenv/config';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import BotService, { SummaryService } from './bot-service.js';

// Load environment variables
let endpointUrl = process.env.ACS_ENDPOINT_URL;
let userAccessToken = process.env.ACS_USER_ACCESS_TOKEN;

// Validate required environment variables
if (!endpointUrl || !userAccessToken) {
  console.error('Required environment variables are missing!');
  console.error('Please ensure ACS_ENDPOINT_URL and ACS_USER_ACCESS_TOKEN are set in your .env file');
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; text-align: center; border: 2px solid red; border-radius: 8px;">
      <h2>Configuration Error</h2>
      <p>Missing required environment variables. Please check your .env file and ensure the following are set correctly:</p>
      <ul style="list-style: none; text-align: left; display: inline-block;">
        <li>${endpointUrl ? '✅ ACS_ENDPOINT_URL is set' : '❌ ACS_ENDPOINT_URL is missing'}</li>
        <li>${userAccessToken ? '✅ ACS_USER_ACCESS_TOKEN is set' : '❌ ACS_USER_ACCESS_TOKEN is missing'}</li>
      </ul>
      <p>Refer to the README.md for setup instructions.</p>
    </div>
  `;
}

// Initialize DOM elements
const customerMessagesContainer = document.getElementById('customerMessages');
const customerInput = document.getElementById('customerInput');
const customerSendButton = document.getElementById('customerSendButton');

const agentMessagesContainer = document.getElementById('agentMessages');
const agentInput = document.getElementById('agentInput');
const agentSendButton = document.getElementById('agentSendButton');

// Log missing elements
if (!customerMessagesContainer) console.error('customerMessagesContainer not found');
if (!customerInput) console.error('customerInput not found');
if (!customerSendButton) console.error('customerSendButton not found');
if (!agentMessagesContainer) console.error('agentMessagesContainer not found');
if (!agentInput) console.error('agentInput not found');
if (!agentSendButton) console.error('agentSendButton not found');

// Global variables
let chatClient;
let chatThreadClient;
let chatThreadId;
let notificationsStarted = false;

// Extract user ID from access token
let ourUserId;
if (userAccessToken) {
  try {
    const cleanToken = userAccessToken.trim().replace(/^['"]|['"]$/g, '');
    const tokenPayload = JSON.parse(atob(cleanToken.split('.')[1]));
    ourUserId = tokenPayload.skypeid.replace('acs:', '');
  } catch (error) {
    console.error('Error parsing user access token:', error);
    ourUserId = null;
  }
} else {
  console.error('Cannot get user ID - access token is missing');
}

// Initialize chat client
if (endpointUrl && userAccessToken) {
  try {
    const cleanToken = userAccessToken.trim().replace(/^['"]|['"]$/g, '');
    chatClient = new ChatClient(endpointUrl, new AzureCommunicationTokenCredential(cleanToken));
  } catch (error) {
    console.error('Error creating chat client:', error);
    document.body.innerHTML = `
      <div style="color: red; padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; text-align: center; border: 2px solid red; border-radius: 8px;">
        <h2>Chat Client Error</h2>
        <p>Failed to initialize Azure Communication Services chat client.</p>
        <p>Error: ${error.message}</p>
        <p>Please check your credentials and try again.</p>
      </div>
    `;
  }
} else {
  console.error('Cannot initialize chat client - missing required configuration');
}

// Track displayed messages to prevent duplicates
const displayedMessageIds = new Set();

// Initialize services
const botService = new BotService();
let isAgentActive = false;
const summaryService = new SummaryService();
let lastMessageTime = null;

// Show AI handling banner and disable input
function showAIHandlingBanner() {
    removeAIHandlingBanner();
    
    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'ai-handling-banner';
    bannerDiv.id = 'aiHandlingBanner';
    
    bannerDiv.innerHTML = `
        <span class="ai-icon">AI</span>
        <span>AI Assistant is handling this conversation</span>
        <button class="take-over-link" id="bannerTakeOverBtn">Take Over</button>
    `;
    
    const agentChat = document.querySelector('.agent-chat');
    const inputArea = document.querySelector('.agent-chat-input');
    
    if (agentChat && inputArea) {
        inputArea.style.display = 'none';
        agentChat.appendChild(bannerDiv);
        
        const bannerTakeOverBtn = document.getElementById('bannerTakeOverBtn');
        if (bannerTakeOverBtn) {
            bannerTakeOverBtn.addEventListener('click', handleTakeOver);
        }
    }
}

// Handle agent taking over conversation
async function handleTakeOver() {
    if (!isAgentActive) {
        isAgentActive = true;
        
        const handoffMessage = await botService.deactivate();
        const agentJoinMessage = "A customer service agent has joined the conversation.";
        
        await sendSystemMessage(handoffMessage);
        await sendSystemMessage(agentJoinMessage);
        
        removeAIHandlingBanner();
        enableAgentInput();
    }
}

// Remove AI handling banner
function removeAIHandlingBanner() {
    const existingBanner = document.getElementById('aiHandlingBanner');
    if (existingBanner) {
        existingBanner.remove();
    }
    
    const inputArea = document.querySelector('.agent-chat-input');
    if (inputArea) {
        inputArea.style.display = 'flex';
    }
}

// Enable agent input
function enableAgentInput() {
    const inputArea = document.querySelector('.agent-chat-input');
    if (inputArea) {
        inputArea.classList.remove('disabled');
        inputArea.style.display = 'flex';
        
        const input = document.getElementById('agentInput');
        const sendButton = document.getElementById('agentSendButton');
        
        if (input) {
            input.disabled = false;
            input.placeholder = 'Enter a message';
        }
        
        if (sendButton) {
            sendButton.disabled = false;
        }
    }
}

// Display error message in UI
function showErrorInUI(message) {
    console.error('Showing error in UI:', message);
    
    try {
        if (customerMessagesContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message error';
            errorDiv.style.backgroundColor = '#ffdddd';
            errorDiv.style.color = '#cc0000';
            errorDiv.style.padding = '10px 15px';
            errorDiv.style.margin = '10px 0';
            errorDiv.style.borderRadius = '8px';
            errorDiv.style.alignSelf = 'center';
            errorDiv.textContent = `Error: ${message}`;
            customerMessagesContainer.appendChild(errorDiv);
            customerMessagesContainer.scrollTop = customerMessagesContainer.scrollHeight;
        }
        
        if (agentMessagesContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'agent-message error';
            errorDiv.style.backgroundColor = '#ffdddd';
            errorDiv.style.color = '#cc0000';
            errorDiv.style.padding = '10px 15px';
            errorDiv.style.margin = '10px 0';
            errorDiv.style.borderRadius = '8px';
            errorDiv.style.alignSelf = 'center';
            errorDiv.textContent = `Error: ${message}`;
            agentMessagesContainer.appendChild(errorDiv);
            agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to show error in UI:', error);
    }
}

// Create chat thread with participants
async function createChatThread() {
    if (!chatClient) {
        throw new Error('Chat client is not initialized');
    }
    
    try {
        const createChatThreadRequest = {
            topic: "Flight Information"
        };
        
        const createChatThreadOptions = {
            participants: [
                {
                    id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de7-5368-e138-8e3a0d00c891' },
                    displayName: 'Sarah Jones'
                },
                {
                    id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de8-ad3e-7137-8e3a0d00d703' },
                    displayName: 'Support Agent'
                }
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

// Add message to agent UI
function addMessageToAgentUI(message, isAgent = false, sender = null, messageId = null) {
    if (messageId && displayedMessageIds.has(`agent-${messageId}`)) {
        return;
    }
    
    if (messageId) {
        displayedMessageIds.add(`agent-${messageId}`);
    }
    
    try {
        const isSystem = sender === 'System';
        
        if (isSystem) {
            const messageWrapper = document.createElement('div');
            messageWrapper.className = 'message-wrapper system';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'agent-message system';
            messageDiv.textContent = message;
            
            messageWrapper.appendChild(messageDiv);
            agentMessagesContainer.appendChild(messageWrapper);
        } else {
            const messageWrapper = document.createElement('div');
            messageWrapper.style.display = 'flex';
            messageWrapper.style.alignItems = 'flex-start';
            messageWrapper.style.gap = '10px';
            messageWrapper.style.marginBottom = '15px';
            
            const isBot = sender === 'AI Assistant';
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = isBot ? 'message-avatar bot' : 
                                isAgent ? 'message-avatar agent' : 
                                'message-avatar customer';
            
            if (isBot) {
                avatarDiv.innerHTML = 'AI';
            } else if (isAgent) {
                avatarDiv.textContent = 'SA';
            } else {
                avatarDiv.textContent = 'SJ';
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `agent-message ${isBot ? 'bot' : isAgent ? 'agent' : 'customer'}`;
            messageDiv.style.margin = '0';
            
            if (sender) {
                const senderDiv = document.createElement('div');
                senderDiv.className = 'sender';
                senderDiv.textContent = sender;
                messageDiv.appendChild(senderDiv);
            }
            
            const contentDiv = document.createElement('div');
            contentDiv.textContent = message;
            messageDiv.appendChild(contentDiv);
            
            if (isBot || isAgent) {
                messageWrapper.style.flexDirection = 'row-reverse';
                messageWrapper.appendChild(avatarDiv);
                messageWrapper.appendChild(messageDiv);
            } else {
                messageWrapper.appendChild(avatarDiv);
                messageWrapper.appendChild(messageDiv);
            }
            
            agentMessagesContainer.appendChild(messageWrapper);
        }
        
        agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error adding message to agent UI:', error);
    }
}

// Add message to customer UI
function addMessageToCustomerUI(message, isCustomer = false, messageId = null, isBot = false) {
    if (messageId && displayedMessageIds.has(`customer-${messageId}`)) {
        return;
    }
    
    if (messageId) {
        displayedMessageIds.add(`customer-${messageId}`);
    }
    
    try {
        const isSystem = messageId && messageId.includes('system');
        
        if (isSystem) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message system';
            messageDiv.style.alignSelf = 'center';
            messageDiv.style.background = 'transparent';
            messageDiv.style.color = '#6c757d';
            messageDiv.style.fontSize = '13px';
            messageDiv.style.padding = '5px 15px';
            messageDiv.style.textAlign = 'center';
            messageDiv.style.maxWidth = '100%';
            messageDiv.style.border = 'none';
            messageDiv.textContent = message;
            
            customerMessagesContainer.appendChild(messageDiv);
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isCustomer ? 'sent' : 'received'}`;
            messageDiv.textContent = message;
            
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            messageDiv.appendChild(timestamp);
            
            customerMessagesContainer.appendChild(messageDiv);
        }
        
        customerMessagesContainer.scrollTop = customerMessagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error adding message to customer UI:', error);
    }
}

// Add summary to agent UI
function addSummaryToAgentUI(summary) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'agent-message summary-card';
    summaryDiv.style.width = '80%';
    summaryDiv.style.maxWidth = '600px';
    summaryDiv.style.alignSelf = 'center';
    summaryDiv.style.background = 'white';
    summaryDiv.style.border = '1px solid #ccd';
    summaryDiv.style.borderRadius = '8px';
    summaryDiv.style.padding = '15px';
    summaryDiv.style.margin = '10px 0';
    summaryDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.alignItems = 'center';
    headerDiv.style.marginBottom = '10px';
    headerDiv.style.paddingBottom = '10px';
    headerDiv.style.borderBottom = '1px solid #e1e1e1';

    const iconSpan = document.createElement('span');
    iconSpan.textContent = 'Summary';
    iconSpan.style.marginRight = '8px';
    iconSpan.style.fontSize = '16px';

    const headerText = document.createElement('span');
    headerText.textContent = 'Conversation Summary';
    headerText.style.fontWeight = '600';
    headerText.style.color = '#333';
    headerText.style.fontSize = '16px';

    const timestamp = document.createElement('span');
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestamp.style.marginLeft = 'auto';
    timestamp.style.color = '#888';
    timestamp.style.fontSize = '12px';

    headerDiv.appendChild(iconSpan);
    headerDiv.appendChild(headerText);
    headerDiv.appendChild(timestamp);

    const contentDiv = document.createElement('div');
    const paragraphs = summary.split('\n').filter(p => p.trim() !== '');
    
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        p.style.margin = '0 0 10px 0';
        p.style.lineHeight = '1.5';
        contentDiv.appendChild(p);
    });
    
    contentDiv.style.color = '#444';
    contentDiv.style.fontSize = '14px';
    contentDiv.style.lineHeight = '1.5';

    summaryDiv.appendChild(headerDiv);
    summaryDiv.appendChild(contentDiv);

    agentMessagesContainer.appendChild(summaryDiv);
    agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
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
        const sendMessageRequest = {
            content: content
        };
        const sendMessageOptions = {
            senderDisplayName: 'Sarah Jones',
            type: 'text'
        };
        
        const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        
        addMessageToCustomerUI(content, true, sendChatMessageResult.id, false);
        addMessageToAgentUI(content, false, 'Sarah Jones', sendChatMessageResult.id);
        
        customerInput.value = '';
        
        if (botService.isEnabled()) {
            const botResponse = await botService.processMessage(content);
            if (botResponse) {
                const botMessageRequest = {
                    content: botResponse
                };
                const botMessageOptions = {
                    senderDisplayName: 'AI Assistant',
                    type: 'text'
                };
                
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
    
    const sendMessageRequest = {
        content: content
    };
    const sendMessageOptions = {
        senderDisplayName: 'Support Agent',
        type: 'text'
    };
    
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
        const messageRequest = {
            content: content
        };
        const messageOptions = {
            senderDisplayName: 'System',
            type: 'text'
        };
        
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
        
        const greeting = await botService.startConversation();
        
        const botMessageRequest = {
            content: greeting
        };
        const botMessageOptions = {
            senderDisplayName: 'AI Assistant',
            type: 'text'
        };
        
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
    showErrorInUI('Your browser does not support WebSockets. Real-time chat updates will not work.');
}

// Start the application
initializeChat();

