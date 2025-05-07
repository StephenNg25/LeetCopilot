import { groqClient } from '@/utils/client';

// Fetch conversation based on the generated hint
const fetchConversation = async (
  conversationHistory: { role: string; text: string }[],
  userInput: string
): Promise<string> => {
  const systemInstruction = `You are an AI assistant designed to provide guidance solely based on the first message in the conversation history, which serves as the current hint. Do not provide information beyond this hint. If a user query falls outside this scope, respond with 'I’m sorry, I can only assist based on the current hint.' Avoid discussing anything other than the context of current hints. Maintain contextual memory of the conversation history to provide relevant responses.`;

    const response = await groqClient.post('/chat/completions', {
    temperature: 0.5,
    model: 'llama-3.3-70b-versatile',
    messages: [
        { role: 'system', content: systemInstruction },
        ...conversationHistory.map(msg => ({role: msg.role, content: msg.text})),
        { role: 'user', content: `### Instructions:\n${systemInstruction}\n### User Query:\n${userInput}`}
    ]
    });
    return response.data.choices[0].message.content;
};

export { fetchConversation };