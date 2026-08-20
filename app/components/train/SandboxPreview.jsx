import { useState } from "react";
import {
  User, Smile, Meh, Frown, Laugh, ThumbsUp, Star, Heart, Flame,
  Gift, PartyPopper, Rocket, Zap, Bot, Brain, Sparkles, MessageCircle,
  Headphones, Gamepad2, Bell, Megaphone, Send, Ghost, Crown,
  Moon, Sun, Flower2, Leaf, Flag
} from "lucide-react";

const LUCIDE_ICONS = {
  user: User, smile: Smile, meh: Meh, frown: Frown, laugh: Laugh,
  thumbsUp: ThumbsUp, star: Star, heart: Heart, flame: Flame,
  gift: Gift, partyPopper: PartyPopper, rocket: Rocket, zap: Zap,
  bot: Bot, brain: Brain, sparkles: Sparkles, messageCircle: MessageCircle,
  headphones: Headphones, gamepad2: Gamepad2, bell: Bell, megaphone: Megaphone,
  send: Send, ghost: Ghost, crown: Crown, moon: Moon, sun: Sun,
  flower2: Flower2, leaf: Leaf, flag: Flag,
};

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
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4-6 6 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
    )
  },
  {
    id: "orange", bg: "#f97316", icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7a11 11 0 00-11 11c0 4.5 2.5 8 6 10v4h10v-4c3.5-2 6-5.5 6-10A11 11 0 0020 7z" fill="white" /><circle cx="15" cy="18" r="2.5" fill="#f97316" /><circle cx="25" cy="18" r="2.5" fill="#f97316" /><path d="M17 30h6M17 33h6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" /></svg>
    )
  },
];

// Helper to render preset, custom lucide icon, or logo image
function renderAvatarContent(avatarPreset, logoUrl, size = 20) {
  if (logoUrl) {
    return {
      bg: "#f3f4f6",
      element: (
        <img
          src={logoUrl}
          alt="Avatar"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ),
    };
  }

  const raw = avatarPreset || "green";
  if (raw.startsWith("custom:")) {
    const [, iconKey, bgColor] = raw.split(":");
    const IconComp = LUCIDE_ICONS[iconKey] || User;
    return {
      bg: bgColor || "#6366f1",
      element: <IconComp size={size} color="#ffffff" strokeWidth={2} />,
    };
  }

  const matched = PRESETS.find((p) => p.id === raw) || PRESETS[0];
  return {
    bg: matched.bg,
    element: matched.icon,
  };
}

