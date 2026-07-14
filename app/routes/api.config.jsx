import db from "../db.server";

export async function loader({ request }) {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop")

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    }

    if (!shop) return new Response(JSON.stringify({ error: "no shop" }, { status: 400, headers }))

    const [config, merchant, faqs] = await Promise.all([
        db.chatbotConfig.findUnique({ where: { shop } }),
        db.merchantConfig.findUnique({ where: { shop } }),
        db.faq.findMany({ where: { shop }, select: { question: true, answer: true } }),
    ])

    return new Response(JSON.stringify({
        botName: config?.botName ?? "Aria",
        brandColor: config?.brandColor ?? "#00A460",
        welcomeMessage: config?.welcomeMessage ?? "",
        avatarPreset: config?.avatarPreset ?? "green",
        logoUrl: config?.logoUrl ?? null,
        starterPrompts: config?.starterPrompts ? JSON.parse(config.starterPrompts) : [],
        capFaqs: config?.capFaqs ?? true,
        capOrderTracking: config?.capOrderTracking ?? true,
        faqs: faqs ?? [],
        supportEmail: merchant?.supportEmail ?? null,
        supportUrl: merchant?.supportUrl ?? null,
    }), { status: 200, headers });

}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return new Response("method not allowed", { status: 405 });
}