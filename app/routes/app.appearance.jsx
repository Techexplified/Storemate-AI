import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, redirect, data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppProvider, Text } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { chat } from "../lib/openai.server";

import ChatbotIdentity from "../components/onboarding/ChatbotIdentity";
import AvatarAppearance from "../components/onboarding/AvatarAppearance";
import WelcomeMessage from "../components/onboarding/WelcomeMessage";
import BrandStyling from "../components/onboarding/BrandStyling";
import LivePreview from "../components/onboarding/LivePreview";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const config = await db.chatbotConfig.findUnique({ where: { shop: session.shop } });

  const url = new URL(request.url);
  if (config?.setupComplete && url.searchParams.get("mode") !== "edit") {
    return redirect(`/app/dashboard?${url.searchParams.toString()}`);
  }

  return data({ config, shop: session.shop, themeColor: null });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "generateWelcome") {
    const template = formData.get("template");
    const botName = formData.get("botName");
    const tone = formData.get("personalityTone");
    const raw = await chat([{
      role: "user",
      content: `Generate a short welcome message for a Shopify store chatbot named "${botName}" with a ${tone} personality tone. Template style: ${template}. Max 2 sentences. Return ONLY the message text, no quotes.`,
    }]);
    return data({ welcomeMessage: raw });
  }

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
    update: {
      botName: formData.get("botName"),
      personalityTone: formData.get("personalityTone"),
      avatarPreset: formData.get("avatarPreset"),
      logoUrl: formData.get("logoUrl") || null,
      welcomeMessage: formData.get("welcomeMessage") || null,
      starterPrompts: formData.get("starterPrompts") || null,
      brandColor: formData.get("brandColor") || "#00A460",
      language: formData.get("language") || "en",
    },
    create: {
      shop: session.shop,
      botName: formData.get("botName"),
      personalityTone: formData.get("personalityTone"),
      avatarPreset: formData.get("avatarPreset"),
      logoUrl: formData.get("logoUrl") || null,
      welcomeMessage: formData.get("welcomeMessage") || null,
      starterPrompts: formData.get("starterPrompts") || null,
      brandColor: formData.get("brandColor") || "#00A460",
      language: formData.get("language") || "en",
    },
  });

  if (intent === "saveAndContinue") return redirect(`/app/capabilities?mode=edit`);
  if (intent === "save") return redirect(`/app?mode=edit`);

  return data({ success: true });
};

export default function AppAppearance() {
  const { config, themeColor: fetchedThemeColor } = useLoaderData();
  const fetcher = useFetcher();
  const namesFetcher = useFetcher();
  const templateFetcher = useFetcher();

  const [formData, setFormData] = useState({
    botName: config?.botName || "Aria",
    personalityTone: config?.personalityTone || "friendly",
    avatarPreset: config?.avatarPreset || "green",
    welcomeMessage: config?.welcomeMessage || "",
    brandColor: config?.brandColor || "#00A460",
    language: config?.language || "en",
  });

  const [logoUrl, setLogoUrl] = useState(config?.logoUrl || null);
  const [themeColor, setThemeColor] = useState("#00A460");
  const [starterPrompts, setStarterPrompts] = useState(
    config?.starterPrompts ? JSON.parse(config.starterPrompts) : ["Where is my order?"]
  );

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (fetchedThemeColor) setThemeColor(fetchedThemeColor);
  }, [fetchedThemeColor]);

  const handleSave = () =>
    fetcher.submit({
      intent: "save",
      ...formData,
      logoUrl: logoUrl || "",
      starterPrompts: JSON.stringify(starterPrompts),
    }, { method: "POST" });

  const handleSaveAndContinue = () =>
    fetcher.submit({
      intent: "saveAndContinue",
      ...formData,
      logoUrl: logoUrl || "",
      starterPrompts: JSON.stringify(starterPrompts),
    }, { method: "POST" });

  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ textAlign: "center", padding: "32px 24px 24px", borderBottom: "1px solid #e1e3e5" }}>
        <div style={{ display: "inline-block", backgroundColor: "#e8f5e9", color: "#00A460", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>
          Step 1 - AI Persona & Branding
        </div>
        <Text variant="headingXl" as="h1">Make your chatbot feel like part of your brand</Text>
        <Text variant="bodyMd" tone="subdued">
          Customize your AI assistant's personality, and appearance. Your customers will see this in every conversation.
        </Text>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <ChatbotIdentity formData={formData} updateField={updateField} namesFetcher={namesFetcher} />
          <AvatarAppearance formData={formData} updateField={updateField} logoUrl={logoUrl} setLogoUrl={setLogoUrl} />
          <WelcomeMessage formData={formData} updateField={updateField} templateFetcher={templateFetcher} starterPrompts={starterPrompts} setStarterPrompts={setStarterPrompts} />
          <BrandStyling formData={formData} updateField={updateField} themeColor={themeColor} />
        </div>

        <div style={{ position: "sticky", top: "24px", alignSelf: "start" }}>
          <LivePreview formData={formData} logoUrl={logoUrl} starterPrompts={starterPrompts} />
        </div>
      </div>

      <div style={{ bottom: "0", padding: "16px 24px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", zIndex: 10 }}>
        <button onClick={handleSave} disabled={fetcher.state !== "idle"} style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 16px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#374151" }}>
          🖫 {fetcher.state !== "idle" ? "Saving..." : "Save draft"}
        </button>
        <button onClick={handleSaveAndContinue} style={{ backgroundColor: "#00A460", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
          Continue →
        </button>
      </div>
    </AppProvider>
  );
}