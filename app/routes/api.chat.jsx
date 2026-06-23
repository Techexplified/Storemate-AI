// app/routes/api.chat.jsx
import { data } from "react-router";
import db from "../db.server";
import { chat } from "../lib/openai.server";
import { buildSystemPrompt, lookupOrder } from "../lib/store-data.server";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function extractOrderInfo(message) {
  const orderMatch = message.match(/#?(\d{4,})/);
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return {
    orderNumber: orderMatch?.[1] || null,
    email: emailMatch?.[0] || null,
  };
}

function formatOrderReply(order, botName) {
  if (!order) return "I couldn't find an order with those details. Please double-check your order number and email.";

  let reply = `Here's your order status, ${order.number}:\n\n`
    + `• Status: ${order.status}\n`
    + `• Payment: ${order.financialStatus}\n`
    + `• Placed: ${order.createdAt}\n`
    + `• Total: ${order.total}\n`
    + `• Items: ${order.items}`;

  if (order.trackingNumbers) {
    reply += `\n• Tracking: ${order.trackingNumbers}`;
  }
  if (order.trackingUrls) {
    reply += `\n• Track here: ${order.trackingUrls}`;
  }

  return reply;
}

async function logMessages(shop, sessionId, customerName, customerEmail, userMessage, assistantReply) {
  await db.conversation.createMany({
    data: [
      { shop, sessionId, customerName, customerEmail, role: "user", message: userMessage },
      { shop, sessionId, customerName, customerEmail: null, role: "assistant", message: assistantReply },
    ],
  });
}

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  if (request.method !== "POST") return data({ error: "Method not allowed" }, { status: 405, headers: HEADERS });

  try {
    const { shop, messages, sessionId, customerName = "Guest", customerEmail = null } = await request.json();
    if (!shop || !messages?.length || !sessionId) return data({ error: "Missing fields" }, { status: 400, headers: HEADERS });


    const config = await db.chatbotConfig.findUnique({ where: { shop } });
    if (!config) return data({ error: "Chatbot not configured" }, { status: 404, headers: HEADERS });

    // Order lookup — no Gemini needed
    if (config.capOrderTracking) {
      const lastMessage = messages[messages.length - 1]?.content || "";
      const { orderNumber, email } = extractOrderInfo(lastMessage);

      if (orderNumber && email) {
        const order = await lookupOrder(shop, orderNumber, email);
        const reply = formatOrderReply(order, config.botName);
        await logMessages(shop, sessionId, customerName, customerEmail, lastMessage, reply);
        return data({ reply }, { headers: HEADERS });
      }
    }

    // Gemini
    const systemPrompt = await buildSystemPrompt(shop, null, config);
    const reply = await chat(messages, systemPrompt);
    await logMessages(shop, sessionId, customerName, customerEmail, messages[messages.length - 1].content, reply);
    return data({ reply }, { headers: HEADERS });

  } catch (e) {
    console.error("Chat error:", e);
    return data({ error: "Something went wrong" }, { status: 500, headers: HEADERS });
  }
};