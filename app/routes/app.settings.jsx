import { useLoaderData, useFetcher,data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState, useEffect } from "react";
import { AppProvider, Text, Banner } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

// 1. Reintroduced Presets
const PRESETS = [
  { id: "green", bg: "#22c55e", icon: <svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="15" r="7" fill="white" /><path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="white" /></svg> },
  { id: "blue", bg: "#3b82f6", icon: <svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2.5" /><circle cx="15" cy="17" r="2" fill="white" /><circle cx="25" cy="17" r="2" fill="white" /><path d="M13 24c1.5 3 12.5 3 14 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg> },
  { id: "yellow", bg: "#eab308", icon: <svg viewBox="0 0 40 40" fill="none"><path d="M20 5l3.9 8.26L33 14.6l-6.5 6.33 1.53 8.94L20 25.5l-8.03 4.37 1.53-8.94L7 14.6l9.1-1.34L20 5z" fill="white" /></svg> },
  { id: "pink", bg: "#ec4899", icon: <svg viewBox="0 0 40 40" fill="none"><path d="M20 34s-14-9.35-14-19a8 8 0 0116 0 8 8 0 0116 0c0 9.65-14 19-14 19z" fill="white" /></svg> },
  { id: "teal", bg: "#14b8a6", icon: <svg viewBox="0 0 40 40" fill="none"><rect x="10" y="14" width="20" height="16" rx="3" fill="white" /><rect x="15" y="19" width="4" height="4" rx="1" fill="#14b8a6" /><rect x="21" y="19" width="4" height="4" rx="1" fill="#14b8a6" /><path d="M20 8v6" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><circle cx="20" cy="7" r="2" fill="white" /><path d="M13 30v3M27 30v3" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg> },
  { id: "indigo", bg: "#6366f1", icon: <svg viewBox="0 0 40 40" fill="none"><path d="M8 20c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4 6 6 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg> },
  { id: "orange", bg: "#f97316", icon: <svg viewBox="0 0 40 40" fill="none"><path d="M20 7a11 11 0 00-11 11c0 4.5 2.5 8 6 10v4h10v-4c3.5-2 6-5.5 6-10A11 11 0 0020 7z" fill="white" /><circle cx="15" cy="18" r="2.5" fill="#f97316" /><circle cx="25" cy="18" r="2.5" fill="#f97316" /><path d="M17 30h6M17 33h6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" /></svg> },
];

const getBrandPresets = (themeColor) => [
  themeColor || "#00A460", "#6366f1", "#f97316", "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444", "#f43f5e", "#1f2937", "#0ea5e9",
];

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
  { code: "de", label: "German" }, { code: "pt", label: "Portuguese" }, { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" }, { code: "zh", label: "Chinese" }, { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" }, { code: "it", label: "Italian" }, { code: "nl", label: "Dutch" },
];

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const config = await db.chatbotConfig.findUnique({ 
    where: { shop: session.shop } 
  });

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

  await db.chatbotConfig.upsert({
    where: { shop: session.shop },
    update: {
      botName: formData.get("botName"),
      welcomeMessage: formData.get("welcomeMessage"),
      starterPrompts: formData.get("starterPrompts"),
      brandColor: formData.get("brandColor"),
      avatarPreset: formData.get("avatarPreset"),
      logoUrl: formData.get("logoUrl") || null,
      language: formData.get("language") || "en",
      capProducts: formData.get("capProducts") === "true",
      capOrderTracking: formData.get("capOrderTracking") === "true",
      capPolicies: formData.get("capPolicies") === "true",
      capFaqs: formData.get("capFaqs") === "true",
    },
    create: {
      shop: session.shop,
      botName: formData.get("botName") || "Aria",
      welcomeMessage: formData.get("welcomeMessage") || "",
      starterPrompts: formData.get("starterPrompts") || null,
      brandColor: formData.get("brandColor") || "#00A460",
      avatarPreset: formData.get("avatarPreset") || "green",
      logoUrl: formData.get("logoUrl") || null,
      language: formData.get("language") || "en",
      capProducts: formData.get("capProducts") === "true",
      capOrderTracking: formData.get("capOrderTracking") === "true",
      capPolicies: formData.get("capPolicies") === "true",
      capFaqs: formData.get("capFaqs") === "true",
    },
  });

  return data({ success: true });
};

