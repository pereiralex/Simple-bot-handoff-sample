// <Create a chat client>
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

let endpointUrl = 'https://alexper-test1.unitedstates.communication.azure.com/';
let userAccessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkY1M0ZEODA0RThBNDhBQzg4Qjg3NTA3M0M4MzRCRDdGNzBCMzBENDUiLCJ4NXQiOiI5VF9ZQk9pa2lzaUxoMUJ6eURTOWYzQ3pEVVUiLCJ0eXAiOiJKV1QifQ.eyJza3lwZWlkIjoiYWNzOmMyZjJiZjU0LTFiMzctNDY3Zi1hZGUzLTE1YzY0MjhkMDMxMF8wMDAwMDAyNi02ZGU3LTUzNjgtZTEzOC04ZTNhMGQwMGM4OTEiLCJzY3AiOjE3OTIsImNzaSI6IjE3NDI5MTgyMzMiLCJleHAiOjE3NDMwMDQ2MzMsInJnbiI6ImFtZXIiLCJhY3NTY29wZSI6ImNoYXQiLCJyZXNvdXJjZUlkIjoiYzJmMmJmNTQtMWIzNy00NjdmLWFkZTMtMTVjNjQyOGQwMzEwIiwicmVzb3VyY2VMb2NhdGlvbiI6InVuaXRlZHN0YXRlcyIsImlhdCI6MTc0MjkxODIzM30.gZtIf6QFf-7oEX_2BGvVOCvn9ciWg0UY_jgVYav7MS_OAM0gNEap9sc_cW1O2XNQPqFckSPSeUhpbnWDQ5noyMB3Du7sdcS9tsqB7i8_doBgfsmBv09Ps_WWbZ_P_fOxZ0NECgeXeWJTtzyjWlBXOndWa31Foi84X9xtpjzH61U6NVNyduWeDwrAEwz-7uSWTNY68kQikJB1AcjN9eF-j1xW5cngCDkqR7Hi78HyelJa9-IPx33OTSiS5cVpM4PNqDxVnpN2LY8jcRf12lk0XL3oFisjk7pOppRC0Stxa7TYN2DMOYWxVj7fl4vPFb7Xjz4zsb0-CCMl3TX_37H4OQ';

let chatClient = new ChatClient(endpointUrl, new AzureCommunicationTokenCredential(userAccessToken));
console.log('🚀 Azure Communication Chat client created!');

// DOM Elements
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

let chatThreadClient;

// Get our user ID from the access token
const tokenPayload = JSON.parse(atob(userAccessToken.split('.')[1]));
const ourUserId = tokenPayload.skypeid.replace('acs:', '');
console.log('🆔 Our user ID:', ourUserId);

// Track message IDs we've already displayed to prevent duplicates
const displayedMessageIds = new Set();

// Create a chat thread with initial participants
async function createChatThread() {
    console.log('📝 Creating new chat thread...');
    const createChatThreadRequest = {
        topic: "Team Discussion"
    };
    const createChatThreadOptions = {
        participants: [
            {
                id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de7-5368-e138-8e3a0d00c891' },
                displayName: 'Sarah Johnson'
            },
            {
                id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de8-ad3e-7137-8e3a0d00d703' },
                displayName: 'Michael Chen'
            }
        ]
    };
    
    const createChatThreadResult = await chatClient.createChatThread(
        createChatThreadRequest,
        createChatThreadOptions
    );
    console.log(`✨ Chat thread created with ID: ${createChatThreadResult.chatThread.id}`);
    console.log('👥 Initial participants added:', createChatThreadOptions.participants.map(p => p.displayName).join(', '));
    return createChatThreadResult.chatThread.id;
}

// Add a message to the UI
function addMessageToUI(message, sender, isSent = false, messageId = null) {
    // If this message ID has already been displayed, don't show it again
    if (messageId && displayedMessageIds.has(messageId)) {
        console.log(`📋 Skipping duplicate message with ID: ${messageId}`);
        return;
    }
    
    // Mark this message as displayed
    if (messageId) {
        displayedMessageIds.add(messageId);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'sender';
    senderDiv.textContent = sender;
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = message;
    
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(contentDiv);
    messageContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Send a message
async function sendMessage(content) {
    if (!content.trim()) return;
    
    console.log('📤 Sending message:', content);
    const sendMessageRequest = {
        content: content
    };
    const sendMessageOptions = {
        senderDisplayName: 'You',
        type: 'text'
    };
    
    try {
        const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        console.log(`✅ Message sent successfully! Message ID: ${sendChatMessageResult.id}`);
        // Add message to UI immediately with its ID to prevent duplicates
        addMessageToUI(content, 'You', true, sendChatMessageResult.id);
        messageInput.value = '';
    } catch (error) {
        console.error('❌ Error sending message:', error);
    }
}

// Initialize chat
async function initializeChat() {
    try {
        const threadId = await createChatThread();
        chatThreadClient = chatClient.getChatThreadClient(threadId);
        console.log('🔗 Connected to chat thread:', threadId);
        
        // Set up real-time notifications first
        console.log('🔄 Setting up real-time notifications...');
        await chatClient.startRealtimeNotifications();
        
        // Set up event listeners for various chat events
        chatClient.on("chatMessageReceived", (e) => {
            console.log(`📩 Message received from ${e.sender.displayName} (ID: ${e.sender.communicationUserId}), Message ID: ${e.id}`);
            
            const isSentByUs = e.sender.communicationUserId === ourUserId;
            if (isSentByUs) {
                console.log('📨 This was our own message - already displayed');
            } else {
                // Only add other participants' messages through the event
                addMessageToUI(e.message, e.sender.displayName, false, e.id);
            }
        });

        chatClient.on("participantsAdded", (e) => {
            console.log('👋 New participants added:', e.participantsAdded.map(p => p.displayName).join(', '));
        });

        chatClient.on("participantsRemoved", (e) => {
            console.log('👋 Participants removed:', e.participantsRemoved.map(p => p.displayName).join(', '));
        });

        chatClient.on("typingIndicatorReceived", (e) => {
            console.log(`✍️ ${e.sender.displayName} is typing...`);
        });
        
        // Add initial messages
        const initialMessages = [
            { content: "Hi everyone! Looking forward to our collaboration!", sender: "Sarah Johnson" },
            { content: "Hello team! Let's make this project amazing!", sender: "Michael Chen" }
        ];
        
        console.log('💬 Adding initial messages...');
        // Show initial messages immediately in UI
        for (const msg of initialMessages) {
            addMessageToUI(msg.content, msg.sender, false);
        }
        
        // Then send them to the server (but don't display again)
        for (const msg of initialMessages) {
            const sendMessageRequest = {
                content: msg.content
            };
            const sendMessageOptions = {
                senderDisplayName: msg.sender,
                type: 'text'
            };
            await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
            console.log(`📨 Initial message sent from ${msg.sender}: "${msg.content}"`);
        }
        
        // Set up UI event listeners
        sendButton.addEventListener('click', () => {
            sendMessage(messageInput.value);
        });
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage(messageInput.value);
            }
        });
        
        console.log('✅ Chat initialization complete!');
        
    } catch (error) {
        console.error('❌ Error initializing chat:', error);
    }
}

// Start the chat application
initializeChat();

