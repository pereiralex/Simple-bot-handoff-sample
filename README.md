---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

![image](https://github.com/user-attachments/assets/3c3bfbd3-7465-48db-98fb-f222a1ad43b4)


# Customer Service Chat with AI Assistant Handoff

This application demonstrates a complete customer service chat experience with an AI-powered assistant that can automatically handle customer inquiries and seamlessly hand off to a human agent when needed.

## Features

- **Dual Interface**: Customer-facing chat widget and agent portal in a single demo
- **AI Assistant**: Automatic handling of customer inquiries using Azure OpenAI
- **Handoff Capability**: Smooth transition from AI to human agent when needed
- **Real-time Chat**: Powered by Azure Communication Services
- **System Messages**: Clear indicators when the AI or agent joins the conversation
- **Conversation Summary**: Agents can generate AI-powered summaries of the conversation
- **Visual Status Indicators**: Online status and AI handling notifications

## Architecture

The application consists of:

1. **Customer Interface**: A clean, modern chat widget for customers to communicate with support
2. **Agent Portal**: A comprehensive interface for agents to monitor conversations and take over when needed
3. **Bot Service**: An AI-powered service using Azure OpenAI to provide automated responses
4. **Summary Service**: AI service that can generate conversation summaries for agents

## Prerequisites

- An Azure account with an active subscription
- [Node.js](https://nodejs.org/) (LTS version recommended)
- An active Azure Communication Services resource
- Azure OpenAI service with a configured deployment
- User Access Tokens for Azure Communication Services

## Configuration

Before running the application, update the following configuration values:

1. In `bot-service.js`:
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI service endpoint
   - `AZURE_OPENAI_KEY`: Your Azure OpenAI API key
   - `DEPLOYMENT_NAME`: Your OpenAI model deployment name

2. In `client.js`:
   - `endpointUrl`: Your Azure Communication Services endpoint
   - `userAccessToken`: Your Azure Communication Services access token

## Setup and Run

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Simple-bot-handoff-sample
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to the URL displayed in your terminal (typically http://localhost:1234)

## Usage

### Customer View
- Type messages in the bottom input field and press Send
- Initially, the AI Assistant will respond to inquiries
- System messages will indicate when an agent takes over

### Agent View
- Monitor incoming customer conversations in the Messages panel
- Click "Take Over" in the banner when you want to handle the conversation personally
- Use the "Summarize" button to generate an AI-powered summary of the conversation
- After taking over, type in the input box to respond directly to the customer

## License

This project is licensed under the MIT License - see the LICENSE file for details.




