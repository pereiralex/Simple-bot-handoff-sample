// <Create a chat client>
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import BotService, { SummaryService } from './bot-service.js';

let endpointUrl = 'https://alexper-test1.unitedstates.communication.azure.com/';
let userAccessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkY1M0ZEODA0RThBNDhBQzg4Qjg3NTA3M0M4MzRCRDdGNzBCMzBENDUiLCJ4NXQiOiI5VF9ZQk9pa2lzaUxoMUJ6eURTOWYzQ3pEVVUiLCJ0eXAiOiJKV1QifQ.eyJza3lwZWlkIjoiYWNzOmMyZjJiZjU0LTFiMzctNDY3Zi1hZGUzLTE1YzY0MjhkMDMxMF8wMDAwMDAyNi03MzJjLWE2NjktOWMzMi04ZTNhMGQwMDgwMDAiLCJzY3AiOjE3OTIsImNzaSI6IjE3NDMwMDY2NjMiLCJleHAiOjE3NDMwOTMwNjMsInJnbiI6ImFtZXIiLCJhY3NTY29wZSI6ImNoYXQiLCJyZXNvdXJjZUlkIjoiYzJmMmJmNTQtMWIzNy00NjdmLWFkZTMtMTVjNjQyOGQwMzEwIiwicmVzb3VyY2VMb2NhdGlvbiI6InVuaXRlZHN0YXRlcyIsImlhdCI6MTc0MzAwNjY2M30.BBApY3ipN0JqtYnzlnnxufiTP12RoHTdXDK7_4Hi63bWGqdct1ePIP0DexMZ6v_sfTHYxls1TMjuXO4zkRO2k8uAqMVhffbrUlFUIKq5o18X0glvlC7cf26qbKTq36y3pTHUPPce7_dMp6nOvzbhZTdwS6oDyhxXNgyfXFAer3NQrOXmg98PF824okMpEHkZTgtKbokeMasWBXgEx_li8vEskMgi1O9LGiFc9LCS3esXcOlj-yjcN3M874xJPE647FV-OOFN8c_LPx4mCyHJJ1vOagzDwAgyMItn2DsViTzkxMYLTFyv_frY8pAU8UsWapjtRf8m-AdO8Zux3T1aNg';

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

// Initialize summary service
const summaryService = new SummaryService();
let lastMessageTime = null;

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
        // Check if this is a system message
        const isSystem = sender === 'System';
        
        if (isSystem) {
            // Create a simpler wrapper for system messages
            const messageWrapper = document.createElement('div');
            messageWrapper.className = 'message-wrapper system';
            
            // Create message div for system message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'agent-message system';
            messageDiv.textContent = message;
            
            // Add to wrapper and then to container
            messageWrapper.appendChild(messageDiv);
            agentMessagesContainer.appendChild(messageWrapper);
        } else {
            // Create a wrapper for the message and avatar
            const messageWrapper = document.createElement('div');
            messageWrapper.style.display = 'flex';
            messageWrapper.style.alignItems = 'flex-start';
            messageWrapper.style.gap = '10px';
            messageWrapper.style.marginBottom = '15px';
            
            // Add 'bot' class if the sender is AI Assistant
            const isBot = sender === 'AI Assistant';
            
            // Create avatar element
            const avatarDiv = document.createElement('div');
            avatarDiv.className = isBot ? 'message-avatar bot' : 
                                isAgent ? 'message-avatar agent' : 
                                'message-avatar customer';
            
            // Set avatar content based on sender
            if (isBot) {
                avatarDiv.innerHTML = '🤖';
            } else if (isAgent) {
                avatarDiv.textContent = 'SA';
            } else {
                // Customer
                avatarDiv.textContent = 'SJ';
            }
            
            // Create message div
            const messageDiv = document.createElement('div');
            messageDiv.className = `agent-message ${isBot ? 'bot' : isAgent ? 'agent' : 'customer'}`;
            messageDiv.style.margin = '0';
            
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
            
            // Append avatar and message to wrapper
            if (isBot || isAgent) {
                // For bot and agent messages, avatar goes on the right
                messageWrapper.style.flexDirection = 'row-reverse';
                messageWrapper.appendChild(avatarDiv);
                messageWrapper.appendChild(messageDiv);
            } else {
                // For customer messages, avatar goes on the left
                messageWrapper.appendChild(avatarDiv);
                messageWrapper.appendChild(messageDiv);
            }
            
            // Add to agent messages container
            agentMessagesContainer.appendChild(messageWrapper);
        }
        
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
        // Check if this is a system message (passed via senderDisplayName in sendSystemMessage)
        const isSystem = messageId && messageId.includes('system');
        
        if (isSystem) {
            // Create a simple styled system message
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
            
            // Add timestamp
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            messageDiv.appendChild(timestamp);
            
            customerMessagesContainer.appendChild(messageDiv);
        }
        
        // Scroll to bottom
        customerMessagesContainer.scrollTop = customerMessagesContainer.scrollHeight;
        console.log('✅ Message added to customer UI successfully');
    } catch (error) {
        console.error('❌ Error adding message to customer UI:', error);
    }
}

// Add function to create and display summary card
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

    // Create header
    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.alignItems = 'center';
    headerDiv.style.marginBottom = '10px';
    headerDiv.style.paddingBottom = '10px';
    headerDiv.style.borderBottom = '1px solid #e1e1e1';

    const iconSpan = document.createElement('span');
    iconSpan.textContent = '📋';
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

    // Create content with formatted paragraphs
    const contentDiv = document.createElement('div');
    
    // Format summary with paragraphs
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

    // Add to agent messages container
    agentMessagesContainer.appendChild(summaryDiv);
    agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
}

// Add function to handle summarize button click
const handleSummarizeClick = async () => {
    const summarizeButton = document.getElementById('summarizeButton');
    if (!summarizeButton || !chatThreadClient) {
        console.error('Required elements not initialized');
        return;
    }
    
    summarizeButton.disabled = true;
    
    try {
        // Get all messages from the thread
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
        
        lastMessageTime = new Date();
        const summarizeButton = document.getElementById('summarizeButton');
        if (summarizeButton) {
            summarizeButton.disabled = false;
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
        
        lastMessageTime = new Date();
        const summarizeButton = document.getElementById('summarizeButton');
        if (summarizeButton) {
            summarizeButton.disabled = false;
        }
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
        
        // Add system message to both UIs - passing the "System" sender
        // Mark the message ID to identify it as a system message
        const systemMessageId = `system-${messageResult.id}`;
        addMessageToCustomerUI(content, false, systemMessageId, false);
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
        
        const summarizeButton = document.getElementById('summarizeButton');
        if (summarizeButton) {
            summarizeButton.addEventListener('click', handleSummarizeClick);
        }
        
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

