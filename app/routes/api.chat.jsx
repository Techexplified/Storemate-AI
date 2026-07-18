// app/routes/api.chat.jsx
import { data } from "react-router";
import db from "../db.server";
import { chat } from "../lib/openai.server";
import { buildSystemPrompt, lookupOrder } from "../lib/store-data.server";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export const loader = async ({ request }) => {
  console.log("api.chat.jsx loaded");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: HEADERS });
  }
  return new Response(null, { status: 405, headers: HEADERS });
};

function extractOrderInfo(messages) {
  const text = messages.slice(-6).map(m => m.content).join(" ");
  const orderMatch = text.match(/#?(\d{4,})/);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
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
  console.log("API CHAT HIT");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  if (request.method !== "POST") return data({ error: "Method not allowed" }, { status: 405, headers: HEADERS });

 try {
    const body = await request.json();
    let { shop, messages, sessionId, customerName = "Guest", isPreview, customerEmail = null, orderLookup } = body;

//     if (isPreview && !shop) {
//       const { session } = await authenticate.admin(request);
//       shop = session.shop;
//     }

    if (!shop || !sessionId || (!messages?.length && !orderLookup)) {
      return data({ error: "Missing fields" }, { status: 400, headers: HEADERS });
    }

    const config = await db.chatbotConfig.findUnique({ where: { shop } });
    if (!config) return data({ error: "Chatbot not configured" }, { status: 404, headers: HEADERS });

    if (orderLookup?.orderNumber && orderLookup?.email) {
      const order = await lookupOrder(shop, orderLookup.orderNumber, orderLookup.email);
      const reply = formatOrderReply(order, config.botName);
      if (!isPreview) await logMessages(shop, sessionId, customerName, customerEmail, `[Order Tracking] #${orderLookup.orderNumber}`, reply);
      return data({ reply }, { headers: HEADERS });
    }

    if (config.capOrderTracking) {
      const { orderNumber, email } = extractOrderInfo(messages);

      if (orderNumber && email) {
        const order = await lookupOrder(shop, orderNumber, email);
        const reply = formatOrderReply(order, config.botName);
        if (!isPreview) await logMessages(shop, sessionId, customerName, customerEmail, messages.at(-1).content, reply);
        return data({ reply }, { headers: HEADERS });
      }
      if (orderNumber || email) {
        const reply = `To look up your order, I need both your order number and the email used at checkout. ${orderNumber ? "You gave the order number — what's the email?" : "You gave the email — what's the order number?"}`;
        if (!isPreview) await logMessages(shop, sessionId, customerName, customerEmail, messages.at(-1).content, reply);
        return data({ reply }, { headers: HEADERS });
      }
    }

    const systemPrompt = await buildSystemPrompt(shop, null, config);
    const reply = await chat(messages, systemPrompt);
    if (!isPreview) await logMessages(shop, sessionId, customerName, customerEmail, messages[messages.length - 1].content, reply);
    return data({ reply }, { headers: HEADERS });

  } catch (e) {
     if (e instanceof Response) throw e;
    console.error("Chat error:", e);
    return data({ error: e.message || "Something went wrong" }, { status: 500, headers: HEADERS });
  }
};