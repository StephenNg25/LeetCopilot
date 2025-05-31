import { groqClient } from '@/utils/client';

const fetchDebugger = async (problemContent: string, submittedCode: string, errorDescription: string): Promise<string> => {
    console.log('problemContent:', problemContent);
    console.log('submittedCode:', submittedCode);
    console.log('errorDescription:', errorDescription);

    // Remove the API call and response logging
    const response = await groqClient.post('/chat/completions', {
        temperature: 0.5,
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: "A code snippet will be provided in the user prompt. This code has an error and you will have to debug it. You response must follow this format exactly:\n\n#Original Snippet\n```\nEntire code snippet from user prompt goes here. This must remain completely original, unaltered and unclipped.\n```\n#Modified Snippet\n```\nYour entire fixed code goes here. This must remain completely full and unclipped\n```\n#Diagnostic Explanation: explain your fix here\n\nFor code difference generating purpose, you are NOT ALLOWED to clean your fixed code in Modified Snippet like removing or adjusting comments. Except for the modified and added lines of code, the rest have to stay originally as how original snippet is. Do not include any additional suggestions, unrelated explanations, or hypothetical scenarios. Do not suggest further corrections or improvements beyond the provided modification. \n"},
            { role: 'user', content: `Problem Content:\n${problemContent}\nCode Snippet with Error:\n${submittedCode}\n\nError:\n${errorDescription}`}
        ]
    });
    return response.data.choices[0].message.content;
};

export { fetchDebugger };
