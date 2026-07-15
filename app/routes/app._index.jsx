import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, data, useNavigate, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppProvider, Text, Banner } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import { chat } from "../lib/openai.server";

const PRESETS = [
  {
    id: "green", bg: "#22c55e", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="7" fill="white" /><path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="white" /></svg>
    )
  },
  {
    id: "blue", bg: "#3b82f6", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2.5" /><circle cx="15" cy="17" r="2" fill="white" /><circle cx="25" cy="17" r="2" fill="white" /><path d="M13 24c1.5 3 12.5 3 14 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
    )
  },
  {
    id: "yellow", bg: "#eab308", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5l3.9 8.26L33 14.6l-6.5 6.33 1.53 8.94L20 25.5l-8.03 4.37 1.53-8.94L7 14.6l9.1-1.34L20 5z" fill="white" /></svg>
    )
  },
  {
    id: "pink", bg: "#ec4899", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 34s-14-9.35-14-19a8 8 0 0116 0 8 8 0 0116 0c0 9.65-14 19-14 19z" fill="white" /></svg>
    )
  },
  {
    id: "teal", bg: "#14b8a6", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="20" height="16" rx="3" fill="white" /><rect x="15" y="19" width="4" height="4" rx="1" fill="#14b8a6" /><rect x="21" y="19" width="4" height="4" rx="1" fill="#14b8a6" /><path d="M20 8v6" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><circle cx="20" cy="7" r="2" fill="white" /><path d="M13 30v3M27 30v3" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
    )
  },
  {
    id: "indigo", bg: "#6366f1", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4 6 6 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
    )
  },
  {
    id: "orange", bg: "#f97316", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7a11 11 0 00-11 11c0 4.5 2.5 8 6 10v4h10v-4c3.5-2 6-5.5 6-10A11 11 0 0020 7z" fill="white" /><circle cx="15" cy="18" r="2.5" fill="#f97316" /><circle cx="25" cy="18" r="2.5" fill="#f97316" /><path d="M17 30h6M17 33h6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" /></svg>
    )
  },
];

const getBrandPresets = (themeColor) => [
  themeColor || "#00A460",
  "#6366f1", "#f97316", "#ec4899",
  "#14b8a6", "#8b5cf6", "#ef4444",
  "#f43f5e", "#1f2937", "#0ea5e9",
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
];


export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const config = await db.chatbotConfig.findUnique({ where: { shop: session.shop } });

  const url = new URL(request.url);
  if (config && url.searchParams.get("mode") !== "edit") return redirect(`/app/dashboard?${url.searchParams.toString()}`);

  let themeColor = null;
  try {
    const response = await admin.graphql(`{ shop { brand { colors { primary { hex } } } } }`);
    const json = await response.json();
    themeColor = json?.data?.shop?.brand?.colors?.primary?.[0]?.hex || null;
  } catch (e) { }
  return data({ config, shop: session.shop, themeColor });
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

  if (intent === "saveAndContinue") {
    return redirect(`/app/capabilities?mode=edit`);
  }

  if (intent === "save") {
    return redirect(`/app?mode=edit`);
  }

  return data({ success: true });
};

