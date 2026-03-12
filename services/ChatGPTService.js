const axios = require('axios');
const SettingService = require('./SettingService');

class ChatGPTService {
  /**
   * Evaluate candidate answers using OpenAI ChatGPT model.
   * @param {Object} param0
   * @param {Array} param0.questions - Array of assessment questions
   * @param {Array} param0.answers - Array of answer objects {question_id, answer}
   * @param {number|null} param0.company_id - Company context for API keys
   * @returns {Promise<{score:number, feedback:Array}>}
   */
  static async evaluateAnswers({ questions, answers, company_id = null }) {
    // Try to get settings from database first
    const apiSetting = await SettingService.getSettingByKey('openai_api_key', company_id);
    const modelSetting = await SettingService.getSettingByKey('openai_model', company_id);

    const apiKey = apiSetting ? apiSetting.setting_value : process.env.OPENAI_API_KEY;
    const model = modelSetting ? modelSetting.setting_value : (process.env.OPENAI_MODEL || 'gpt-4o-mini');
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      console.error(`ChatGPT Error: API Key missing for company ${company_id || 'Global'}`);
      return { score: 0, feedback: [] };
    }

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

    const userPrompt = `Questions: ${JSON.stringify(questions)}\n\nCandidate Answers: ${JSON.stringify(answers)}`;

    try {
      const response = await axios.post(
        endpoint,
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data?.choices?.[0]?.message?.content?.trim();
      const parsed = JSON.parse(content);
      
      return {
        score: parsed.score ?? 0,
        feedback: parsed.feedback ?? []
      };
    } catch (err) {
      console.error('ChatGPT evaluation error:', err.response?.data || err.message);
      return { score: 0, feedback: [] };
    }
  }
}

module.exports = ChatGPTService;
