export const generateHintPrompt = (hintLevel: number, problemContent: string, codeTemplate: string | null = null) => {
    switch (hintLevel) {
      case 10:
        return `Here is a LeetCode problem description:\n${problemContent}\nI want a brute-force/least-efficient hint that gives a small nudge towards the solution without revealing it and going into code. Keep it to two to three sentences. This should be a hint for the most straightforward and easiest way of approaching. Mention the data structures or algorithms used for this approach. Add another sentence explicitly explain the intuition why that data structure or algorithm is recommended for this problem.`;
      case 20:
        return `Here is a LeetCode problem description:\n${problemContent}\nI want a high-level/most-efficient approach hint towards the solution without revealing it and going into code. Keep it two to three sentences. This should be a hint for the most optimal approach. Mention that ideal data structure or algorithm used for this approach. Add another sentence explicitly explain the intuition why that data structure or algorithm is recommended for this problem.`;
      case 30:
        return `Here is a LeetCode problem description:\n${problemContent}\nGive a technical implementation detail hint for a brute-force or easiest way of approaching without revealing the entire code. Mention the time complexity and explain how the recommended data structure of this brute-force approach works. DO NOT recommend any other optimized solution. Give example walkthroughs to demonstrate and give better visualization.`;
      case 40:
        return `Here is a LeetCode problem description:\n${problemContent}\nGive a technical implementation detail hint for the most optimal way of approaching without revealing the entire code. Mention the time complexity and explain how the recommended data structure of this most optimized approach works. Give example walkthroughs to demonstrate and give better visualization.`;
      case 100:
        if (codeTemplate){
          return `Here is a LeetCode problem description:\n${problemContent}\n.Write the brute-force and most optimal solutions. Use separate code blocks for each solutions. Include line-by-line comments on the same line with the code. Both solutions need to start with the following code template:\n${codeTemplate}\n.Explain the logic behind the code for both approaches by giving walkthrough examples. Also, mention the time complexity and space complexity of both approaches.`;
        }return `Here is a LeetCode problem description:\n${problemContent}\n.Write the brute-force and most optimal solutions. Use separate code blocks for each solutions. Include line-by-line comments on the same line with the code. Explain the logic behind the code for both approaches by giving walkthrough examples. Also, mention the time complexity and space complexity of both approaches.`;
      default:
        return 'Invalid hint level.';
    }
  };
  

 