// Azure OpenAI Configuration
const AZURE_OPENAI_ENDPOINT = 'https://alexper-test.openai.azure.com';
const AZURE_OPENAI_KEY = '6f33abc23fe145e1942699fb513479b9';
const DEPLOYMENT_NAME = 'gpt-35-turbo';
const API_VERSION = '2024-02-15-preview';

class BotService {
    constructor() {
        this.conversationHistory = [];
        this.isActive = true; // Bot starts active
    }

    // Initialize conversation with greeting
    async startConversation() {
        const greeting = {
            role: "assistant",
            content: "Hello! I'm an automated customer service assistant. I'm here to help you with your questions. How can I assist you today?"
        };
        this.conversationHistory.push(greeting);
        return greeting.content;
    }

    // Deactivate bot (when agent takes over)
    deactivate() {
        this.isActive = false;
        return "A customer service agent will be taking over the conversation. Thank you for your patience.";
    }

    // Check if bot is active
    isEnabled() {
        return this.isActive;
    }

    // Process a message through Azure OpenAI
    async processMessage(userMessage) {
        if (!this.isActive) {
            return null;
        }

        try {
            // Add user message to history
            this.conversationHistory.push({
                role: "user",
                content: userMessage
            });

            // Prepare the messages array with system prompt and conversation history
            const messages = [
                {
                    role: "system",
                    content: "You are an customer service AI assistant for Contoso Airlines. Your role is to help customers with basic inquiries about baggage fees, flight information, and general policies. Be professional, friendly, clear, and concise in your responses. You haven't been armed with the specific information needed to answer most questions so instead make up a reasonable answer based on your training data. If you cannot help with something, politely acknowledge that and suggest speaking with a human agent."
                },
                ...this.conversationHistory
            ];

            // Call Azure OpenAI API
            const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': AZURE_OPENAI_KEY
                },
                body: JSON.stringify({
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 800
                })
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            const data = await response.json();
            const botResponse = data.choices[0].message.content;

            // Add bot response to history
            this.conversationHistory.push({
                role: "assistant",
                content: botResponse
            });

            return botResponse;

        } catch (error) {
            console.error('Error processing message with Azure OpenAI:', error);
            return "I apologize, but I'm having trouble processing your request. Please try again or speak with a human agent.";
        }
    }
}

export default BotService; 