export default function Settings() {
  const { config, themeColor: fetchedThemeColor } = useLoaderData();
  const fetcher = useFetcher();

  const [settings, setSettings] = useState({
    botName: config?.botName || "Aria",
    welcomeMessage: config?.welcomeMessage || "",
    brandColor: config?.brandColor || "#00A460",
    avatarPreset: config?.avatarPreset || "green",
    logoUrl: config?.logoUrl || "",
    language: config?.language || "en",
    capProducts: config?.capProducts ?? true,
    capOrderTracking: config?.capOrderTracking ?? true,
    capPolicies: config?.capPolicies ?? true,
    capFaqs: config?.capFaqs ?? true,
  });

  const [themeColor, setThemeColor] = useState("#00A460");
  const [logoError, setLogoError] = useState(null);

  const [starterPrompts, setStarterPrompts] = useState(
    config?.starterPrompts ? JSON.parse(config.starterPrompts) : ["Track my order"]
  );

  const addStarterPrompt = () => {
    if(starterPrompts.length >= 3) return;
    setStarterPrompts([...starterPrompts, ""]);
  };

  const updateStarterPrompt = (index,value) => {
    const updated = [...starterPrompts];
    updated[index] = value;
    setStarterPrompts(updated);
  };

  const removeStarterPrompt = (index) => {
    setStarterPrompts(starterPrompts.filter((_,i) => i!== index));
  };

  useEffect(() => {
    if (fetchedThemeColor) setThemeColor(fetchedThemeColor);
  }, [fetchedThemeColor]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLogoError("Only JPG, PNG, or WebP allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoError(null);
      updateSetting("logoUrl", ev.target.result);
      updateSetting("avatarPreset", ""); // Clear preset when custom logo uploaded
    };
    reader.readAsDataURL(file);
  };

const handleSave = () => {
    const payload = Object.fromEntries(
      Object.entries(settings).map(([k, v]) => [k, String(v)])
    );
    
    // Add the stringified prompts to the payload
    payload.starterPrompts = JSON.stringify(starterPrompts);

    fetcher.submit(payload, { method: "POST" });
  };

  const isSaving = fetcher.state !== "idle";
  const selectedPreset = PRESETS.find(p => p.id === settings.avatarPreset) || PRESETS[0];

  return (
    <AppProvider i18n={enTranslations}>
  <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh", padding: "32px 40px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#202223" }}>
    <div style={{ maxWidth: "1100px" }}>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", margin: "0 0 4px 0" }}>Chatbot Settings</h1>
        <p style={{ fontSize: "13px", color: "#6d7175", margin: 0 }}>Manage your AI persona, appearance, and core capabilities.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* LEFT COLUMN: Persona & Appearance */}
        <div style={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e3e5e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: "24px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 20px 0", color: "#6d7175" }}>Persona & Appearance</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "500" }}>Assistant Name</label>
                <input
                  type="text"
                  value={settings.botName}
                  onChange={(e) => updateSetting("botName", e.target.value)}
                  style={{ padding: "7px 12px", border: "1px solid #c9cccf", borderRadius: "4px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "500" }}>Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting("language", e.target.value)}
                  style={{ padding: "7px 12px", border: "1px solid #c9cccf", borderRadius: "4px", fontSize: "13px", outline: "none", backgroundColor: "#fff", width: "100%", boxSizing: "border-box" }}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500" }}>Welcome Message</label>
              <textarea
                value={settings.welcomeMessage}
                onChange={(e) => updateSetting("welcomeMessage", e.target.value)}
                rows="3"
                style={{ padding: "7px 12px", border: "1px solid #c9cccf", borderRadius: "4px", fontSize: "13px", outline: "none", resize: "vertical", minHeight: "70px", width: "100%", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>

            {/* Starter Prompts UI */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "16px", borderTop: "1px solid #ebebeb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "500", display: "block" }}>Starter Prompts</label>
                  <span style={{ fontSize: "12px", color: "#8c9196" }}>Suggested questions (Max 3)</span>
                </div>
                {starterPrompts.length < 3 && (
                  <button
                    onClick={addStarterPrompt}
                    style={{ background: "none", border: "none", color: "#202223", fontSize: "12px", fontWeight: "600", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                  >
                    + Add Prompt
                  </button>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {starterPrompts.map((prompt, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      value={prompt}
                      onChange={(e) => updateStarterPrompt(index, e.target.value)}
                      placeholder="e.g. What are your shipping options?"
                      style={{ flex: 1, padding: "7px 12px", border: "1px solid #c9cccf", borderRadius: "4px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                    <button
                      onClick={() => removeStarterPrompt(index)}
                      title="Remove prompt"
                      style={{ background: "none", border: "none", color: "#8c9196", cursor: "pointer", fontSize: "18px", padding: "0 4px", display: "flex", alignItems: "center" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "16px", borderTop: "1px solid #ebebeb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "13px", fontWeight: "500" }}>Brand Logo & Avatar</label>
                <input id="logo-upload" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleLogoUpload} />
                <button
                  onClick={() => document.getElementById("logo-upload").click()}
                  style={{ background: "none", border: "none", color: "#202223", fontSize: "12px", fontWeight: "600", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  Upload custom
                </button>
              </div>
              {logoError && <span style={{ color: "#d82c0d", fontSize: "12px" }}>{logoError}</span>}

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "6px", backgroundColor: settings.logoUrl ? "#f4f6f8" : selectedPreset.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #dfe3e8", flexShrink: 0 }}>
                  {settings.logoUrl ? <img src={settings.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : selectedPreset.icon}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => { updateSetting("avatarPreset", preset.id); updateSetting("logoUrl", ""); setLogoError(null); }}
                      style={{ width: "30px", height: "30px", borderRadius: "6px", backgroundColor: preset.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", outline: settings.avatarPreset === preset.id && !settings.logoUrl ? "2px solid #202223" : "1px solid #dfe3e8", outlineOffset: "2px", boxSizing: "border-box" }}
                    >
                      <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {preset.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "16px", borderTop: "1px solid #ebebeb" }}>
              <label style={{ fontSize: "13px", fontWeight: "500" }}>Brand Color</label>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                
                {/* Presets Group */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getBrandPresets(themeColor).slice(0, 6).map((color, i) => (
                    <div
                      key={i}
                      onClick={() => updateSetting("brandColor", color)}
                      style={{ width: "24px", height: "24px", borderRadius: "4px", backgroundColor: color, cursor: "pointer", outline: settings.brandColor === color ? "2px solid #202223" : "1px solid #dfe3e8", outlineOffset: "1px", boxSizing: "border-box" }}
                    />
                  ))}
                </div>

                {/* Custom Hex Input (Pushed to Right) */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #c9cccf", borderRadius: "6px", padding: "4px 8px", backgroundColor: "#fff" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "3px", backgroundColor: settings.brandColor, flexShrink: 0, border: "1px solid #dfe3e8" }} />
                  <input
                    value={settings.brandColor}
                    onChange={(e) => updateSetting("brandColor", e.target.value)}
                    style={{ border: "none", outline: "none", fontSize: "13px", width: "65px", background: "transparent", color: "#202223", fontFamily: "monospace" }}
                  />
                </div>
                
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Capabilities + Save */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e3e5e7", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: "24px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px 0", color: "#6d7175" }}>AI Capabilities</h2>
            <p style={{ fontSize: "13px", color: "#6d7175", margin: "0 0 16px 0" }}>Enable or disable specific features.</p>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { id: "capProducts", label: "Product Recommendations", desc: "Suggest products based on customer questions" },
                { id: "capOrderTracking", label: "Order Tracking", desc: "Let customers check order status via chat" },
                { id: "capPolicies", label: "Store Policies", desc: "Answer shipping, returns, and policy questions" },
                { id: "capFaqs", label: "Custom FAQs", desc: "Use your saved FAQ entries in responses" }
              ].map(({ id, label, desc }, index) => (
                <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: index !== 0 ? "1px solid #f1f2f3" : "none" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#202223" }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "#8c9196", marginTop: "2px" }}>{desc}</div>
                  </div>
                  <div
                    onClick={() => updateSetting(id, !settings[id])}
                    style={{ width: "36px", height: "20px", backgroundColor: settings[id] ? "#202223" : "#dfe3e8", borderRadius: "10px", position: "relative", cursor: "pointer", transition: "background-color 0.2s", flexShrink: 0 }}
                  >
                    <div style={{ width: "16px", height: "16px", backgroundColor: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: settings[id] ? "18px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "20px 24px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{ backgroundColor: "#202223", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
    </AppProvider>
  );
}