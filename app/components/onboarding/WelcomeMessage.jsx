import { useEffect } from "react";
import { Text } from "@shopify/polaris";

export default function WelcomeMessage({ formData, updateField, templateFetcher, starterPrompts, setStarterPrompts }) {
  useEffect(() => {
    if (templateFetcher.data?.welcomeMessage) {
      updateField("welcomeMessage", templateFetcher.data.welcomeMessage);
    }
  }, [templateFetcher.data]);

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

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px" }}>
      <div>
        <Text variant="headingSm" as="h2">3. Welcome Message</Text>
        <Text variant="bodySm" tone="subdued">First thing customers see when they open the chat</Text>
      </div>

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
            onFocus={(e) => (e.target.style.borderColor = "#00A460")}
            onBlur={(e) => (e.target.style.borderColor = "#e1e3e5")}
          />
          <div style={{ position: "absolute", bottom: "8px", right: "10px", fontSize: "11px", color: "#9ca3af" }}>
            {formData.welcomeMessage.length} / 300
          </div>
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="bodySm" tone="subdued">Starter prompts shown to customers</Text>
          {starterPrompts.length < 3 && (
            <button onClick={addStarterPrompt} style={{ background: "none", border: "none", color: "#00A460", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
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
              <button onClick={() => removeStarterPrompt(index)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}