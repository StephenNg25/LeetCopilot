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
           //  { role: 'system', content: "A code snippet will be provided in the user prompt. This code has an error and you will have to debug it. You response must follow this format exactly:\n\n#Original Snippet\n```\nEntire code snippet from user prompt goes here. This must remain completely original, unaltered and unclipped.\n```\n#Modified Snippet\n```\nYour entire fixed code goes here. This must remain completely full and unclipped\n```\n#Diagnostic Explanation: explain your fix here\n\nFor code difference generating purpose, you are NOT ALLOWED to clean your fixed code in Modified Snippet like removing or adjusting comments. Except for the modified and added lines of code, the rest have to stay originally as how original snippet is. Do not include any additional suggestions, unrelated explanations, or hypothetical scenarios. Do not suggest further corrections or improvements beyond the provided modification. \n",
            // { role: 'user', content: "Problem Content:\n${problemContent}\nCode Snippet with Error:\n${submittedCode}\n\nError:\n${errorDescription}"
            
         //]
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
        int sum = 0;
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
#Diagnostic Explanation: In the original code, there were several errors:

1. The class Solution was missing its method definition.
2. There was no method signature public ListNode addTwoNumbers(ListNode l1, ListNode l2) for the method.
3. sum, carry, and dummy variables were used without declaration.
4. The while loop conditions were incorrect.
5. The sum was not being reset for each iteration of the loop.`
};

export { fetchDebugger };
