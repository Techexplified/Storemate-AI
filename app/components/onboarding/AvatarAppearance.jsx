import { useState, useRef, useEffect } from "react";
import { Text, Banner } from "@shopify/polaris";
import {
  Smile, Frown, Meh, Laugh, ThumbsUp, Star, Heart, Flame,
  Gift, PartyPopper, Rocket, Zap, Bot, Brain, Sparkles,
  MessageCircle, Headphones, Gamepad2, Bell, Megaphone,
  Send, Ghost, Eye, Crown, Moon, Sun, Flower2, Leaf, Flag,
  User, ZoomIn, Upload, X, Palette
} from "lucide-react";

export const ICON_LIST = [
  { id: "user", component: User }, { id: "smile", component: Smile }, { id: "meh", component: Meh },
  { id: "frown", component: Frown }, { id: "laugh", component: Laugh }, { id: "thumbsUp", component: ThumbsUp },
  { id: "star", component: Star }, { id: "heart", component: Heart }, { id: "flame", component: Flame },
  { id: "gift", component: Gift }, { id: "partyPopper", component: PartyPopper }, { id: "rocket", component: Rocket },
  { id: "zap", component: Zap }, { id: "bot", component: Bot }, { id: "brain", component: Brain },
  { id: "sparkles", component: Sparkles }, { id: "messageCircle", component: MessageCircle }, { id: "headphones", component: Headphones },
  { id: "gamepad2", component: Gamepad2 }, { id: "bell", component: Bell }, { id: "megaphone", component: Megaphone },
  { id: "send", component: Send }, { id: "ghost", component: Ghost }, { id: "crown", component: Crown },
  { id: "moon", component: Moon }, { id: "sun", component: Sun }, { id: "flower2", component: Flower2 },
  { id: "leaf", component: Leaf }, { id: "flag", component: Flag },
];

export const PRESET_SWATCHES = ["#22c55e", "#3b82f6", "#6366f1", "#f97316", "#ec4899", "#14b8a6", "#eab308", "#8b5cf6"];

