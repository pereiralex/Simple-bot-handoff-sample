// Azure OpenAI Configuration
import 'dotenv/config';

// Load values from environment variables with no default fallbacks for security
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo';
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

// Check if required environment variables are set
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
  console.error('❌ ERROR: Required Azure OpenAI environment variables are missing!');
  console.error('Please ensure AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY are set in your .env file');
}

class BotService {
    constructor() {
        this.conversationHistory = [];
        this.isActive = true; // Bot starts active
    }

    // Initialize conversation with greeting
    async startConversation() {
        const greeting = {
            role: "assistant",
            content: "👋 Hello! I'm the Contoso Airlines automated customer service assistant. How can I assist you today?"
        };
        this.conversationHistory.push(greeting);
        return greeting.content;
    }

    // Deactivate bot (when agent takes over)
    deactivate() {
        this.isActive = false;
        return "A human agent will be taking over the conversation. Thank you for your patience.";
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
                    role: "assistant",
                    content: "You are a virtual customer service agent for Contoso Airlines. Your job is to assist customers with their questions in a clear, concise, and professional manner. Your responses should be specific, helpful, and relevant, avoiding vague or overly general answers.\n\n### Guidelines for Responses:\n- Provide specific answers whenever possible. Avoid simply directing customers to a website unless absolutely necessary.\n- Use real policies and example fees when applicable, but note that prices may vary.\n- Stay on topic. Answer only the question asked and avoid unnecessary details.\n- Maintain a professional and friendly tone. Keep responses polite and easy to understand.\n\n### Example Responses:\n\n- **Customer:** \"How much does it cost to bring my golf clubs?\"\n  - **Correct:** \"Golf clubs can be checked as baggage. Depending on your fare type, they may be included for free or subject to an oversize fee of $50–$100.\"\n  - **Incorrect:** \"Fees depend on your fare type. Check the website for more details.\"\n\n- **Customer:** \"Can I change my flight date?\"\n  - **Correct:** \"Yes, you can change your flight date, but a change fee of $75–$200 may apply based on your ticket type.\"\n  - **Incorrect:** \"Flight changes depend on fare type. Visit our website for details.\"\n\n- **Customer:** \"When does online check-in open?\"\n  - **Correct:** \"Online check-in opens 24 hours before departure and closes 60 minutes before domestic flights and 90 minutes before international flights.\"\n  - **Incorrect:** \"Check-in times vary. Check our website for more information.\"\n\n### Additional Common Questions and Ideal Answers:\n- **Customer:** \"Can I bring a carry-on bag for free?\"\n  - \"Yes, most tickets allow one free carry-on bag (22 x 14 x 9 inches) and one personal item. Basic Economy fares may have restrictions.\"\n- **Customer:** \"What's the weight limit for checked baggage?\"\n  - \"Checked bags must not exceed 50 lbs (23 kg). Overweight fees apply for bags up to 70 lbs (32 kg).\"\n- **Customer:** \"What happens if my baggage is lost?\"\n  - \"Report your lost baggage at the airport or online. We will track your bag and update you within 24 hours. Compensation may be available if not found within 5 days.\"\n- **Customer:** \"Can I bring a pet on the plane?\"\n  - \"Yes, small pets can travel in the cabin for a $125 fee. Larger pets must travel as checked baggage. Restrictions apply.\"\n- **Customer:** \"How do I request wheelchair assistance?\"\n  - \"You can request wheelchair assistance during booking or by calling customer service 48 hours before departure.\"\n- **Customer:** \"How long do refunds take?\"\n  - \"Refunds are typically processed within 7–10 business days.\"\n\nYour primary goal is to provide quick, clear, and helpful answers while maintaining professionalism. If you cannot provide an exact answer, offer useful guidelines or direct the customer to the best next step."
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
            return "I apologize, but I'm having trouble processing your request.";
        }
    }
}

export class SummaryService {
    constructor() {
        this.lastSummaryTime = null;
    }