// Helper to parse URLs in string and return clickable React <a> elements
const renderFormattedMessage = (text) => {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "inherit",
            textDecoration: "underline",
            fontWeight: "600",
            wordBreak: "break-all",
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function SandboxPreview({ config, faqs }) {
  const brandColor = config?.brandColor || "#00A460";
  const botName = config?.botName || "Aria";
  
  const avatar = renderAvatarContent(config?.avatarPreset, config?.logoUrl, 20);

  let starterPrompts = [];
  try {
    starterPrompts = typeof config.starterPrompts === "string"
      ? JSON.parse(config.starterPrompts)
      : (config.starterPrompts || []);
  } catch (e) { }

  const [activeTab, setActiveTab] = useState("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", content: config?.welcomeMessage || `Hi, ${botName} here!` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [openFaqId, setOpenFaqId] = useState(null);

  const activeFaqs = (faqs || []).filter((f) => !f._deleted);

  const handleSend = async (textOverride) => {
    const userMsg = typeof textOverride === "string" ? textOverride : input.trim();
    if (!userMsg) return;

    const updatedMessages = [...messages, { role: "user", content: userMsg }];

    setInput("");
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: config?.shop,
          messages: updatedMessages
            .filter((m, i) => !(i === 0 && m.role === "bot"))
            .map((m) => ({
              role: m.role === "bot" ? "assistant" : m.role,
              content: m.content,
            })),
          sessionId: "sandbox-preview",
          isPreview: true,
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data.detail ?? data.error ?? data.reply ?? "Something went wrong." }
      ]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "I'm temporarily unavailable." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "600px",
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      border: "1px solid #e1e3e5",
      overflow: "hidden",
      position: "sticky",
      top: "32px",
    }}>
      {/* Widget Header */}
      <div style={{ padding: "12px 14px", background: brandColor, color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: avatar.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          padding: config?.logoUrl ? "0" : (config?.avatarPreset?.startsWith("custom:") ? "0" : "6px"),
          boxSizing: "border-box"
        }}>
          {avatar.element}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: "600" }}>{botName} Sandbox</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>● Testing Mode</div>
        </div>
      </div>

      {/* Widget Tabs */}
      <div style={{ display: "flex", background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
        <div
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "8px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: activeTab === "chat" ? "600" : "500",
            color: activeTab === "chat" ? brandColor : "#6b7280",
            borderBottom: `2px solid ${activeTab === "chat" ? brandColor : "transparent"}`,
            background: activeTab === "chat" ? "white" : "transparent",
          }}
        >
          Chat
        </div>
        {config.capFaqs && (
          <div
            onClick={() => setActiveTab("faq")}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: activeTab === "faq" ? "600" : "500",
              color: activeTab === "faq" ? brandColor : "#6b7280",
              borderBottom: `2px solid ${activeTab === "faq" ? brandColor : "transparent"}`,
              background: activeTab === "faq" ? "white" : "transparent",
            }}
          >
            FAQs
          </div>
        )}
        {config.capOrderTracking && (
          <div
            onClick={() => setActiveTab("track")}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: activeTab === "track" ? "600" : "500",
              color: activeTab === "track" ? brandColor : "#6b7280",
              borderBottom: `2px solid ${activeTab === "track" ? brandColor : "transparent"}`,
              background: activeTab === "track" ? "white" : "transparent",
            }}
          >
            Track
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <div style={{ flex: 1, display: activeTab === "chat" ? "flex" : "none", flexDirection: "column", background: "#f9fafb", overflowY: "auto" }}>
        <div style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                marginBottom: "10px",
                maxWidth: "85%",
                padding: "10px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                lineHeight: "1.4",
                wordBreak: "break-word",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                background: m.role === "user" ? brandColor : "white",
                color: m.role === "user" ? "white" : "#111",
                marginLeft: m.role === "user" ? "auto" : "0",
                marginRight: m.role === "user" ? "0" : "auto",
                borderTopRightRadius: m.role === "user" ? "4px" : "12px",
                borderTopLeftRadius: m.role === "bot" ? "4px" : "12px",
                border: m.role === "bot" ? "1px solid #e5e7eb" : "none",
              }}
            >
              {renderFormattedMessage(m.content)}
            </div>
          ))}
          {isLoading && (
            <div style={{ fontStyle: "italic", color: "#9ca3af", padding: "4px 12px", fontSize: "12px" }}>
              {botName} is thinking...
            </div>
          )}

          {/* Starter Prompts */}
          {starterPrompts.length > 0 && messages.length === 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", marginTop: "5px" }}>
              {starterPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  style={{
                    background: "white",
                    border: `1px solid ${brandColor}`,
                    borderRadius: "20px",
                    padding: "5px 12px",
                    fontSize: "11px",
                    color: brandColor,
                    cursor: "pointer",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ display: "flex", padding: "10px 12px", borderTop: "1px solid #e1e3e5", background: "white", alignItems: "center", gap: "8px" }}>
          <input
            type="text"
            placeholder={`Message ${botName}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            style={{ flex: 1, padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: "20px", outline: "none", fontSize: "12px", color: "#111" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: brandColor,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: isLoading || !input.trim() ? 0.5 : 1,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* FAQ Panel */}
      <div style={{ flex: 1, display: activeTab === "faq" ? "block" : "none", overflowY: "auto", padding: "0", background: "#f4f4f5" }}>
        {activeFaqs.length === 0 ? (
          <div style={{ color: "#71717a", textAlign: "center", marginTop: "24px", fontSize: "13px" }}>
            No FAQs available at the moment.
          </div>
        ) : (
          activeFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div key={faq.id} style={{ borderBottom: "1px solid #e4e4e7", background: "#f4f4f5" }}>
                <div
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  style={{
                    fontWeight: "600",
                    padding: "18px 20px",
                    fontSize: "14px",
                    color: "#09090b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    userSelect: "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ececee")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f4f4f5")}
                >
                  <span style={{
                    fontSize: "20px",
                    lineHeight: "1",
                    fontWeight: "300",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#18181b",
                  }}>
                    {isOpen ? "—" : "+"}
                  </span>
                  <span>{faq.question}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.3s ease",
                }}>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ padding: "0 20px 20px 54px", fontSize: "13.5px", color: "#27272a", lineHeight: "1.6", fontWeight: "400" }}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Track Panel */}
      <div style={{ flex: 1, display: activeTab === "track" ? "block" : "none", padding: "16px", background: "#f9fafb" }}>
        <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px 0", textAlign: "center" }}>
            Enter your details to get your latest order status.
          </p>
          <input
            type="text"
            placeholder="Order number (e.g. #1020)"
            style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px", outline: "none" }}
          />
          <input
            type="email"
            placeholder="Email used at checkout"
            style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px", outline: "none" }}
          />
          <button style={{ width: "100%", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", background: brandColor, color: "white" }}>
            Track Order (Disabled in Sandbox)
          </button>
        </div>
      </div>
    </div>
  );
}