export const PRESETS = [
  { id: "green", bg: "#22c55e", icon: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="7" fill="white" /><path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="white" /></svg> },
  { id: "blue", bg: "#3b82f6", icon: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2.5" /><circle cx="15" cy="17" r="2" fill="white" /><circle cx="25" cy="17" r="2" fill="white" /><path d="M13 24c1.5 3 12.5 3 14 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg> },
  { id: "yellow", bg: "#eab308", icon: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5l3.9 8.26L33 14.6l-6.5 6.33 1.53 8.94L20 25.5l-8.03 4.37 1.53-8.94L7 14.6l9.1-1.34L20 5z" fill="white" /></svg> },
  { id: "pink", bg: "#ec4899", icon: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 34s-14-9.35-14-19a8 8 0 0116 0 8 8 0 0116 0c0 9.65-14 19-14 19z" fill="white" /></svg> },
  { id: "teal", bg: "#14b8a6", icon: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="20" height="16" rx="3" fill="white" /><rect x="15" y="19" width="4" height="4" rx="1" fill="#14b8a6" /><rect x="21" y="19" width="4" height="4" rx="1" fill="#14b8a6" /><path d="M20 8v6" stroke="white" strokeWidth="2.5" strokeLinecap="round" /><circle cx="20" cy="7" r="2" fill="white" /><path d="M13 30v3M27 30v3" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg> },
  { id: "indigo", bg: "#6366f1", icon: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4-6 6 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg> },
  { id: "orange", bg: "#f97316", icon: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7a11 11 0 00-11 11c0 4.5 2.5 8 6 10v4h10v-4c3.5-2 6-5.5 6-10A11 11 0 0020 7z" fill="white" /><circle cx="15" cy="18" r="2.5" fill="#f97316" /><circle cx="25" cy="18" r="2.5" fill="#f97316" /><path d="M17 30h6M17 33h6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" /></svg> },
];

export const parseAvatarPreset = (presetString) => {
  if (presetString && presetString.startsWith("custom:")) {
    const [, icon, bg] = presetString.split(":");
    return { isCustom: true, icon: icon || "user", bg: bg || "#6366f1" };
  }
  const found = PRESETS.find((p) => p.id === presetString);
  return {
    isCustom: false,
    preset: found || PRESETS[0],
    bg: found?.bg || PRESETS[0].bg,
  };
};

export const renderIcon = (iconName, size = 24, color = "#ffffff") => {
  const item = ICON_LIST.find((i) => i.id === iconName);
  const IconComp = item ? item.component : User;
  return <IconComp size={size} color={color} strokeWidth={2.2} />;
};

export default function AvatarAppearance({ formData, updateField, logoUrl, setLogoUrl }) {
  const [logoError, setLogoError] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [modalTab, setModalTab] = useState("colors");
  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [avatarScale, setAvatarScale] = useState(1);

  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  const parsed = parseAvatarPreset(formData.avatarPreset);
  const customBg = parsed.isCustom ? parsed.bg : "#6366f1";
  const customIcon = parsed.isCustom ? parsed.icon : "user";

  const handleCustomChange = (newIcon, newBg) => {
    updateField("avatarPreset", `custom:${newIcon}:${newBg}`);
    setLogoUrl(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowPreviewMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLogoError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoError(null);
      setLogoUrl(ev.target.result);
      updateField("avatarPreset", "custom_upload");
      setShowPreviewMenu(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "24px", position: "relative" }}>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleLogoUpload} />

      <div>
        <Text variant="headingSm" as="h2">2. Avatar & Appearance</Text>
        <Text variant="bodySm" tone="subdued">Choose how your assistant presents itself visually</Text>
      </div>

      {logoError && (
        <div style={{ marginTop: "12px" }}>
          <Banner tone="critical" onDismiss={() => setLogoError(null)}>{logoError}</Banner>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginTop: "20px", alignItems: "start" }}>
        <div>
          <Text variant="bodySm" tone="subdued">Preset Avatars</Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 52px)", gap: "12px", marginTop: "12px" }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => { updateField("avatarPreset", preset.id); setLogoUrl(null); }}
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: preset.bg,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px",
                  boxSizing: "border-box",
                  outline: formData.avatarPreset === preset.id && !logoUrl ? "3px solid #00A460" : "3px solid transparent",
                  outlineOffset: "2px",
                }}
              >
                {preset.icon}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                if (!parsed.isCustom) handleCustomChange("user", "#6366f1");
                setShowCustomModal(true);
              }}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: parsed.isCustom && !logoUrl ? customBg : "#f9fafb",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #d1d5db",
                outline: parsed.isCustom && !logoUrl ? "3px solid #00A460" : "none",
                outlineOffset: "2px",
              }}
            >
              {parsed.isCustom && !logoUrl ? renderIcon(customIcon, 22) : <span style={{ fontSize: "24px", color: "#9ca3af" }}>+</span>}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }} ref={menuRef}>
          <Text variant="bodySm" tone="subdued">Preview</Text>
          <div
            onClick={() => setShowPreviewMenu(!showPreviewMenu)}
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "50%",
              backgroundColor: logoUrl ? "#f3f4f6" : parsed.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "10px",
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              padding: logoUrl || parsed.isCustom ? "0" : "16px",
              boxSizing: "border-box",
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${avatarScale})` }} />
            ) : parsed.isCustom ? (
              <div style={{ transform: `scale(${avatarScale})` }}>{renderIcon(customIcon, 36)}</div>
            ) : (
              <div style={{ width: "100%", height: "100%", transform: `scale(${avatarScale})` }}>{parsed.preset?.icon}</div>
            )}
          </div>
          <div style={{ marginTop: "8px", fontWeight: "600", fontSize: "14px", color: "#111" }}>{formData.botName}</div>

          {showPreviewMenu && (
            <div style={{ position: "absolute", top: "20px", right: "10px", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", width: "140px", zIndex: 20, padding: "4px 0" }}>
              <button onClick={() => { setShowViewModal(true); setShowPreviewMenu(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}><Eye size={15} /> View</button>
              <button onClick={() => { setShowResizeModal(true); setShowPreviewMenu(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}><ZoomIn size={15} /> Resize</button>
              <button onClick={() => fileInputRef.current.click()} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}><Upload size={15} /> Upload</button>
            </div>
          )}
        </div>
      </div>

      {showCustomModal && (
        <div style={{ marginTop: "20px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <button type="button" onClick={() => setModalTab("colors")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", paddingBottom: "6px", cursor: "pointer", fontSize: "13px", fontWeight: modalTab === "colors" ? "600" : "400", color: modalTab === "colors" ? "#00A460" : "#6b7280", borderBottom: modalTab === "colors" ? "2px solid #00A460" : "none" }}><Palette size={16} /> Colors</button>
              <button type="button" onClick={() => setModalTab("icons")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", paddingBottom: "6px", cursor: "pointer", fontSize: "13px", fontWeight: modalTab === "icons" ? "600" : "400", color: modalTab === "icons" ? "#00A460" : "#6b7280", borderBottom: modalTab === "icons" ? "2px solid #00A460" : "none" }}><Smile size={16} /> Icons</button>
            </div>
            <button type="button" onClick={() => setShowCustomModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={18} /></button>
          </div>

          {modalTab === "colors" && (
            <div style={{ marginTop: "16px" }}>
              <Text variant="bodySm" tone="subdued">Preset Colors</Text>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                {PRESET_SWATCHES.map((color) => (
                  <div
                    key={color}
                    onClick={() => handleCustomChange(customIcon, color)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: color,
                      cursor: "pointer",
                      outline: customBg === color ? "2px solid #000" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
              <div style={{ marginTop: "16px" }}>
                <Text variant="bodySm" tone="subdued">Pick Any Color</Text>
                <input
                  type="color"
                  value={customBg}
                  onChange={(e) => handleCustomChange(customIcon, e.target.value)}
                  style={{ marginTop: "8px", width: "48px", height: "36px", border: "none", cursor: "pointer" }}
                />
              </div>
            </div>
          )}

          {modalTab === "icons" && (
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "10px", maxHeight: "180px", overflowY: "auto", padding: "4px" }}>
              {ICON_LIST.map(({ id, component: Comp }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleCustomChange(id, customBg)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: customIcon === id ? "1.5px solid #00A460" : "1px solid #e5e7eb",
                    backgroundColor: customIcon === id ? "#f0fdf4" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Comp size={18} color={customIcon === id ? "#00A460" : "#374151"} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showViewModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "16px", textAlign: "center", minWidth: "260px" }}>
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: logoUrl ? "#f3f4f6" : parsed.bg, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: logoUrl || parsed.isCustom ? "0" : "20px", boxSizing: "border-box" }}>
              {logoUrl ? <img src={logoUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${avatarScale})` }} /> : parsed.isCustom ? <div style={{ transform: `scale(${avatarScale})` }}>{renderIcon(customIcon, 56)}</div> : <div style={{ width: "100%", height: "100%", transform: `scale(${avatarScale})` }}>{parsed.preset?.icon}</div>}
            </div>
            <button onClick={() => setShowViewModal(false)} style={{ marginTop: "16px", padding: "6px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {showResizeModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", minWidth: "280px" }}>
            <Text variant="headingSm" as="h3">Resize Avatar</Text>
            <div style={{ margin: "20px 0" }}>
              <input type="range" min="0.6" max="1.6" step="0.1" value={avatarScale} onChange={(e) => setAvatarScale(parseFloat(e.target.value))} style={{ width: "100%" }} />
              <div style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{Math.round(avatarScale * 100)}%</div>
            </div>
            <button onClick={() => setShowResizeModal(false)} style={{ width: "100%", backgroundColor: "#00A460", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer" }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}