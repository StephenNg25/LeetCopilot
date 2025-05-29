import { groqClient } from '@/utils/client';
import { getSystemPromptByHintLevel } from '@/utils/systemprompts';

// Fetch conversation based on the generated hint
const fetchConversation = async (
  conversationHistory: { role: string; text: string }[],
  userInput: string,
  hintLevel: number,
  problemContent: string
): Promise<string> => {
    const systemPrompt = getSystemPromptByHintLevel(hintLevel, problemContent);
  // Construct the messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role, // Replace 'bot' with 'assistant'
      content: msg.text
    })),
    { role: 'user', content: userInput }
  ];

  // Log the entire request payload 
  console.log('[fetchConversation] Sending request with payload:', JSON.stringify(messages, null, 2));
  

  try {
    const response = await groqClient.post('/chat/completions', {
      temperature: 0.5,
      model: 'llama3-70b-8192',
      messages
    });

    // Log the successful response for verification
    console.log('[fetchConversation] Received response:', response.data);

    return response.data.choices[0].message.content;
  } catch (error) {
    // Enhanced error logging to capture full details
    console.error('[fetchConversation] API call failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    throw error; // Re-throw to allow caller to handle
  }
};

export { fetchConversation };