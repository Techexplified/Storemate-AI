import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppProvider, Text } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import { chat } from "../lib/openai.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const config = await db.chatbotConfig.findUnique({
    where: { shop: session.shop },
  });
  return data({ config, shop: session.shop });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "suggestNames") {
    const storeName = session.shop.replace(".myshopify.com", "");
    const raw = await chat([{
      role: "user",
      content: `Generate 6 short catchy AI assistant names for a Shopify store called "${storeName}". Return ONLY a JSON array of 6 strings, no explanation.`,
    }]);
    const names = JSON.parse(raw.replace(/```json|```/g, ""));
    return data({ names });
  }

  await db.chatbotConfig.upsert({
    where: { shop: session.shop },
    update: { botName: formData.get("botName"), personalityTone: formData.get("personalityTone") },
    create: { shop: session.shop, botName: formData.get("botName"), personalityTone: formData.get("personalityTone") },
  });
  return data({ success: true });
};

export default function Index() {
  const { config } = useLoaderData();
  const fetcher = useFetcher();
  const namesFetcher = useFetcher();

  const [formData, setFormData] = useState({
    botName: config?.botName || "Aria",
    personalityTone: config?.personalityTone || "friendly",
  });
  const [suggestedNames, setSuggestedNames] = useState(["Aria", "Nova", "Sage", "Finn", "Luna", "Zara"]);

  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (namesFetcher.data?.names) setSuggestedNames(namesFetcher.data.names);
  }, [namesFetcher.data]);

  const fetchNames = () =>
    namesFetcher.submit({ intent: "suggestNames" }, { method: "POST" });

  const handleSave = () =>
    fetcher.submit({ intent: "save", ...formData }, { method: "POST" });

  return (
    <AppProvider i18n={enTranslations}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "32px 24px 24px", borderBottom: "1px solid #e1e3e5" }}>
        <div style={{ display: "inline-block", backgroundColor: "#e8f5e9", color: "#00A460", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>
          AI Persona & Branding
        </div>
        <Text variant="headingXl" as="h1">Make your chatbot feel like part of your brand</Text>
        <Text variant="bodyMd" tone="subdued">
          Customize your AI assistant's personality, appearance, and voice. Your customers will see this in every conversation.
        </Text>
      </div>

      {/* 2-col layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Left */}
        <div>
          <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text variant="headingSm" as="h2">1. Chatbot Identity</Text>
                <Text variant="bodySm" tone="subdued">Name and personality your customers will see</Text>
              </div>
              <span style={{ backgroundColor: "#e8f5e9", color: "#00A460", borderRadius: "20px", padding: "3px 10px", fontSize: "12px" }}>✦ AI-assisted</span>
            </div>

            {/* Name input */}
            <div style={{ marginTop: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500" }}>Assistant Name</label>
              <div style={{ position: "relative", marginTop: "6px" }}>
                <input
                  value={formData.botName}
                  onChange={(e) => updateField("botName", e.target.value)}
                  maxLength={25}
                  style={{ width: "100%", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 50px 8px 12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                />
                <button
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#00A460", fontSize: "13px", fontWeight: "500" }}
                >
                  ✦ AI
                </button>
              </div>
              <Text variant="bodySm" tone="subdued">This name appears in the chat header and all messages</Text>
            </div>

            {/* Suggested names */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <Text variant="bodySm" tone="subdued">✦ AI-suggested names for your store</Text>
                <button
                  onClick={fetchNames}
                  disabled={namesFetcher.state !== "idle"}
                  style={{ background: "none", border: "1px solid #e1e3e5", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", fontSize: "12px" }}
                >
                  {namesFetcher.state !== "idle" ? "Loading..." : "Refresh"}
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {suggestedNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => updateField("botName", name)}
                    style={{ backgroundColor: formData.botName === name ? "#00A460" : "#f0fdf4", color: formData.botName === name ? "#fff" : "#00A460", border: "1px solid #00A460", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", cursor: "pointer" }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div style={{ marginTop: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500" }}>Personality Tone</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                {[["friendly", "Friendly", "Warm & casual"], ["professional", "Professional", "Clear & formal"], ["concise", "Concise", "Direct & brief"]].map(([val, label, sub]) => (
                  <button
                    key={val}
                    onClick={() => updateField("personalityTone", val)}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: "8px", border: `2px solid ${formData.personalityTone === val ? "#00A460" : "#e1e3e5"}`, backgroundColor: formData.personalityTone === val ? "#f0fdf4" : "#fff", cursor: "pointer", textAlign: "center" }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "13px", color: formData.personalityTone === val ? "#00A460" : "#111" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Save
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSave}
                disabled={fetcher.state !== "idle"}
                style={{ backgroundColor: "#00A460", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
              >
                {fetcher.state !== "idle" ? "Saving..." : "Save"}
              </button>
            </div> */}
          </div>
        </div>

        {/* Right — live preview */}
        <div style={{ position: "sticky", top: "24px", alignSelf: "start" }}>
          {/* preview goes here */}
        </div>
      </div>
    </AppProvider>
  );
}