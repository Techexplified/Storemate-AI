import { useState, useRef, useEffect } from "react";
import { Text } from "@shopify/polaris";
import { X, Palette } from "lucide-react";

// Restored all 12 original languages
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

const BRAND_PRESETS = [
  "#00A460", "#6366f1", "#f97316", "#ec4899", "#14b8a6",
  "#8b5cf6", "#ef4444", "#f43f5e", "#1f2937"
];

export default function BrandStyling({ formData, updateField }) {
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [WheelComponent, setWheelComponent] = useState(null);
  const popupRef = useRef(null);

  const isPreset = BRAND_PRESETS.includes(formData.brandColor);

  // Dynamically load the Wheel module only on client-side
  useEffect(() => {
    import("@uiw/react-color")
      .then((mod) => {
        setWheelComponent(() => mod.Wheel || mod.default);
      })
      .catch((err) => {
        console.error("Failed to load color wheel:", err);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowColorPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      
      {/* Brand Color Section */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "20px", position: "relative" }} ref={popupRef}>
        <Text variant="headingSm" as="h2">4. Brand Color</Text>
        <Text variant="bodySm" tone="subdued">Used in chat widget buttons and accents</Text>

        <div style={{ marginTop: "14px" }}>
          <Text variant="bodySm" tone="subdued">Preset colors</Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 36px)", gap: "10px", marginTop: "10px" }}>
            {BRAND_PRESETS.map((color) => (
              <div
                key={color}
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

            <div
              onClick={() => setShowColorPopup(!showColorPopup)}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                backgroundColor: "#f9fafb", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px dashed #d1d5db", fontSize: "18px", color: "#9ca3af",
                outline: !isPreset ? "3px solid #00A460" : "3px solid transparent",
                outlineOffset: "2px",
              }}
            >
              +
            </div>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <Text variant="bodySm" tone="subdued">Custom color</Text>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "6px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: formData.brandColor, flexShrink: 0 }} />
              <input
                value={formData.brandColor}
                onChange={(e) => updateField("brandColor", e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", fontFamily: "monospace" }}
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowColorPopup(!showColorPopup)}
              title="Open Color Wheel"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                borderRadius: "4px",
                transition: "color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#111827";
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#6b7280";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Palette size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Circular Color Wheel Popup */}
        {showColorPopup && (
          <div style={{
            position: "absolute",
            top: "20px",
            left: "100%",
            marginLeft: "12px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: "1px solid #e1e3e5",
            zIndex: 50,
            padding: "16px",
            width: "max-content"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <Text variant="bodyMd" fontWeight="semibold">Color Wheel</Text>
              <button onClick={() => setShowColorPopup(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", minWidth: "150px", minHeight: "150px" }}>
              {WheelComponent ? (
                <WheelComponent
                  color={formData.brandColor}
                  onChange={(color) => updateField("brandColor", color.hex)}
                />
              ) : (
                <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center" }}>Loading picker...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Language Section */}
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
  );
}