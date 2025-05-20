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
           //  { role: 'system', content: '\nYou are an AI debugger that reads in a Leetcode problem, submitted code with issues and error description. Your job is to suggest a difference for the change based on given information as minimally as possible. You must provide exactly 2 snippets in the output: 1 is #Original Snippet - The part of the submitted code that needs modification. This must remain completely original, unaltered and unclipped. 2 is the #Modified Snippet - The corrected version of the original snippet. Additionally, provide a brief #Diagnostic Explanation for the change made between the original snippet and the modified snippet. Do not include any additional suggestions, unrelated explanations, or hypothetical scenarios. Do not suggest further corrections or improvements beyond the provided modification. Do not include any full code blocks or unrelated commentary. Keep the explanation concise and strictly relevant to the change.' },
            // { role: 'user', content: `**Problem:\n${problemContent}\n**Code:\n${submittedCode}\n**Error Description:\n${errorDescription}` }
         //]
     //return response.data.choices[0].message.content; 
     return `
#Original Snippet
\`\`\`python 
class Solution(object):
    def findMedianSortedArrays(self, nums1, nums2):
        """
        :type nums1: List[int]
        :type nums2: List[int]
        :rtype: float
        """
        # If the length of nums1 is greater than the length of nums2, swap them
        if len(nums1) > len(nums2):  # O(1) time complexity
            nums1, nums2 = nums2, nums1  # O(1) time complexity
        
        # Calculate the total length of the two arrays
        total_length = len(nums1) + len(nums2)  # O(1) time complexity
        
        # Initialize the low and high pointers for binary search
        low = 0  # O(1) time complexity
        high = len(nums1)  # O(1) time complexity
        
        # Perform binary search
        while low <= high:  # O(log(min(m, n))) time complexity
        # Calculate the partition point for nums1
        partition_nums1 = (low + high) // 2  # O(1) time complexity
        
        # Calculate the partition point for nums2
        partition_nums2 = (total_length + 1) // 2 - partition_nums1  # O(1) time complexity

        # Calculate the values at the partition points
        max_left_nums1 = float('-inf') if partition_nums1 == 0 else nums1[partition_nums1 - 1]  # O(1) time complexity
        min_right_nums1 = float('inf') if partition_nums1 == len(nums1) else nums1[partition_nums1]  # O(1) time complexity
        
        max_left_nums2 = float('-inf') if partition_nums2 == 0 else nums2[partition_nums2 - 1]  # O(1) time complexity
        min_right_nums2 = float('inf') if partition_nums2 == len(nums2) else nums2[partition_nums2]  # O(1) time complexity
        
        # Check if the partition is correct
        if max_left_nums1 <= min_right_nums2 and max_left_nums2 <= min_right_nums1:  # O(1) time complexity
            # If the total length is even, the median is the average of the two middle numbers
            if total_length % 2 == 0:  # O(1) time complexity
                # Calculate the median
                median = (max(max_left_nums1, max_left_nums2) + min(min_right_nums1, min_right_nums2)) / 2.0  # O(1) time complexity
                return median
            else:  # O(1) time complexity
                median = float(max(max_left_nums1, max_left_nums2))  # O(1) time complexity
                return median
        elif max_left_nums1 > min_right_nums2:  # O(1) time complexity
            high = partition_nums1 - 1  # O(1) time complexity
        else:  # O(1) time complexity
            low = partition_nums1 + 1  # O(1) time complexity
\`\`\`
#Modified Snippet 
\`\`\`python
class Solution(object):
    def findMedianSortedArrays(self, nums1, nums2):
        """
        :type nums1: List[int]
        :type nums2: List[int]
        :rtype: float
        """
        # If the length of nums1 is greater than the length of nums2, swap them
        if len(nums1) > len(nums2):  # O(1) time complexity
            nums1, nums2 = nums2, nums1  # O(1) time complexity

        # Calculate the total length of the two arrays
        total_length = len(nums1) + len(nums2)  # O(1) time complexity
        
        # Initialize the low and high pointers for binary search
        low = 0  # O(1) time complexity
        high = len(nums1)  # O(1) time complexity
        
        # Perform binary search
        while low <= high:  # O(log(min(m, n))) time complexity
            # Calculate the partition point for nums1
            partition_nums1 = (low + high) // 2  # O(1) time complexity
            
            # Calculate the partition point for nums2
            partition_nums2 = (total_length + 1) // 2 - partition_nums1  # O(1) time complexity
            
            # Calculate the values at the partition points
            max_left_nums1 = float('-inf') if partition_nums1 == 0 else nums1[partition_nums1 - 1]  # O(1) time complexity
            min_right_nums1 = float('inf') if partition_nums1 == len(nums1) else nums1[partition_nums1]  # O(1) time complexity
            
            max_left_nums2 = float('-inf') if partition_nums2 == 0 else nums2[partition_nums2 - 1]  # O(1) time complexity
            min_right_nums2 = float('inf') if partition_nums2 == len(nums2) else nums2[partition_nums2]  # O(1) time complexity
            
            # Check if the partition is correct
            if max_left_nums1 <= min_right_nums2 and max_left_nums2 <= min_right_nums1:  # O(1) time complexity
                # If the total length is even, the median is the average of the two middle numbers
                if total_length % 2 == 0:  # O(1) time complexity
                    # Calculate the median
                    median = (max(max_left_nums1, max_left_nums2) + min(min_right_nums1, min_right_nums2)) / 2.0
                    return median  # Add a return statement here
                # If the total length is odd, the median is the middle number
                else:  # O(1) time complexity
                    median = max(max_left_nums1, max_left_nums2)  # O(1) time complexity
                    return median  # Add a return statement here
            elif max_left_nums1 > min_right_nums2:  # O(1) time complexity
                high = partition_nums1 - 1  # O(1) time complexity
            else:  # O(1) time complexity
                low = partition_nums1 + 1  # O(1) time complexity
\`\`\`
#Diagnostic Explanation:blaaa…...blaaa`
};

export { fetchDebugger };
