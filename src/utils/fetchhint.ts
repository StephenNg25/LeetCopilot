import { groqClient } from '@/utils/client';
import { generateHintPrompt } from '@/utils/prompts';

// AI hint prompt handling 

// Generating Hint Prompt using Groq
const fetchHintFromGroq = async (
  hintLevel: number,
  problemContent: string,
  codeTemplate: string | null = null,
  language: string | null = null
): Promise<string> => {
  const prompt = generateHintPrompt(hintLevel, problemContent, codeTemplate, language);

  const response = await groqClient.post('/chat/completions', {
    temperature: 0.5,
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: `You are an AI Coding Assistant providing structured programming hints.` },
      { role: 'user', content: prompt }
    ]
  });
  console.log('Prompt:', prompt);
  return response.data.choices[0].message.content;
};

export { fetchHintFromGroq };