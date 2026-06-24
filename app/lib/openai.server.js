import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CHAT_MODEL = "gemini-2.5-flash";
const EMBED_MODEL = "text-embedding-004";

export async function chat(messages, systemPrompt = null) {
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    ...(systemPrompt && { systemInstruction: systemPrompt }),
  });

  // Convert OpenAI-style messages to Gemini history format
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(lastMessage);
  return result.response.text().trim();
}

export async function embed(text) {
  const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values; // float[]
}

export default genAI;