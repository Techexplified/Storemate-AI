import { useState, useEffect } from "react";
import { Text } from "@shopify/polaris";

export default function ChatbotIdentity({ formData, updateField, namesFetcher }) {
  const [suggestedNames, setSuggestedNames] = useState(["Aria", "Nova", "Sage", "Finn", "Luna", "Zara"]);

  useEffect(() => {
    if (namesFetcher.data?.names) setSuggestedNames(namesFetcher.data.names);
  }, [namesFetcher.data]);

  const fetchNames = () => namesFetcher.submit({ intent: "suggestNames" }, { method: "POST" });

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Text variant="headingSm" as="h2">1. Chatbot Identity</Text>
          <Text variant="bodySm" tone="subdued">Name and personality your customers will see</Text>
        </div>
        <span style={{ backgroundColor: "#e8f5e9", color: "#00A460", borderRadius: "20px", padding: "3px 10px", fontSize: "12px" }}>✦ AI-assisted</span>
      </div>

      <div style={{ marginTop: "16px" }}>
        <label style={{ fontSize: "13px", fontWeight: "500" }}>Assistant Name</label>
        <div style={{ position: "relative", marginTop: "6px" }}>
          <input
            value={formData.botName}
            onChange={(e) => updateField("botName", e.target.value)}
            maxLength={25}
            style={{ width: "100%", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 50px 8px 12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          />
          <button style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#00A460", fontSize: "13px", fontWeight: "500" }}>
            ✦ AI
          </button>
        </div>
        <Text variant="bodySm" tone="subdued">This name appears in the chat header and all messages</Text>
      </div>

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
  );
}