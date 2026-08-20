import db from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(
      JSON.stringify({ error: "Missing shop parameter" }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const [config, merchant, faqs] = await Promise.all([
      db.chatbotConfig.findUnique({ where: { shop } }),
      db.merchantConfig.findUnique({ where: { shop } }),
      db.faq.findMany({
        where: { shop, isActive: true },
        select: { question: true, answer: true, category: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    let starterPrompts = [];
    if (config?.starterPrompts) {
      try {
        starterPrompts = typeof config.starterPrompts === "string" 
          ? JSON.parse(config.starterPrompts) 
          : config.starterPrompts;
      } catch {
        starterPrompts = [];
      }
    }

    return new Response(
      JSON.stringify({
        botName: config?.botName ?? "Aria",
        brandColor: config?.brandColor ?? "#00A460",
        welcomeMessage: config?.welcomeMessage ?? "",
        avatarPreset: config?.avatarPreset ?? "green",
        logoUrl: config?.logoUrl ?? null,
        starterPrompts,
        capFaqs: config?.capFaqs ?? true,
        capOrderTracking: config?.capOrderTracking ?? true,
        faqs: faqs ?? [],
        supportEmail: merchant?.supportEmail ?? null,
        supportUrl: merchant?.supportUrl ?? null,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("API Config Loader Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", detail: error.message }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: CORS_HEADERS }
  );
}