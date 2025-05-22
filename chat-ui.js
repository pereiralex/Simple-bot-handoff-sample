// UI and DOM manipulation functions for chat app

export function validateUIElements() {
    const customerMessagesContainer = document.getElementById('customerMessages');
    const customerInput = document.getElementById('customerInput');
    const customerSendButton = document.getElementById('customerSendButton');
    const agentMessagesContainer = document.getElementById('agentMessages');
    const agentInput = document.getElementById('agentInput');
    const agentSendButton = document.getElementById('agentSendButton');
    const elements = {
        customerMessagesContainer,
        customerInput,
        customerSendButton,
        agentMessagesContainer,
        agentInput,
        agentSendButton
    };
    Object.entries(elements).forEach(([name, element]) => {
        if (!element) console.error(`${name} not found`);
    });
}

export function showErrorInUI(message) {
    const customerMessagesContainer = document.getElementById('customerMessages');
    const agentMessagesContainer = document.getElementById('agentMessages');
    console.error('Showing error in UI:', message);
    try {
        if (customerMessagesContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message error-message';
            errorDiv.textContent = `Error: ${message}`;
            customerMessagesContainer.appendChild(errorDiv);
            customerMessagesContainer.scrollTop = customerMessagesContainer.scrollHeight;
        }
        if (agentMessagesContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'agent-message error-message';
            errorDiv.textContent = `Error: ${message}`;
            agentMessagesContainer.appendChild(errorDiv);
            agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to show error in UI:', error);
    }
}

export function showAIHandlingBanner(handleTakeOver) {
    removeAIHandlingBanner();
    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'ai-handling-banner';
    bannerDiv.id = 'aiHandlingBanner';
    bannerDiv.innerHTML = `
        <span class="ai-icon">🤖</span>
        <span>AI Assistant is handling this conversation</span>
        <button class="take-over-link" id="bannerTakeOverBtn">Take Over</button>
    `;
    const bannerContainer = document.getElementById('aiHandlingBannerContainer');
    if (bannerContainer) {
        bannerContainer.innerHTML = '';
        bannerContainer.appendChild(bannerDiv);
    }
    const inputArea = document.querySelector('.agent-chat-input');
    if (inputArea) {
        inputArea.classList.add('input-area-hidden');
    }
    const bannerTakeOverBtn = document.getElementById('bannerTakeOverBtn');
    if (bannerTakeOverBtn && handleTakeOver) {
        bannerTakeOverBtn.addEventListener('click', handleTakeOver);
    }
}

export function removeAIHandlingBanner() {
    const existingBanner = document.getElementById('aiHandlingBanner');
    if (existingBanner) {
        existingBanner.remove();
    }
    const bannerContainer = document.getElementById('aiHandlingBannerContainer');
    if (bannerContainer) {
        bannerContainer.innerHTML = '';
    }
    const inputArea = document.querySelector('.agent-chat-input');
    if (inputArea) {
        inputArea.classList.add('input-area-visible');
    }
}

export function enableAgentInput() {
    const inputArea = document.querySelector('.agent-chat-input');
    if (inputArea) {
        inputArea.classList.remove('disabled');
        inputArea.classList.add('input-area-visible');
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

export function addCustomerToList(customerId, displayName, lastMessage, timestamp, selectCustomer) {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;
    const customerItem = document.createElement('div');
    customerItem.className = 'customer-item';
    customerItem.dataset.customerId = customerId;
    customerItem.innerHTML = `
        <div class="customer-name">
            ${displayName}
            <span class="message-time">${timestamp}</span>
        </div>
        <div class="customer-message">${lastMessage}</div>
    `;
    customerItem.addEventListener('click', () => selectCustomer(customerId));
    customerList.appendChild(customerItem);
}

export function selectCustomer(customerId) {
    const customerItems = document.querySelectorAll('.customer-item');
    customerItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.customerId === customerId) {
            item.classList.add('active');
        }
    });
}

export function updateCustomerList(chatThreadId, threadLatestMessage, addCustomerToList, selectCustomer) {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;
    customerList.innerHTML = '';
    if (chatThreadId) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const lastMessage = threadLatestMessage[chatThreadId] || 'No messages yet.';
        addCustomerToList(
            chatThreadId,
            'Sarah Jones',
            lastMessage,
            timeString,
            selectCustomer
        );
        selectCustomer(chatThreadId);
    }
}

export function setLatestMessage(threadId, message, threadLatestMessage, updateCustomerList) {
    threadLatestMessage[threadId] = message;
    updateCustomerList();
}

