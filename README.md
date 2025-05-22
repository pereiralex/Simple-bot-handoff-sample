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
5. **Token Server**: A minimal Express backend that issues ACS user tokens dynamically

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/).
- [Node.js](https://nodejs.org/) (LTS version recommended)
- An active Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- Azure OpenAI Resource and Deployed Model. See [instructions](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal).


## Configuration

**❗ IMPORTANT: You must set up your environment variables correctly before the app will run.**

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. Fill in your actual values in the `.env` file:
   ```
   # Azure Communication Services Configuration
   ACS_CONNECTION_STRING=your_acs_connection_string
   ACS_ENDPOINT_URL=your_acs_endpoint_url

   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
   AZURE_OPENAI_KEY=your_azure_openai_key
   AZURE_OPENAI_DEPLOYMENT_NAME=your_azure_openai_deployment_name
   AZURE_OPENAI_API_VERSION=your_api_version
   ```

3. **Obtaining Credentials**:
   - **Azure Communication Services**: 
     - Get your connection string and endpoint URL from your ACS resource in the Azure portal
     - The app will dynamically generate user access tokens using the backend token server
   - **Azure OpenAI**: 
     - Create and deploy an Azure OpenAI in Azure AI Foundry Models resource [Tutorial](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal)
     - AZURE_OPENAI_ENDPOINT: This value can be found in the Keys and Endpoint section when examining your resource from the Azure portal.
     - AZURE_OPENAI_DEPLOYMENT_NAME: This value will correspond to the custom name you chose for your deployment when you deployed a model. This value can be found under Resource Management > Model Deployments in the Azure portal.
     - AZURE_OPENAI_API_VERSION: Learn more about [API Versions](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation).

4. **Important Security Notes**:
   - Never commit your `.env` file to version control
   - The `.env` file is included in `.gitignore` to prevent accidental commits
   - For production deployments, use a secure way to manage secrets such as Azure Key Vault


The application will use these environment variables to connect to Azure services. The config.js module loads these values and provides them to the application.

## Pricing

This demo uses real Azure services, so minimal usage-based costs may apply. We've designed it to be lightweight, but extended use will incur charges. The following services may involve charges:

1. **Azure Communication Services**
   - Billed by usage: number of messages sent/received. See the [Azure Communication Services Pricing](https://azure.microsoft.com/pricing/details/communication-services/) page for details.

2. **Azure OpenAI**
   - Costs depend on the model used (e.g., GPT-4) and token volume. See the [Azure OpenAI Pricing](https://azure.microsoft.com/pricing/details/openai/) page for details.

**Note**: Be sure to monitor your Azure usage to avoid unexpected charges. You can set up [Azure Cost Management](https://learn.microsoft.com/en-us/azure/cost-management-billing/) to track and control your spending.

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

4. **Start the backend ACS token server:**
   ```
   node server.js
   ```
   This will start the Express server on port 3001 (or the port you specify in your `.env`).

5. **Start the frontend development server:**
   ```
   npm start
   ```
   This will start the Parcel dev server (typically on http://localhost:1234).

6. Open your browser and navigate to the URL displayed in your terminal (typically http://localhost:1234)

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

## Troubleshooting

If you encounter a **"JSON syntax error"** when running the application, check your `.env` file:

1. Make sure your `ACS_CONNECTION_STRING` and `ACS_ENDPOINT_URL` are correct.
2. Ensure you haven't added quotes around any of the values.
3. Check if all required environment variables are set.

If you see **"Error: Chat Initialization failed"** in the app and a **401 (Unauthorized)** error in the browser console, your ACS credentials may be incorrect or expired. Double-check your `.env` values and restart both the backend and frontend servers.

## License

This project is licensed under the MIT License - see the LICENSE file for details.




