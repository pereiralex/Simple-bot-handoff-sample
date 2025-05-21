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

**❗ IMPORTANT: You must set up your environment variables correctly before the app will run.**

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. Fill in your actual values in the `.env` file:
   ```
   # Azure Communication Services Configuration
   ACS_ENDPOINT_URL=your_acs_endpoint_url
   ACS_USER_ACCESS_TOKEN=your_acs_user_access_token

   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
   AZURE_OPENAI_KEY=your_azure_openai_key
   AZURE_OPENAI_DEPLOYMENT_NAME=your_azure_openai_deployment_name
   AZURE_OPENAI_API_VERSION=your_api_version
   ```

4. **Obtaining Credentials**:
   - **Azure Communication Services**: 
     - Get your endpoint URL from your ACS resource in the Azure portal
     - Generate user access tokens using the Azure Communication Services Identity SDK or through the Azure portal
   - **Azure OpenAI**: 
     - Create and deploy an Azure OpenAI in Azure AI Foundry Models resource [Tutorial](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal)
     - AZURE_OPENAI_ENDPOINT: This value can be found in the Keys and Endpoint section when examining your resource from the Azure portal.
     - AZURE_OPENAI_DEPLOYMENT_NAME: This value will correspond to the custom name you chose for your deployment when you deployed a model. This value can be found under Resource Management > Model Deployments in the Azure portal.
     OPENAI_API_VERSION: Learn more about [API Versions](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation).

5. **Important Security Notes**:
   - Never commit your `.env` file to version control
   - The `.env` file is included in `.gitignore` to prevent accidental commits
   - For production deployments, use a secure way to manage secrets such as Azure Key Vault


The application will use these environment variables to connect to Azure services. The config.js module loads these values and provides them to the application.



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

3. Set up your `.env` file as described in the Configuration section above

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to the URL displayed in your terminal (typically http://localhost:1234)

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




