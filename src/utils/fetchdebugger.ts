import { groqClient } from '@/utils/client';

const fetchDebugger = async (problemContent: string, submittedCode: string, errorDescription: string): Promise<string> => {
    console.log('problemContent:', problemContent);
    console.log('submittedCode:', submittedCode);
    console.log('errorDescription:', errorDescription);

    // Remove the API call and response logging
    // const response = await groqClient.post('/chat/completions', {
    //     temperature: 0.5,
    //     model: 'llama-3.3-70b-versatile',
    //     messages: [
    //         { role: 'system', content: '\nYou are an AI debugger that reads in a Leetcode problem, submitted code with issues and error description. Your job is to suggest a difference for the change based on given information as minimal as possible. You must provide exactly 2 snippets in output, one is the original snippet that needs modification from submitted code and another one is its modified version. Provide a brief diagnostic explanation for the change. Make sure the code works if the original code is replaced by modified snippet. Returned original snippet should never be clipped and has to stay completely original. Never return a full code block of the new code version.' },
    //         { role: 'user', content: `**Problem:\n${problemContent}\n**Code:\n${submittedCode}\n**Error Description:\n${errorDescription}` }
    //     ]
    // });

    // console.log(response.data.choices[0].message.content); // Remove this line

    // Return an empty string for now
    return '';
};

export { fetchDebugger };
