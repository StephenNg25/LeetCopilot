export const generateHintPrompt = (hintLevel: number, problemContent: string) => {
    switch (hintLevel) {
      case 10:
        return `Here is a LeetCode problem description:\n${problemContent}\nI want a hint that gives a small nudge towards the solution without revealing it and going into code. Keep it to one or two sentences. This should be a hint for the easiest way (least optimal) of approaching. You can give recommendations for an ideal data structure or algorithm.`;
      case 20:
        return `Here is a LeetCode problem description:\n${problemContent}\nI want a high-level approach hint towards the solution without revealing it and going into code. Keep it to one or two sentences. This should be a hint for the most optimal approach. You can give recommendations for an ideal data structure or algorithm.`;
      case 30:
        return `Here is a LeetCode problem description:\n${problemContent}\nGive a technical implementation detail hint for a brute-force or easiest way of approaching without revealing the entire code. Mention the time complexity and explain how the recommended data structure of this brute-force approach works. DO NOT recommend any other optimized solution. Give example to demonstrate and give better visualization.`;
      case 40:
        return `Here is a LeetCode problem description:\n${problemContent}\nGive a technical implementation detail hint for the most optimal way of approaching without revealing the entire code. Mention the time complexity and explain how the recommended data structure of this most optimized approach works. Give example to demonstrate and give better visualization.`;
      case 100:
        return `Here is a LeetCode problem description:\n${problemContent}\nWrite the brute-force and complete most optimal solution with line-by-line comments by side and logic.`;
      default:
        return 'Invalid hint level.';
    }
  };
  