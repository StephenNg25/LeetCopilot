import { groqClient } from '@/utils/client';
import { generateHintPrompt } from '@/utils/prompts';

//AI hint prompt handling 

// Generating Hint Prompt using Groq
const fetchHintFromGroq = async (hintLevel: number, problemContent: string): Promise<string> => {
    const prompt = generateHintPrompt(hintLevel, problemContent);

    const response = await groqClient.post('/chat/completions', {
    temperature: 0.5,
    model: 'llama-3.3-70b-versatile',
    messages: [
        { role: 'system', content: 'You are an AI tutor providing structured programming hints.' },
        { role: 'user', content: prompt }
    ]
    });

    return response.data.choices[0].message.content;
};

export { fetchHintFromGroq };