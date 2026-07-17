// app/routes/app.dashboard.conversations.jsx
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);
    
    const range = url.searchParams.get("range") || "7d";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 5;
    const skip = (page - 1) * limit;

    const rangeMap = { "7d": 7, "1m": 30, "3m": 90 };
    const days = rangeMap[range] || 7;
    const since = new Date(Date.now() - days * 86400000);

    // 1. Fetch only what we need to calculate escalations
    const merchantConfig = await db.merchantConfig.findUnique({
        where: { shop },
        select: { supportEmail: true, supportUrl: true }
    });

    const escalationConditions = [];
    if (merchantConfig?.supportEmail) {
        escalationConditions.push({ message: { contains: merchantConfig.supportEmail, mode: "insensitive" } });
    }
    if (merchantConfig?.supportUrl) {
        escalationConditions.push({ message: { contains: merchantConfig.supportUrl, mode: "insensitive" } });
    }

    // 2. Prepare the lightweight queries
    const queries = [
        // Paginated conversations
        db.conversation.findMany({
            where: { shop, role: "user", createdAt: { gte: since } },
            distinct: ["sessionId"],
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        // Fast distinct count (much lighter than groupBy)
        db.conversation.findMany({
            where: { shop, role: "user", createdAt: { gte: since } },
            distinct: ["sessionId"],
            select: { sessionId: true }
        })
    ];

    if (escalationConditions.length > 0) {
        queries.push(
            db.conversation.findMany({
                where: { shop, role: "assistant", createdAt: { gte: since }, OR: escalationConditions },
                select: { sessionId: true }
            })
        );
    }

    const [conversations, distinctSessions, escalatedMessages = []] = await Promise.all(queries);

    const totalConversations = distinctSessions.length;
    const hasNextPage = skip + limit < totalConversations;
    
    // Return an array, we'll cast it to a Set on the client
    const escalatedSessions = escalatedMessages.map(m => m.sessionId);

    return data({
        conversations,
        escalatedSessions,
        totalConversations,
        hasNextPage
    });
};