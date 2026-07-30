export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "7d";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 5;
    const skip = (page - 1) * limit;
    const rangeMap = { "7d": 7, "1m": 30, "3m": 90 };
    const since = new Date(Date.now() - (rangeMap[range] || 7) * 86400000);

    const merchantConfig = await db.merchantConfig.findUnique({ where: { shop } });

    const escalationOr = [];
    if (merchantConfig?.supportEmail) {
        escalationOr.push({ message: { contains: merchantConfig.supportEmail, mode: "insensitive" } });
    }
    if (merchantConfig?.supportUrl) {
        escalationOr.push({ message: { contains: merchantConfig.supportUrl, mode: "insensitive" } });
    }

    const [conversations, totalResult, escalatedRows] = await Promise.all([
        db.conversation.findMany({
            where: { shop, role: "user", createdAt: { gte: since } },
            distinct: ["sessionId"], orderBy: { createdAt: "desc" }, skip, take: limit,
        }),
        db.$queryRaw`SELECT COUNT(DISTINCT "sessionId") as count FROM "Conversation" WHERE "shop" = ${shop} AND "role" = 'user' AND "createdAt" >= ${since}`,
        escalationOr.length
            ? db.conversation.findMany({
                where: { shop, role: "assistant", createdAt: { gte: since }, OR: escalationOr },
                select: { sessionId: true },
                distinct: ["sessionId"],
            })
            : Promise.resolve([]),
    ]);

    const totalConversations = Number(totalResult[0].count);
    const escalatedSessions = escalatedRows.map(r => r.sessionId);

    return data({ conversations, totalConversations, escalatedSessions });
};