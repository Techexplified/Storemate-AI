import { data, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
  const timings = {};
  const start = performance.now();

  // 1. Measure Shopify Auth
  const authStart = performance.now();
  const { session, admin } = await authenticate.admin(request);
  timings.authMs = Math.round(performance.now() - authStart);

  const shop = session.shop;

  // 2. Measure Individual Queries based on your dashboard/train loaders
  const dbStart = performance.now();
  
  const t1 = performance.now();
  await db.merchantConfig.findUnique({ where: { shop } });
  timings.merchantConfigMs = Math.round(performance.now() - t1);

  const t2 = performance.now();
  await db.chatbotConfig.findUnique({ where: { shop } });
  timings.chatbotConfigMs = Math.round(performance.now() - t2);

  const t3 = performance.now();
  const policies = await db.policy.findMany({ where: { shop } });
  timings.policiesMs = Math.round(performance.now() - t3);

  const t4 = performance.now();
  const faqs = await db.faq.findMany({ where: { shop } });
  timings.faqsMs = Math.round(performance.now() - t4);

  // Benchmarking the heaviest dashboard queries[cite: 5]
  const t5 = performance.now();
  const conversations = await db.conversation.findMany({ 
    where: { shop, role: "user" }, 
    take: 500 
  });
  timings.conversationsMs = Math.round(performance.now() - t5);

  const t6 = performance.now();
  await db.conversation.groupBy({
    by: ["sessionId"],
    where: { shop, role: "user" },
  });
  timings.groupByMs = Math.round(performance.now() - t6);

  // Benchmarking the Shopify GraphQL Theme Query[cite: 5]
  const t7 = performance.now();
  await admin.graphql(`
    query{
      themes(first: 10){
        nodes{ id role}
      }
    }
  `).catch(() => null);
  timings.graphqlThemeMs = Math.round(performance.now() - t7);

  timings.totalDbMs = Math.round(performance.now() - dbStart);
  timings.totalServerLoaderMs = Math.round(performance.now() - start);

  return data({
    timings,
    counts: {
      policies: policies.length,
      faqs: faqs.length,
      conversations: conversations.length
    }
  });
}

export default function PerfTestPage() {
  const { timings, counts } = useLoaderData();

  const getRowColor = (ms) => {
    if (ms > 300) return "#fee2e2"; // Red background for slow queries
    if (ms > 100) return "#fef9c3"; // Yellow background for moderate queries
    return "transparent";
  };

  return (
    <div style={{ padding: "32px", fontFamily: "system-ui, sans-serif", maxWidth: "800px", margin: "0 auto", color: "#111" }}>
      <h1>⚡ TTFB & Database Diagnostic</h1>
      <p style={{ color: "#6b7280" }}>Benchmarking your actual Shopify queries to find the LCP bottleneck.</p>

      <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "12px" }}>Operation</th>
            <th style={{ padding: "12px" }}>Rows Returned</th>
            <th style={{ padding: "12px" }}>Duration (ms)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <td style={{ padding: "12px" }}>Shopify Auth</td>
            <td style={{ padding: "12px", color: "#9ca3af" }}>-</td>
            <td style={{ padding: "12px", fontWeight: "600" }}>{timings.authMs} ms</td>
          </tr>
          
          <tr style={{ borderBottom: "1px solid #e5e7eb", background: getRowColor(timings.merchantConfigMs) }}>
            <td style={{ padding: "12px" }}>DB: Merchant Config</td>
            <td style={{ padding: "12px" }}>1</td>
            <td style={{ padding: "12px" }}>{timings.merchantConfigMs} ms</td>
          </tr>
          
          <tr style={{ borderBottom: "1px solid #e5e7eb", background: getRowColor(timings.chatbotConfigMs) }}>
            <td style={{ padding: "12px" }}>DB: Chatbot Config</td>
            <td style={{ padding: "12px" }}>1</td>
            <td style={{ padding: "12px" }}>{timings.chatbotConfigMs} ms</td>
          </tr>

          <tr style={{ borderBottom: "1px solid #e5e7eb", background: getRowColor(timings.policiesMs) }}>
            <td style={{ padding: "12px" }}>DB: Policies</td>
            <td style={{ padding: "12px" }}>{counts.policies}</td>
            <td style={{ padding: "12px" }}>{timings.policiesMs} ms</td>
          </tr>

          <tr style={{ borderBottom: "1px solid #e5e7eb", background: getRowColor(timings.faqsMs) }}>
            <td style={{ padding: "12px" }}>DB: FAQs</td>
            <td style={{ padding: "12px" }}>{counts.faqs}</td>
            <td style={{ padding: "12px" }}>{timings.faqsMs} ms</td>
          </tr>

          <tr style={{ borderBottom: "1px solid #e5e7eb", background: getRowColor(timings.conversationsMs) }}>
            <td style={{ padding: "12px", fontWeight: "600" }}>DB: Conversations (Take 500)</td>
            <td style={{ padding: "12px" }}>{counts.conversations}</td>
            <td style={{ padding: "12px", fontWeight: "600" }}>{timings.conversationsMs} ms</td>
          </tr>

          <tr style={{ borderBottom: "1px solid #e5e7eb", background: getRowColor(timings.groupByMs) }}>
            <td style={{ padding: "12px", fontWeight: "600" }}>DB: Conversation GroupBy</td>
            <td style={{ padding: "12px", color: "#9ca3af" }}>-</td>
            <td style={{ padding: "12px", fontWeight: "600" }}>{timings.groupByMs} ms</td>
          </tr>

          <tr style={{ borderBottom: "1px solid #e5e7eb", background: getRowColor(timings.graphqlThemeMs) }}>
            <td style={{ padding: "12px", fontWeight: "600" }}>Shopify: GraphQL Themes</td>
            <td style={{ padding: "12px", color: "#9ca3af" }}>-</td>
            <td style={{ padding: "12px", fontWeight: "600" }}>{timings.graphqlThemeMs} ms</td>
          </tr>

          <tr style={{ background: "#f3f4f6", fontWeight: "bold", borderTop: "2px solid #d1d5db" }}>
            <td style={{ padding: "12px" }}>TOTAL SERVER TTFB</td>
            <td style={{ padding: "12px" }}></td>
            <td style={{ padding: "12px", color: timings.totalServerLoaderMs > 400 ? "#dc2626" : "#059669" }}>
              {timings.totalServerLoaderMs} ms
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: "24px", fontSize: "14px", lineHeight: "1.6" }}>
        <strong>How to read this:</strong><br/>
        If your Total Server TTFB is high (e.g., above 400-500ms), your LCP issue is <strong>server-side</strong>. 
        Look for red or yellow rows. The `groupBy` or `GraphQL` queries in your dashboard are the most likely culprits.
        <br/><br/>
        If your Total Server TTFB is low (under 300ms) but your page is still slow to load, your LCP issue is <strong>client-side</strong> (hydration, heavy React rendering, or Polaris CSS blocking the main thread).
      </p>
    </div>
  );
}