function renderMessage({
    container,
    message,
    sender = '',
    isCustomer = false,
    isAgent = false,
    isBot = false,
    isSystem = false,
    messageId = null
}) {
    if (!container) return;
    // Prevent duplicate messages if messageId is provided
    if (messageId && container.querySelector(`[data-message-id="${messageId}"]`)) return;

    let messageDiv, messageWrapper;
    if (isSystem) {
        messageDiv = document.createElement('div');
        messageDiv.className = container.id === 'agentMessages' ? 'agent-message system' : 'message system-message';
        messageDiv.textContent = message;
        if (messageId) messageDiv.dataset.messageId = messageId;
        if (container.id === 'agentMessages') {
            messageWrapper = document.createElement('div');
            messageWrapper.className = 'message-wrapper system';
            messageWrapper.appendChild(messageDiv);
            container.appendChild(messageWrapper);
        } else {
            container.appendChild(messageDiv);
        }
    } else if (container.id === 'agentMessages') {
        // AGENT VIEW
        messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        if (isAgent || isBot) messageWrapper.classList.add('reversed');
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = isBot ? 'message-avatar bot' : isAgent ? 'message-avatar agent' : 'message-avatar customer';
        if (isBot) {
            avatarDiv.innerHTML = '🤖';
        } else if (isAgent) {
            avatarDiv.textContent = 'SA';
        } else {
            avatarDiv.textContent = 'CA';
        }
        // Message content
        messageDiv = document.createElement('div');
        messageDiv.className = `agent-message ${isBot ? 'bot' : isAgent ? 'agent' : 'customer'} message-content`;
        if (sender) {
            const senderDiv = document.createElement('div');
            senderDiv.className = 'sender';
            senderDiv.textContent = sender;
            messageDiv.appendChild(senderDiv);
        }
        const contentDiv = document.createElement('div');
        contentDiv.textContent = message;
        messageDiv.appendChild(contentDiv);
        if (messageId) messageDiv.dataset.messageId = messageId;
        // Append avatar and message
        if (isAgent || isBot) {
            messageWrapper.appendChild(avatarDiv);
            messageWrapper.appendChild(messageDiv);
        } else {
            messageWrapper.appendChild(avatarDiv);
            messageWrapper.appendChild(messageDiv);
        }
        container.appendChild(messageWrapper);
        // Timestamp below the message bubble
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageWrapper.appendChild(timestamp);
    } else {
        // CUSTOMER VIEW
        messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar customer';
        avatarDiv.textContent = 'CA';
        // Message content
        messageDiv = document.createElement('div');
        messageDiv.className = `message ${isCustomer ? 'sent' : 'received'}`;
        messageDiv.textContent = message;
        // Timestamp inside the message bubble
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timestamp);
        if (messageId) messageDiv.dataset.messageId = messageId;
        messageWrapper.appendChild(avatarDiv);
        messageWrapper.appendChild(messageDiv);
        container.appendChild(messageWrapper);
    }
    container.scrollTop = container.scrollHeight;
}

export function addMessageToCustomerUI(message, isCustomer = false, messageId = null, isBot = false, chatThreadId, displayedMessageIds, setLatestMessage) {
    if (messageId && displayedMessageIds.has(`customer-${messageId}`)) return;
    if (messageId) displayedMessageIds.add(`customer-${messageId}`);
    const isSystem = messageId && messageId.includes('system');
    renderMessage({
        container: document.getElementById('customerMessages'),
        message,
        isCustomer,
        isSystem,
        messageId
    });
    setLatestMessage(chatThreadId, message);
}

export function addMessageToAgentUI(message, isAgent = false, sender = null, messageId = null, chatThreadId, displayedMessageIds, setLatestMessage) {
    if (messageId && displayedMessageIds.has(`agent-${messageId}`)) return;
    if (messageId) displayedMessageIds.add(`agent-${messageId}`);
    const isSystem = sender === 'System';
    const isBot = sender === 'AI Assistant';
    renderMessage({
        container: document.getElementById('agentMessages'),
        message,
        sender,
        isAgent,
        isBot,
        isSystem,
        messageId
    });
    setLatestMessage(chatThreadId, message);
}

export function addSummaryToAgentUI(summary) {
    const agentMessagesContainer = document.getElementById('agentMessages');
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'summary-card';
    const headerDiv = document.createElement('div');
    headerDiv.className = 'summary-card-header';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'summary-card-header-icon';
    iconSpan.textContent = 'Summary';
    const headerText = document.createElement('span');
    headerText.className = 'summary-card-header-text';
    headerText.textContent = 'Conversation Summary';
    const timestamp = document.createElement('span');
    timestamp.className = 'summary-card-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const contentDiv = document.createElement('div');
    contentDiv.className = 'summary-card-content';
    const paragraphs = summary.split('\n').filter(p => p.trim() !== '');
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        contentDiv.appendChild(p);
    });
    headerDiv.appendChild(iconSpan);
    headerDiv.appendChild(headerText);
    headerDiv.appendChild(timestamp);
    summaryDiv.appendChild(headerDiv);
    summaryDiv.appendChild(contentDiv);
    agentMessagesContainer.appendChild(summaryDiv);
    agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
} 