export default function Index() {
  const { config, themeColor: fetchedThemeColor } = useLoaderData();
  const fetcher = useFetcher();
  const namesFetcher = useFetcher();
  const templateFetcher = useFetcher();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    botName: config?.botName || "Aria",
    personalityTone: config?.personalityTone || "friendly",
    avatarPreset: config?.avatarPreset || "green",
    welcomeMessage: config?.welcomeMessage || "",
    brandColor: config?.brandColor || "#00A460",
    language: config?.language || "en",
  });

  const [suggestedNames, setSuggestedNames] = useState(["Aria", "Nova", "Sage", "Finn", "Luna", "Zara"]);
  const [logoUrl, setLogoUrl] = useState(config?.logoUrl || null);
  const [logoError, setLogoError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [themeColor, setThemeColor] = useState("#00A460");
  const [starterPrompts, setStarterPrompts] = useState(
    config?.starterPrompts ? JSON.parse(config.starterPrompts) : ["Where is my order?"]
  );
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (fetchedThemeColor) setThemeColor(fetchedThemeColor);
  }, []);

  useEffect(() => {
    if (namesFetcher.data?.names) setSuggestedNames(namesFetcher.data.names);
  }, [namesFetcher.data]);

  useEffect(() => {
    if (templateFetcher.data?.welcomeMessage) {
      updateField("welcomeMessage", templateFetcher.data.welcomeMessage);
    }
  }, [templateFetcher.data]);

  const fetchNames = () =>
    namesFetcher.submit({ intent: "suggestNames" }, { method: "POST" });

  const handleSave = () =>
    fetcher.submit({
      intent: "save",
      ...formData,
      logoUrl: logoUrl || "",
      starterPrompts: JSON.stringify(starterPrompts),
    }, { method: "POST" });

  const addStarterPrompt = () => {
    if (starterPrompts.length >= 3) return;
    setStarterPrompts([...starterPrompts, ""]);
  };

  const updateStarterPrompt = (index, value) => {
    const updated = [...starterPrompts];
    updated[index] = value;
    setStarterPrompts(updated);
  };

  const removeStarterPrompt = (index) => {
    setStarterPrompts(starterPrompts.filter((_, i) => i !== index));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Type check
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLogoError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    // Size check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be under 2MB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      // Dimension check
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          setLogoError("Image must be at least 100×100 pixels.");
          return;
        }
        if (img.width > 1000 || img.height > 1000) {
          setLogoError("Image must be at most 1000×1000 pixels.");
          return;
        }
        setLogoError(null);
        setLogoUrl(base64);
        updateField("avatarPreset", ""); // clear preset
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const selectedPreset = PRESETS.find(p => p.id === formData.avatarPreset) || PRESETS[0];

  return (
    <AppProvider i18n={enTranslations}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "32px 24px 24px", borderBottom: "1px solid #e1e3e5" }}>
        <div style={{ display: "inline-block", backgroundColor: "#e8f5e9", color: "#00A460", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>
          Step 1 - AI Persona & Branding
        </div>
        <Text variant="headingXl" as="h1">Make your chatbot feel like part of your brand</Text>
        <Text variant="bodyMd" tone="subdued">
          Customize your AI assistant's personality, and appearance. Your customers will see this in every conversation.
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
              <>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />
                <button
                  onClick={() => document.getElementById("logo-upload").click()}
                  style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "6px 12px", background: "#fff", cursor: "pointer", fontSize: "13px" }}
                >
                  ↑ Upload logo
                </button>
              </>
            </div>
            {logoError && (
              <div style={{ marginTop: "10px" }}>
                <Banner tone="critical" onDismiss={() => setLogoError(null)}>
                  {logoError}
                </Banner>
              </div>
            )}

            {/* Preset grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)" }}>
              <div style={{ marginTop: "16px" }}>
                <Text variant="bodySm" tone="subdued">Preset Avatars</Text>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 52px)", gap: "10px", marginTop: "10px" }}>
                  {PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => { updateField("avatarPreset", preset.id); setLogoUrl(null); setLogoError(null); }}
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
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginLeft: "130px" }}>
                <Text variant="bodySm" tone="subdued">Preview</Text>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: logoUrl ? "#f3f4f6" : selectedPreset.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: logoUrl ? "0" : "16px", boxSizing: "border-box", overflow: "hidden" }}>
                  {logoUrl
                    ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : selectedPreset.icon
                  }
                </div>
                <Text variant="bodyMd" fontWeight="semibold">{formData.botName}</Text>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                  <Text variant="bodySm" tone="subdued">Active now</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Welcome Message */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px" }}>
            <div>
              <Text variant="headingSm" as="h2">3. Welcome Message</Text>
              <Text variant="bodySm" tone="subdued">First thing customers see when they open the chat</Text>
            </div>

            {/* Template chips */}
            <div style={{ marginTop: "16px" }}>
              <Text variant="bodySm" tone="subdued">Message templates</Text>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {["Friendly greeting", "Shop assistant", "Order tracker", "Minimal"].map((template) => (
                  <button
                    key={template}
                    disabled={templateFetcher.state !== "idle"}
                    onClick={() =>
                      templateFetcher.submit(
                        { intent: "generateWelcome", template, botName: formData.botName, personalityTone: formData.personalityTone },
                        { method: "POST" }
                      )
                    }
                    style={{ backgroundColor: "#f9fafb", border: "1px solid #e1e3e5", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", cursor: "pointer" }}
                  >
                    {templateFetcher.state !== "idle" ? "Generating..." : template}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div style={{ marginTop: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500" }}>Welcome message text</label>
              <div style={{ position: "relative", marginTop: "6px" }}>
                <textarea
                  value={formData.welcomeMessage}
                  onChange={(e) => updateField("welcomeMessage", e.target.value)}
                  maxLength={300}
                  placeholder="e.g. Hi! I'm Aria, how can I help you?"
                  rows={4}
                  style={{ width: "100%", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "#00A460"}
                  onBlur={(e) => e.target.style.borderColor = "#e1e3e5"}
                />
                <div style={{ position: "absolute", bottom: "8px", right: "10px", fontSize: "11px", color: "#9ca3af" }}>
                  {formData.welcomeMessage.length} / 300
                </div>
              </div>
            </div>

            {/* Starter prompts */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text variant="bodySm" tone="subdued">Starter prompts shown to customers</Text>
                {starterPrompts.length < 3 && (
                  <button
                    onClick={addStarterPrompt}
                    style={{ background: "none", border: "none", color: "#00A460", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}
                  >
                    + Add
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                {starterPrompts.map((prompt, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f9fafb", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 12px" }}>
                    <input
                      value={prompt}
                      onChange={(e) => updateStarterPrompt(index, e.target.value)}
                      placeholder="e.g. What are your shipping options?"
                      style={{ flex: 1, border: "none", background: "none", fontSize: "13px", outline: "none" }}
                    />
                    <button
                      onClick={() => removeStarterPrompt(index)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4 & 5 side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

            {/* Section 4: Brand Color */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px" }}>
              <Text variant="headingSm" as="h2">4. Brand Color</Text>
              <Text variant="bodySm" tone="subdued">Used in chat widget buttons and accents</Text>

              {/* Swatches */}
              <div style={{ marginTop: "14px" }}>
                <Text variant="bodySm" tone="subdued">Preset colors</Text>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 36px)", gap: "10px", marginTop: "10px" }}>
                  {getBrandPresets(themeColor).map((color, i) => (
                    <div
                      key={i}
                      onClick={() => updateField("brandColor", color)}
                      style={{
                        width: "36px", height: "36px", borderRadius: "8px",
                        backgroundColor: color, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        outline: formData.brandColor === color ? "3px solid #00A460" : "3px solid transparent",
                        outlineOffset: "2px",
                      }}
                    >
                      {formData.brandColor === color && (
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hex input */}
              <div style={{ marginTop: "16px" }}>
                <Text variant="bodySm" tone="subdued">Custom hex value</Text>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 12px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: formData.brandColor, flexShrink: 0 }} />
                  <input
                    value={formData.brandColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField("brandColor", val);
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (!/^#[0-9A-Fa-f]{6}$/.test(val)) updateField("brandColor", themeColor || "#00A460");
                    }}
                    style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", fontFamily: "monospace" }}
                  />
                </div>
                {formData.brandColor === themeColor && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", color: "#00A460", fontSize: "12px" }}>
                    <span>⊙</span> Matches your Shopify theme
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Language — placeholder for now */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px" }}>
              <Text variant="headingSm" as="h2">5. Language</Text>
              <Text variant="bodySm" tone="subdued">Language your AI will respond in</Text>

              <div style={{ marginTop: "14px", maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", paddingRight: "4px" }}>
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={() => updateField("language", lang.code)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                      backgroundColor: formData.language === lang.code ? "#f0fdf4" : "transparent",
                      border: `1px solid ${formData.language === lang.code ? "#00A460" : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: formData.language === lang.code ? "#00A460" : "#111", fontWeight: formData.language === lang.code ? "500" : "400" }}>
                      {lang.label}
                    </span>
                    {formData.language === lang.code && (
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <path d="M5 13l4 4L19 7" stroke="#00A460" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right — Live Preview */}
        <div style={{ position: "sticky", top: "24px", alignSelf: "start" }}>
          {/* Preview Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
              <Text variant="bodySm" fontWeight="semibold">Live Preview</Text>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["Desktop", "Mobile"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setIsMobile(mode === "Mobile")}
                  style={{
                    padding: "4px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer",
                    border: "1px solid #e1e3e5",
                    backgroundColor: (isMobile ? "Mobile" : "Desktop") === mode ? "#f0fdf4" : "#fff",
                    color: (isMobile ? "Mobile" : "Desktop") === mode ? "#00A460" : "#6b7280",
                    fontWeight: (isMobile ? "Mobile" : "Desktop") === mode ? "600" : "400",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Browser mockup */}
          <div style={{
            width: isMobile ? "390px" : "100%",
            margin: "0 auto",
            border: "1px solid #e1e3e5",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#f9fafb",
            transition: "width 0.3s",
          }}>
            {/* Browser bar */}
            <div style={{ backgroundColor: "#f3f4f6", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #e1e3e5" }}>
              <div style={{ display: "flex", gap: "5px" }}>
                {["#ef4444", "#eab308", "#22c55e"].map((c) => (
                  <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: c }} />
                ))}
              </div>
              <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "4px", padding: "3px 10px", fontSize: "11px", color: "#9ca3af", textAlign: "center" }}>
                yourstore.myshopify.com
              </div>
            </div>

            {/* Fake store */}
            <div style={{ position: "relative", padding: "16px", minHeight: "420px" }}>
              {/* Fake nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontWeight: "700", fontSize: "13px" }}>✦ AuraStore</span>
                {!isMobile && (
                  <div style={{ display: "flex", gap: "16px" }}>
                    {["Shop", "Collections", "About"].map((l) => (
                      <span key={l} style={{ fontSize: "12px", color: "#6b7280" }}>{l}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* Hero */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>Premium Essentials</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Curated for modern living.</div>
              </div>

              {/* Chat widget */}
              <div style={{
                position: "absolute",
                bottom: "50px",
                right: "16px",
                width: isMobile ? "280px" : "300px",
                backgroundColor: "#fff",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}>
                {/* Chat header */}
                <div style={{ backgroundColor: formData.brandColor, padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Avatar */}
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: logoUrl ? "#f3f4f6" : selectedPreset.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: logoUrl ? "0" : "7px", boxSizing: "border-box", overflow: "hidden", flexShrink: 0 }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      : <div style={{ width: "100%", height: "100%" }}>{selectedPreset.icon}</div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{formData.botName}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>● Online · Typically instant</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", cursor: "pointer" }}>−</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", cursor: "pointer" }}>×</span>
                  </div>
                </div>

                {/* Chat body */}
                <div style={{ padding: "12px", backgroundColor: "#f9fafb", minHeight: "200px" }}>
                  {/* Welcome message bubble */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: selectedPreset.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "5px", boxSizing: "border-box", flexShrink: 0 }}>
                      {logoUrl
                        ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                        : selectedPreset.icon
                      }
                    </div>
                    <div style={{ backgroundColor: "#fff", borderRadius: "12px", borderTopLeftRadius: "4px", padding: "10px 12px", fontSize: "12px", color: "#111", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", maxWidth: "85%" }}>
                      {formData.welcomeMessage || `Hi! I'm ${formData.botName}, how can I help you?`}
                    </div>
                  </div>

                  {/* Starter prompts */}
                  {starterPrompts.length > 0 && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                      {starterPrompts.filter(p => p.trim()).map((prompt, i) => (
                        <div key={i} style={{ backgroundColor: "#fff", border: `1px solid ${formData.brandColor}`, borderRadius: "20px", padding: "5px 12px", fontSize: "11px", color: formData.brandColor, cursor: "pointer" }}>
                          {prompt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #e1e3e5", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fff" }}>
                  <div style={{ flex: 1, fontSize: "12px", color: "#9ca3af" }}>Message {formData.botName}...</div>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: formData.brandColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                      <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* FAB */}
              <div style={{ position: "absolute", bottom: "16px", right: "16px", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: formData.brandColor, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", cursor: "pointer" }}>
                {/* <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ bottom: "0", padding: "16px 24px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", zIndex: 10 }}>
        <button
          onClick={handleSave}
          disabled={fetcher.state !== "idle"}
          style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 16px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#374151" }}
        >
          🖫 {fetcher.state !== "idle" ? "Saving..." : "Save draft"}
        </button>
        <button
          onClick={() => fetcher.submit({
            intent: "saveAndContinue",
            ...formData,
            logoUrl: logoUrl || "",
            starterPrompts: JSON.stringify(starterPrompts),
          }, { method: "POST" })}
          style={{ backgroundColor: "#00A460", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
        >
          Continue →
        </button>
      </div>
    </AppProvider>
  );
}