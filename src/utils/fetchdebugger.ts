import { groqClient } from '@/utils/client';

const fetchDebugger = async (problemContent: string, submittedCode: string, errorDescription: string): Promise<string> => {
    console.log('problemContent:', problemContent);
    console.log('submittedCode:', submittedCode);
    console.log('errorDescription:', errorDescription);

    // Remove the API call and response logging
    //const response = await groqClient.post('/chat/completions', {
        //temperature: 0.5,
        //model: 'llama-3.3-70b-versatile',
        //messages: [
        //    { role: 'system', content: "A code snippet will be provided in the user prompt. This code has an error and you will have to debug it. You response must follow this format exactly:\n\n#Original Snippet\n```\nEntire code snippet from user prompt goes here. This must remain completely original, unaltered and unclipped.\n```\n#Modified Snippet\n```\nYour entire fixed code goes here. This must remain completely full and unclipped\n```\n#Diagnostic Explanation: explain your fix here\n\nFor code difference generating purpose, you are NOT ALLOWED to clean your fixed code in Modified Snippet like removing or adjusting comments. Except for the modified and added lines of code, the rest have to stay originally as how original snippet is. Do not include any additional suggestions, unrelated explanations, or hypothetical scenarios. Do not suggest further corrections or improvements beyond the provided modification. \n"},
        //    { role: 'user', content: `Problem Content:\n${problemContent}\nCode Snippet with Error:\n${submittedCode}\n\nError:\n${errorDescription}`}
        //]
    //});
    //return response.data.choices[0].message.content;
    return `
#Original Snippet
\`\`\`
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNod
        int carry = 0;
        while (l1 != null || l2 != null) {
            if (l1 != null) {
                sum += l1.val;
                l1 = l1.next;
            }
            if (l2 != null) {
                sum += l2.val;
                l2 = l2.next;
            }
            
            // Create new node and update carry
            current.next = new ListNode(sum % 10);
            current = current.next;
            carry = sum / 10;
            sum = carry;
        }
        
        // Handle remaining carry
        if (carry > 0) {
            current.next = new ListNode(carry);
        }
        
        return dummy.next;
    }
}
\`\`\`

#Modified Snippet
\`\`\`
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
            ListNode dummy = new ListNode(0);
        ListNode current = dummy;
            int carry = 0;
        int sum = 0;
        while (l1 != null || l2 != null) {
            if (l1 != null) {
                sum += l1.val;
                l1 = l1.next;
            }
                if (l2 != null) {
                sum += l2.val;
                l2 = l2.next;
            }
            
            // Create new node and update carry
                current.next = new ListNode(sum % 10);
            current = current.next;
            carry = sum / 10;
            sum = carry;
        }
        
        // Handle remaining carry
            if (carry > 0) {
            current.next = new ListNode(carry);
        }
        
        return dummy.next;
    }
}
\`\`\`

#Diagnostic Explanation: 
**The code had several issues:** 
1. The line \`ListNod\` was incomplete and caused a compilation error. 
2. The variables \`dummy\`, \`current\`, and \`sum\` were not declared before being used.
3. The variable \`sum\` was not initialized before being used in the while loop.
4. The \`dummy\` and \`current\` variables were used without being initialized as the head of the new linked list.

The corrected code initializes \`dummy\`, \`current\`, and \`sum\` before the while loop, and removes the incomplete \`ListNod\` line. This allows the code to compile and correctly add the two numbers represented as linked lists.`;
};

export { fetchDebugger };
