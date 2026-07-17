import { data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({request}) => {
    const {session} = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "7d";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 5;
    const skip = (page -1) * limit;
    const rangeMap = {"7d": 7, "1m": 30, "3m": 90};
    const since = new Date(Date.now() - (rangeMap[range] || 7)* 86400000);

    const [conversations, groupedSessions, merchantConfig, assistantMsgs] = await Promise.all([
        db.conversation.findMany({
            where: {shop , role: "user", createdAt: {gte : since}},
            distinct: ["sessionId"], orderBy: {createdAt : "desc"}, skip, take: limit,
        }),
        db.conversation.groupBy({ by: ["sessionId"], where: {shop, role: "user", createdAt: {gte: since} }}),
        db.merchantConfig.findUnique({ where: {shop}}),
        db.conversation.findMany({
            where: {shop, role: "assistant", createdAt: {gte: since}},
            select: {sessionId: true, message : true},
        }),        
    ]);

    const escalatedSessions = [...new Set(
        assistantMsgs
            .filter(m => (merchantConfig?.supportEmail && m.message.toLowerCase().includes(merchantConfig.supportEmail.toLowerCase())) ||
                          (merchantConfig?.supportUrl && m.message.toLowerCase().includes(merchantConfig.supportUrl.toLowerCase())))
            .map(m => m.sessionId)
    )];

    return data({conversations, totalConversations: groupedSessions.length, escalatedSessions});
}