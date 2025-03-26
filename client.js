// <Create a chat client>
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import BotService from './bot-service.js';

let endpointUrl = 'https://alexper-test1.unitedstates.communication.azure.com/';
let userAccessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkY1M0ZEODA0RThBNDhBQzg4Qjg3NTA3M0M4MzRCRDdGNzBCMzBENDUiLCJ4NXQiOiI5VF9ZQk9pa2lzaUxoMUJ6eURTOWYzQ3pEVVUiLCJ0eXAiOiJKV1QifQ.eyJza3lwZWlkIjoiYWNzOmMyZjJiZjU0LTFiMzctNDY3Zi1hZGUzLTE1YzY0MjhkMDMxMF8wMDAwMDAyNi02ZGU3LTUzNjgtZTEzOC04ZTNhMGQwMGM4OTEiLCJzY3AiOjE3OTIsImNzaSI6IjE3NDI5MTgyMzMiLCJleHAiOjE3NDMwMDQ2MzMsInJnbiI6ImFtZXIiLCJhY3NTY29wZSI6ImNoYXQiLCJyZXNvdXJjZUlkIjoiYzJmMmJmNTQtMWIzNy00NjdmLWFkZTMtMTVjNjQyOGQwMzEwIiwicmVzb3VyY2VMb2NhdGlvbiI6InVuaXRlZHN0YXRlcyIsImlhdCI6MTc0MjkxODIzM30.gZtIf6QFf-7oEX_2BGvVOCvn9ciWg0UY_jgVYav7MS_OAM0gNEap9sc_cW1O2XNQPqFckSPSeUhpbnWDQ5noyMB3Du7sdcS9tsqB7i8_doBgfsmBv09Ps_WWbZ_P_fOxZ0NECgeXeWJTtzyjWlBXOndWa31Foi84X9xtpjzH61U6NVNyduWeDwrAEwz-7uSWTNY68kQikJB1AcjN9eF-j1xW5cngCDkqR7Hi78HyelJa9-IPx33OTSiS5cVpM4PNqDxVnpN2LY8jcRf12lk0XL3oFisjk7pOppRC0Stxa7TYN2DMOYWxVj7fl4vPFb7Xjz4zsb0-CCMl3TX_37H4OQ';

// DOM Element check
console.log('🔍 Checking DOM elements...');
const customerMessagesContainer = document.getElementById('customerMessages');
const customerInput = document.getElementById('customerInput');
const customerSendButton = document.getElementById('customerSendButton');

const agentMessagesContainer = document.getElementById('agentMessages');
const agentInput = document.getElementById('agentInput');
const agentSendButton = document.getElementById('agentSendButton');

// Log if any elements are missing
if (!customerMessagesContainer) console.error('❌ customerMessagesContainer not found');
if (!customerInput) console.error('❌ customerInput not found');
if (!customerSendButton) console.error('❌ customerSendButton not found');
if (!agentMessagesContainer) console.error('❌ agentMessagesContainer not found');
if (!agentInput) console.error('❌ agentInput not found');
if (!agentSendButton) console.error('❌ agentSendButton not found');

console.log('📦 All DOM elements loaded:', {
    customerMessagesContainer,
    customerInput,
    customerSendButton,
    agentMessagesContainer,
    agentInput,
    agentSendButton
});

// IMPORTANT: Define chatClient in the global scope
let chatClient;
let chatThreadClient;
let chatThreadId;
let notificationsStarted = false;

// Get our user ID from the access token
const tokenPayload = JSON.parse(atob(userAccessToken.split('.')[1]));
const ourUserId = tokenPayload.skypeid.replace('acs:', '');
console.log('🆔 Our user ID:', ourUserId);

// Initialize the chat client globally
try {
    console.log('🚀 Initializing Azure Communication Chat client...');
    chatClient = new ChatClient(endpointUrl, new AzureCommunicationTokenCredential(userAccessToken));
    console.log('✅ Chat client created successfully:', chatClient);
} catch (error) {
    console.error('❌ Error creating chat client:', error);
}

// Track message IDs we've already displayed to prevent duplicates
const displayedMessageIds = new Set();
console.log('🔄 Message tracking initialized');

// Initialize bot service
const botService = new BotService();
let isAgentActive = false;

