import axios from 'axios';

export const groqClient = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
});