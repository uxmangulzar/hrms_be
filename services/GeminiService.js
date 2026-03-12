const axios = require('axios');
require('dotenv').config();

class GeminiService {

  static async evaluateAnswers({ questions, answers }) {

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error('Gemini Error: API Key missing or default placeholder used in .env');
      return { score: 0, feedback: [] };
    }

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are an HR technical assessment evaluator. You will be provided with Questions and Candidate's Answers.
    Your task is to:
    - Compare each answer with the intent of its question.
    - Assign an overall percentage score (0-100).
    - Provide brief feedback for each answer.

    Return the result STRICTLY as a JSON object with this exact structure:
    {
      "score": <overall_number>,
      "feedback": [
        { "question_id": <id>, "correct": <true/false>, "comment": "<brief_reasoning>" }
      ]
    }
    Respond ONLY with the JSON object.`;

    const userPrompt =
      `Questions: ${JSON.stringify(questions)}\n\nCandidate Answers: ${JSON.stringify(answers)}`;

    try {

      const response = await axios.post(endpoint, {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1
        }
      });

      let content =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (!content) {
        console.error('Gemini returned empty response');
        return { score: 0, feedback: [] };
      }

      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(content);

      return {
        score: parsed.score ?? 0,
        feedback: parsed.feedback ?? []
      };

    } catch (err) {

      console.error(
        'Gemini evaluation error:',
        err.response?.data || err.message
      );

      return { score: 0, feedback: [] };
    }
  }
}

module.exports = GeminiService;