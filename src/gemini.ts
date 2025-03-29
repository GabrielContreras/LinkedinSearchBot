import * as dotenv from "dotenv";

const {
    GoogleGenerativeAI,
  } = require("@google/generative-ai");
  
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_TOKEN);
  
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        Score: {
          type: "number"
        }
      }
    },
  };

export async function run(description: String): Promise<number | null> {
    const chatSession = model.startChat({
      generationConfig,
      history: [
      ],
    });
    console.log(`API KEY: ${process.env.GEMINI_API_TOKEN}`);

    const startOfPrompt = `You are a bot meant to provide a score to match a job description to a person on how compatible they are for the job. Below is the description of the person,
      ${process.env.PERSONAL_DESCRIPTION ?? "No description given" } 
      If the value for each criteria is neutral, it's still positive, just less. Say negative is worth 0, neutral is worth half, and direct correlation is worth full points per section. Score is between 0-100, below is the job description.
    `;

    console.log(`Start of prompt: ${startOfPrompt}`);
  
    const result = await chatSession.sendMessage(startOfPrompt + description);
    try {
        const jsonResponse = JSON.parse(result.response.text());
        const score = jsonResponse.Score;
        console.log(`Successfully recorded score: ${score}`);
        return score;
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
      }
  }