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

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/).
- [Node.js](https://nodejs.org/) (LTS version recommended)
- An active Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- User Access Tokens for Azure Communication Services. See more info [here](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/identity/access-tokens).
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
   ACS_ENDPOINT_URL=your_acs_endpoint_url
   ACS_USER_ACCESS_TOKEN=your_acs_user_access_token

   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
   AZURE_OPENAI_KEY=your_azure_openai_key
   AZURE_OPENAI_DEPLOYMENT_NAME=your_azure_openai_deployment_name
   AZURE_OPENAI_API_VERSION=your_api_version
   ```

3. **Required Values**:
   - The `ACS_USER_ACCESS_TOKEN` must be a complete, valid JWT token that typically starts with "eyJ" and contains multiple sections separated by periods.
   - Do not add quotes around any of the values in your `.env` file.
   - If you see a "JSON syntax error" or "Unterminated string" error when running the app, this typically means your access token is incomplete or malformed.

4. **Important Security Notes**:
   - Never commit your `.env` file to version control
   - The `.env` file is included in `.gitignore` to prevent accidental commits
   - For production deployments, use a secure way to manage secrets such as Azure Key Vault

5. **Obtaining Credentials**:
   - **Azure Communication Services**: 
     - Get your endpoint URL from your ACS resource in the Azure portal
     - Generate user access tokens using the Azure Communication Services Identity SDK or through the Azure portal
     - Tokens must be complete and valid (must include all parts of the JWT)
   - **Azure OpenAI**: 
     - Get your endpoint URL and API key from your Azure OpenAI resource in the Azure portal

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

## Troubleshooting

If you encounter a **"JSON syntax error"** when running the application, check your `.env` file:

1. Make sure your `ACS_USER_ACCESS_TOKEN` is a complete, valid JWT token.
2. Ensure you haven't added quotes around any of the values.
3. Check if all required environment variables are set.

If you see **"Error: Chat Initialization failed"** in the app and a **401 (Unauthorized)** error in the browser console, your `ACS_USER_ACCESS_TOKEN` may have expired.  
Tokens generated in the Azure portal are typically valid for **24 hours**. To resolve this:

1. Generate a new access token from your Azure Communication Services resource.
2. Update the `ACS_USER_ACCESS_TOKEN` value in your `.env` file.
3. Restart the application:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.