// Add takeover button handler
const takeoverButton = document.getElementById('takeoverButton');
takeoverButton.addEventListener('click', async () => {
    if (!isAgentActive) {
        isAgentActive = true;
        takeoverButton.disabled = true;
        
        // Deactivate bot and send handoff message
        const handoffMessage = await botService.deactivate();
        
        // Send system message about agent joining
        const agentJoinMessage = "A customer service agent has joined the conversation.";
        
        // Send both messages through ACS
        await sendSystemMessage(handoffMessage);
        await sendSystemMessage(agentJoinMessage);
    }
});

// Function to show error message in UI
function showErrorInUI(message) {
    console.error('🚨 Showing error in UI:', message);
    
    try {
        // Show in customer UI
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
        
        // Show in agent UI
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

// Create a chat thread with participants
async function createChatThread() {
    console.log('📝 Creating new chat thread...');
    
    if (!chatClient) {
        throw new Error('Chat client is not initialized');
    }
    
    try {
    const createChatThreadRequest = {
            topic: "Flight Information"
    };
        
        console.log('👥 Setting up participants...');
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
        
        console.log('⏳ Awaiting thread creation with options:', createChatThreadOptions);
    const createChatThreadResult = await chatClient.createChatThread(
        createChatThreadRequest,
        createChatThreadOptions
    );
        
        chatThreadId = createChatThreadResult.chatThread.id;
        console.log(`✨ Chat thread created with ID: ${chatThreadId}`);
        console.log('📊 Thread details:', createChatThreadResult.chatThread);
        console.log('👥 Initial participants added:', createChatThreadOptions.participants.map(p => p.displayName).join(', '));
        
        return chatThreadId;
    } catch (error) {
        console.error('❌ Error creating chat thread:', error);
        throw error;
    }
}

// Modify addMessageToAgentUI function to handle bot messages
function addMessageToAgentUI(message, isAgent = false, sender = null, messageId = null) {
    console.log(`🖥️ Adding message to agent UI - Message: "${message}", isAgent: ${isAgent}, sender: ${sender}, messageId: ${messageId}`);
    
    // If this message ID has already been displayed, don't show it again
    if (messageId && displayedMessageIds.has(`agent-${messageId}`)) {
        console.log(`📋 Skipping duplicate agent message with ID: ${messageId}`);
        return;
    }
    
    // Mark this message as displayed
    if (messageId) {
        displayedMessageIds.add(`agent-${messageId}`);
        console.log(`✅ Marked message ${messageId} as displayed in agent UI`);
    }
    
    try {
        const messageDiv = document.createElement('div');
        // Add 'bot' class if the sender is AI Assistant
        const isBot = sender === 'AI Assistant';
        messageDiv.className = `agent-message ${isBot ? 'bot' : isAgent ? 'agent' : 'customer'}`;
        
        // Add sender if provided
        if (sender) {
            const senderDiv = document.createElement('div');
            senderDiv.className = 'sender';
            senderDiv.textContent = sender;
            messageDiv.appendChild(senderDiv);
        }
        
        // Add message content
        const contentDiv = document.createElement('div');
        contentDiv.textContent = message;
        messageDiv.appendChild(contentDiv);
        
        agentMessagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
        console.log('✅ Message added to agent UI successfully');
    } catch (error) {
        console.error('❌ Error adding message to agent UI:', error);
    }
}

// Modify addMessageToCustomerUI to handle bot messages like received messages
function addMessageToCustomerUI(message, isCustomer = false, messageId = null, isBot = false) {
    console.log(`🖥️ Adding message to customer UI - Message: "${message}", isCustomer: ${isCustomer}, messageId: ${messageId}`);
    
    // If this message ID has already been displayed, don't show it again
    if (messageId && displayedMessageIds.has(`customer-${messageId}`)) {
        console.log(`📋 Skipping duplicate customer message with ID: ${messageId}`);
        return;
    }
    
    // Mark this message as displayed
    if (messageId) {
        displayedMessageIds.add(`customer-${messageId}`);
        console.log(`✅ Marked message ${messageId} as displayed in customer UI`);
    }
    
    try {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isCustomer ? 'sent' : 'received'}`;
        messageDiv.textContent = message;
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timestamp);
        
        customerMessagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        customerMessagesContainer.scrollTop = customerMessagesContainer.scrollHeight;
        console.log('✅ Message added to customer UI successfully');
    } catch (error) {
        console.error('❌ Error adding message to customer UI:', error);
    }
}

// Update the bot message handling in sendCustomerMessage
async function sendCustomerMessage(content) {
    if (!content.trim()) {
        console.log('⚠️ Empty message - not sending');
        return;
    }
    
    console.log(`📤 Sending customer message: "${content}"`);
    
    try {
        // Send customer message through ACS
        const sendMessageRequest = {
            content: content
        };
        const sendMessageOptions = {
            senderDisplayName: 'Sarah Jones',
            type: 'text'
        };
        
        const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        
        // Add message to customer UI immediately
        addMessageToCustomerUI(content, true, sendChatMessageResult.id, false);
        addMessageToAgentUI(content, false, 'Sarah Jones', sendChatMessageResult.id);
        
        // Clear input
        customerInput.value = '';
        
        // If bot is active, get bot response
        if (botService.isEnabled()) {
            const botResponse = await botService.processMessage(content);
            if (botResponse) {
                // Send bot response through ACS
                const botMessageRequest = {
                    content: botResponse
                };
                const botMessageOptions = {
                    senderDisplayName: 'AI Assistant',
                    type: 'text'
                };
                
                const botMessageResult = await chatThreadClient.sendMessage(botMessageRequest, botMessageOptions);
                
                // Add bot response to both UIs with bot styling
                addMessageToCustomerUI(botResponse, false, botMessageResult.id, true);
                addMessageToAgentUI(botResponse, false, 'AI Assistant', botMessageResult.id);
            }
        }
    } catch (error) {
        console.error('❌ Error in message flow:', error);
        showErrorInUI('Failed to process message: ' + error.message);
    }
}

// Send a message from agent
async function sendAgentMessage(content) {
    if (!content.trim()) {
        console.log('⚠️ Empty message - not sending');
        return;
    }
    
    console.log(`📤 Sending agent message: "${content}"`);
    console.log('🧪 Current chatThreadClient:', chatThreadClient);
    
    const sendMessageRequest = {
        content: content
    };
    const sendMessageOptions = {
        senderDisplayName: 'Support Agent',
        type: 'text'
    };
    
    console.log('📦 Message request:', sendMessageRequest);
    console.log('⚙️ Message options:', sendMessageOptions);
    
    try {
        if (!chatThreadClient) {
            throw new Error('Chat thread client is not initialized');
        }
        
        console.log('⏳ Awaiting sendMessage response...');
        const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        console.log(`✅ Agent message sent successfully! Message ID: ${sendChatMessageResult.id}`);
        console.log('📊 Send result details:', sendChatMessageResult);
        
        // Add message to agent UI immediately
        addMessageToAgentUI(content, true, 'Support Agent', sendChatMessageResult.id);
        agentInput.value = '';
    } catch (error) {
        console.error('❌ Error sending agent message:', error);
        console.error('🧪 Error details:', {
            error,
            chatThreadClient,
            threadId: chatThreadId
        });
        showErrorInUI('Failed to send agent message: ' + error.message);
    }
}

// Add function to send system messages
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
        
        // Add system message to both UIs
        addMessageToCustomerUI(content, false, messageResult.id, false);
        addMessageToAgentUI(content, false, 'System', messageResult.id);
    } catch (error) {
        console.error('❌ Error sending system message:', error);
    }
}

// Set up event handlers for real-time notifications
async function setupEventHandlers() {
    if (!chatClient) {
        console.error('❌ Cannot set up event handlers - Chat client is not initialized');
        return false;
    }

    try {
        // Message received handler
        chatClient.on("chatMessageReceived", (e) => {
            console.log('🎯 chatMessageReceived event triggered');
            console.log('📩 Message received - FULL EVENT:', JSON.stringify(e));
            
            // Extract the sender display name and message content
            const senderDisplayName = e.senderDisplayName || 'Unknown';
            const messageContent = e.content || e.message || 'No content';
            const messageId = e.id || '';
            
            console.log(`📩 Message received - From: ${senderDisplayName}, Content: ${messageContent}, ID: ${messageId}`);
            
            const isAgent = senderDisplayName === 'Support Agent';
            const isCustomer = senderDisplayName === 'Sarah Jones';
            
            console.log(`🧪 Sender analysis - isAgent: ${isAgent}, isCustomer: ${isCustomer}`);
            
            // If the message is from the agent, show in customer view as a received message
            if (isAgent) {
                console.log('🔍 Agent message detected - adding to customer UI');
                addMessageToCustomerUI(messageContent, false, messageId, false);
            }
            
            // If the message is from the customer, show in agent view
            if (isCustomer) {
                console.log('🔍 Customer message detected - adding to agent UI');
                addMessageToAgentUI(messageContent, false, 'Sarah Jones', messageId);
            }
        });

        chatClient.on("participantsAdded", (e) => {
            console.log('🎯 participantsAdded event triggered');
            console.log('👋 New participants added:', e.participantsAdded.map(p => p.displayName).join(', '));
        });

        chatClient.on("participantsRemoved", (e) => {
            console.log('🎯 participantsRemoved event triggered');
            console.log('👋 Participants removed:', e.participantsRemoved.map(p => p.displayName).join(', '));
        });

        chatClient.on("typingIndicatorReceived", (e) => {
            console.log('🎯 typingIndicatorReceived event triggered');
            console.log(`✍️ ${e.sender.displayName || 'Someone'} is typing...`);
        });
        
        console.log('✅ Event handlers set up successfully');
        return true;
    } catch (error) {
        console.error('❌ Error setting up event handlers:', error);
        return false;
    }
}

// Modify initializeChat to start bot conversation
async function initializeChat() {
    console.log('🚀 Starting chat initialization...');
    
    try {
        // Make sure the chat client is available
        if (!chatClient) {
            throw new Error('Chat client is not initialized. Cannot proceed with initialization.');
        }
        
        // Start real-time notifications FIRST - before creating chat thread
        console.log('🔄 Setting up real-time notifications...');
        try {
            await chatClient.startRealtimeNotifications();
            notificationsStarted = true;
            console.log('✅ Real-time notifications started');
            
            // Set up event handlers immediately after starting notifications
            await setupEventHandlers();
        } catch (notifError) {
            console.error('❌ Failed to start real-time notifications:', notifError);
            showErrorInUI('Failed to start real-time notifications. Chat will not update in real-time.');
        }
        
        // Create thread and get thread ID
        console.log('🧵 Creating chat thread...');
        const threadId = await createChatThread();
        chatThreadId = threadId;
        
        // Initialize chat thread client
        console.log(`🔗 Creating chat thread client for thread ID: ${threadId}`);
        chatThreadClient = chatClient.getChatThreadClient(threadId);
        
        if (!chatThreadClient) {
            throw new Error('Failed to create chat thread client');
        }
        
        console.log('✅ Chat thread client created:', chatThreadClient);
        
        // Start bot conversation with greeting
        const greeting = await botService.startConversation();
        
        // Send bot greeting through ACS
        const botMessageRequest = {
            content: greeting
        };
        const botMessageOptions = {
            senderDisplayName: 'AI Assistant',
            type: 'text'
        };
        
        const botMessageResult = await chatThreadClient.sendMessage(botMessageRequest, botMessageOptions);
        
        // Add bot greeting to both UIs with bot styling
        addMessageToCustomerUI(greeting, false, botMessageResult.id, true);
        addMessageToAgentUI(greeting, false, 'AI Assistant', botMessageResult.id);
        
        // Set up UI event listeners
        console.log('🖱️ Setting up UI event listeners...');
        
        customerSendButton.addEventListener('click', () => {
            console.log('🖱️ Customer send button clicked');
            sendCustomerMessage(customerInput.value);
        });
        
        customerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('⌨️ Customer pressed Enter key');
                sendCustomerMessage(customerInput.value);
            }
        });
        
        agentSendButton.addEventListener('click', () => {
            console.log('🖱️ Agent send button clicked');
            sendAgentMessage(agentInput.value);
        });
        
        agentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('⌨️ Agent pressed Enter key');
                sendAgentMessage(agentInput.value);
            }
        });
        
        console.log('✅ Chat initialization complete!');
        
    } catch (error) {
        console.error('❌ Error initializing chat:', error);
        console.error('🧪 Detailed error information:', {
            error,
            stack: error.stack,
            message: error.message
        });
        
        // Show error in UI
        showErrorInUI('Chat initialization failed: ' + error.message);
    }
}

// Check browser capabilities
console.log('🌐 Checking browser capabilities...');
if (!window.WebSocket) {
    console.error('❌ WebSockets not supported - real-time notifications may not work');
    showErrorInUI('Your browser does not support WebSockets. Real-time chat updates will not work.');
}

// Start the customer service chat application
console.log('🚀 Starting application...');
initializeChat();
console.log('✅ Application startup complete - awaiting initialization to finish');