    async generateSummary(messages) {
        try {
            console.log('Starting summary generation with', messages.length, 'messages');
            
            const systemPrompt = {
                role: "system",
                content: "You are a professional conversation summarizer for a customer service chat system. Your job is to help somebody quickly understand the most salient details of the entire conversation up into this point so they can pick up where the bot agent left off. Focus more on the customer's issue at hand rather than the agent's responses so far. Keep the summary concise and to the point. The summary should be no more than 2-3 sentences. Ex: 'Customer is concerned about the cost of the flight and the agent is explaining the different fare types. The customer is trying to change the flight date but the agent is explaining that the flight is non-refundable.'"
            };

            // Direct extraction of messages for debugging
            console.log('RAW MESSAGE DUMP (first 3 messages):');
            for (let i = 0; i < Math.min(3, messages.length); i++) {
                console.log(`Message ${i+1} FULL:`, JSON.stringify(messages[i]));
            }

            // Filter out system messages and prepare conversation history
            const conversationMessages = [];
            
            console.log('Converting Azure Chat API messages to OpenAI format...');
            
            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i];
                
                // Advanced content extraction
                let messageContent = null;
                const senderName = msg.senderDisplayName || 'Unknown';
                
                // Try multiple ways to extract content
                if (msg.content && typeof msg.content === 'string') {
                    messageContent = msg.content;
                } else if (msg.content && typeof msg.content === 'object') {
                    messageContent = msg.content.message || msg.content.content || '';
                } else if (msg.message) {
                    messageContent = msg.message;
                } else {
                    // Look for content in other properties
                    const msgStr = JSON.stringify(msg);
                    const contentMatch = msgStr.match(/"content":"([^"]+)"/);
                    if (contentMatch && contentMatch[1]) {
                        messageContent = contentMatch[1];
                    }
                }
                
                // Make sure we have content
                if (!messageContent || messageContent.trim() === '') {
                    console.log(`Skipping message ${i+1} from ${senderName}: no content found`);
                    continue;
                }
                
                // Skip system messages
                if (senderName === 'System') {
                    console.log(`Skipping system message ${i+1}: ${messageContent.substring(0, 30)}...`);
                    continue;
                }
                
                // Determine role based on sender
                let role = 'assistant';
                if (senderName === 'Sarah Jones') {
                    role = 'user';
                } else if (senderName === 'AI Assistant') {
                    role = 'assistant';
                } else if (senderName === 'Support Agent') {
                    role = 'assistant';
                }
                
                const formattedMessage = {
                    role: role,
                    content: messageContent
                };
                
                conversationMessages.push(formattedMessage);
                console.log(`Added message ${i+1} from ${senderName} (${role}): ${messageContent.substring(0, 50)}...`);
            }
            
            if (conversationMessages.length === 0) {
                console.log('No valid messages to summarize');
                return "No messages to summarize yet.";
            }
            
            console.log(`Prepared ${conversationMessages.length} messages for summary`);
            
            // Create the "story" of the conversation in chronological order
            const sortedMessages = [...conversationMessages];
            console.log('Conversation flow:');
            sortedMessages.forEach((msg, i) => {
                console.log(`${i+1}. ${msg.role}: ${msg.content.substring(0, 30)}...`);
            });

            // Make API call with the full conversation
            const requestBody = {
                messages: [systemPrompt, ...sortedMessages],
                temperature: 0.5,
                max_tokens: 500
            };
            
            console.log('Request payload size:', JSON.stringify(requestBody).length, 'characters');

            const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': AZURE_OPENAI_KEY
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API response error:', response.status, errorText);
                throw new Error(`API call failed: ${response.statusText}. Details: ${errorText}`);
            }

            const data = await response.json();
            console.log('API response received successfully');
            
            this.lastSummaryTime = new Date();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Error generating summary:', error);
            throw error;
        }
    }

    shouldAllowNewSummary(messages, lastMessageTime) {
        // Always allow a summary
        return true;
    }
}

export default BotService; 