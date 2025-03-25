// <Create a chat client>
import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

let endpointUrl = 'https://alexper-test1.unitedstates.communication.azure.com/';
let userAccessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkY1M0ZEODA0RThBNDhBQzg4Qjg3NTA3M0M4MzRCRDdGNzBCMzBENDUiLCJ4NXQiOiI5VF9ZQk9pa2lzaUxoMUJ6eURTOWYzQ3pEVVUiLCJ0eXAiOiJKV1QifQ.eyJza3lwZWlkIjoiYWNzOmMyZjJiZjU0LTFiMzctNDY3Zi1hZGUzLTE1YzY0MjhkMDMxMF8wMDAwMDAyNi02ZGU3LTUzNjgtZTEzOC04ZTNhMGQwMGM4OTEiLCJzY3AiOjE3OTIsImNzaSI6IjE3NDI5MTgyMzMiLCJleHAiOjE3NDMwMDQ2MzMsInJnbiI6ImFtZXIiLCJhY3NTY29wZSI6ImNoYXQiLCJyZXNvdXJjZUlkIjoiYzJmMmJmNTQtMWIzNy00NjdmLWFkZTMtMTVjNjQyOGQwMzEwIiwicmVzb3VyY2VMb2NhdGlvbiI6InVuaXRlZHN0YXRlcyIsImlhdCI6MTc0MjkxODIzM30.gZtIf6QFf-7oEX_2BGvVOCvn9ciWg0UY_jgVYav7MS_OAM0gNEap9sc_cW1O2XNQPqFckSPSeUhpbnWDQ5noyMB3Du7sdcS9tsqB7i8_doBgfsmBv09Ps_WWbZ_P_fOxZ0NECgeXeWJTtzyjWlBXOndWa31Foi84X9xtpjzH61U6NVNyduWeDwrAEwz-7uSWTNY68kQikJB1AcjN9eF-j1xW5cngCDkqR7Hi78HyelJa9-IPx33OTSiS5cVpM4PNqDxVnpN2LY8jcRf12lk0XL3oFisjk7pOppRC0Stxa7TYN2DMOYWxVj7fl4vPFb7Xjz4zsb0-CCMl3TX_37H4OQ';

let chatClient = new ChatClient(endpointUrl, new AzureCommunicationTokenCredential(userAccessToken));
console.log('Azure Communication Chat client created!');

// <Start a chat thread>
async function createChatThread() {
    const createChatThreadRequest = {
        topic: "Calling Application"
    };
    const createChatThreadOptions = {
        participants: [
            {
                id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de7-5368-e138-8e3a0d00c891' },
                displayName: 'Mona Kane'
            },
            {
                id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de8-ad3e-7137-8e3a0d00d703' },
                displayName: 'John Smith'
            }
        ]
    };
    const createChatThreadResult = await chatClient.createChatThread(
        createChatThreadRequest,
        createChatThreadOptions
    );
    const threadId = createChatThreadResult.chatThread.id;
    return threadId;
}

createChatThread().then(async threadId => {
    console.log(`Thread created:${threadId}`);

    // <Get a chat thread client>
    let chatThreadClient = chatClient.getChatThreadClient(threadId);
    console.log(`Chat Thread client for threadId:${threadId}`);

    // <List all chat threads>
    const threads = chatClient.listChatThreads();
    for await (const thread of threads) {
        console.log(`Chat Thread item:${thread.id}`);
    }

    // <Receive chat messages from a chat thread>
    chatClient.startRealtimeNotifications();
    chatClient.on("chatMessageReceived", async (e) => {
        console.log("Notification chatMessageReceived!");
    });

    // <Send a message to a chat thread>
    const sendMessageRequest =
    {
        content: 'Hello Geeta! Can you share the deck for the conference?'
    };
    let sendMessageOptions =
    {
        senderDisplayName: 'Jack',
        type: 'text'
    };

    const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
    const messageId = sendChatMessageResult.id;

    // <LIST MESSAGES IN A CHAT THREAD>
    const messages = chatThreadClient.listMessages();
    for await (const message of messages) {
        console.log(`Chat Thread message id:${message.id}`);
    }

    // <Add a user as a participant to the chat thread>
    const addParticipantsRequest =
    {
        participants: [
            {
                id: { communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de7-5368-e138-8e3a0d00c891' },
                displayName: 'Jane'
            }
        ]
    };
    await chatThreadClient.addParticipants(addParticipantsRequest);

    // <List users in a chat thread>
    const participants = chatThreadClient.listParticipants();
    for await (const participant of participants) {
        console.log(`participants in thread:${participant.id.communicationUserId}`);
    }

    // <Remove user from a chat thread>
    await chatThreadClient.removeParticipant({ communicationUserId: '8:acs:c2f2bf54-1b37-467f-ade3-15c6428d0310_00000026-6de7-5368-e138-8e3a0d00c891' });
    const users = chatThreadClient.listParticipants();
    for await (const user of users) {
        console.log(`participants in thread available:${user.id.communicationUserId}`);
    }
});

