import { data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) return data({ messages: [] });

    const messages = await db.conversation.findMany({
        where: { shop, sessionId },
        orderBy: { createdAt: "asc" },
    });

    return data({ messages });
};