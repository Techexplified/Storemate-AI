import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppProvider, Text } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import { chat } from "../lib/openai.server";

const PRESETS = [
  { id: "green",  bg: "#22c55e", icon: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="7" fill="white"/><path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="white"/></svg>
  )},
  { id: "blue",   bg: "#3b82f6", icon: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2.5"/><circle cx="15" cy="17" r="2" fill="white"/><circle cx="25" cy="17" r="2" fill="white"/><path d="M13 24c1.5 3 12.5 3 14 0" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
  )},
  { id: "yellow", bg: "#eab308", icon: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5l3.9 8.26L33 14.6l-6.5 6.33 1.53 8.94L20 25.5l-8.03 4.37 1.53-8.94L7 14.6l9.1-1.34L20 5z" fill="white"/></svg>
  )},
  { id: "pink",   bg: "#ec4899", icon: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 34s-14-9.35-14-19a8 8 0 0116 0 8 8 0 0116 0c0 9.65-14 19-14 19z" fill="white"/></svg>
  )},
  { id: "teal",   bg: "#14b8a6", icon: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="20" height="16" rx="3" fill="white"/><rect x="15" y="19" width="4" height="4" rx="1" fill="#14b8a6"/><rect x="21" y="19" width="4" height="4" rx="1" fill="#14b8a6"/><path d="M20 8v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><circle cx="20" cy="7" r="2" fill="white"/><path d="M13 30v3M27 30v3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
  )},
  { id: "indigo", bg: "#6366f1", icon: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4 6 6 0" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
  )},
  { id: "orange", bg: "#f97316", icon: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7a11 11 0 00-11 11c0 4.5 2.5 8 6 10v4h10v-4c3.5-2 6-5.5 6-10A11 11 0 0020 7z" fill="white"/><circle cx="15" cy="18" r="2.5" fill="#f97316"/><circle cx="25" cy="18" r="2.5" fill="#f97316"/><path d="M17 30h6M17 33h6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
];

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
    avatarPreset: config?.avatarPreset || "green",
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

  const selectedPreset = PRESETS.find(p => p.id === formData.avatarPreset) || PRESETS[0];

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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Section 1: Chatbot Identity */}
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
          </div>

          {/* Section 2: Avatar & Appearance */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text variant="headingSm" as="h2">2. Avatar & Appearance</Text>
                <Text variant="bodySm" tone="subdued">Choose how your assistant presents itself visually</Text>
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "6px 12px", background: "#fff", cursor: "pointer", fontSize: "13px" }}>
                ↑ Upload logo
              </button>
            </div>

            {/* Preset grid */}
            <div style={{display:"grid" , gridTemplateColumns: "repeat(2,1fr)"}}>
            <div style={{ marginTop: "16px" }}>
              <Text variant="bodySm" tone="subdued">Preset Avatars</Text>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 52px)", gap: "10px", marginTop: "10px" }}>
                {PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => updateField("avatarPreset", preset.id)}
                    style={{
                      width: "52px", height: "52px", borderRadius: "50%",
                      backgroundColor: preset.bg,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      outline: formData.avatarPreset === preset.id ? `3px solid #00A460` : "3px solid transparent",
                      outlineOffset: "2px",
                      transition: "outline 0.15s",
                      padding: "10px",
                      boxSizing: "border-box",
                    }}
                  >
                    {preset.icon}
                  </div>
                ))}
                {/* + tile */}
                <div
                  style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "#9ca3af", border: "2px dashed #d1d5db" }}
                >
                  +
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginLeft:"130px" }}>
              <Text variant="bodySm" tone="subdued">Preview</Text>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: selectedPreset.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", boxSizing: "border-box" }}>
                {selectedPreset.icon}
              </div>
              <Text variant="bodyMd" fontWeight="semibold">{formData.botName}</Text>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                <Text variant="bodySm" tone="subdued">Active now</Text>
              </div>
            </div>
            </div>
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