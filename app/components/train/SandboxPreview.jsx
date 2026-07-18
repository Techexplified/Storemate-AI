import { useState } from "react";


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

export default function SandboxPreview({ config, faqs }) {
    const brandColor = config?.brandColor || "#00A460";
    const botName = config?.botName || "Aria";
    const preset = PRESETS.find(
        p => p.id === (config?.avatarPreset || "green")
    );

    const icon = preset?.icon;
    let starterPrompts = [];
    try { starterPrompts = typeof config.starterPrompts === 'string' ? JSON.parse(config.starterPrompts) : (config.starterPrompts || []); } catch (e) { }

    const [activeTab, setActiveTab] = useState('chat');
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([{ role: "bot", content: config?.welcomeMessage || `Hi, ${botName} here!` }]);
    const [isLoading, setIsLoading] = useState(false);
    const [openFaqId, setOpenFaqId] = useState(null);

    const activeFaqs = (faqs || []).filter(f => !f._deleted);

    const handleSend = async (textOverride) => {
        const userMsg = typeof textOverride === 'string' ? textOverride : input.trim();
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
                    // Filter out the initial welcome message so the AI gets a 'user' message first
                    messages: updatedMessages
                        .filter((m, i) => !(i === 0 && m.role === "bot"))
                        .map(m => ({
                            role: m.role === "bot" ? "assistant" : m.role,
                            content: m.content
                        })),
                    sessionId: "sandbox-preview",
                    isPreview: true
                })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: "bot", content: data.detail ?? data.error ?? data.reply ?? "Something went wrong." }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", content: "I'm temporarily unavailable." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e1e3e5', overflow: 'hidden', position: 'sticky', top: '32px' }}>

            {/* Widget Header */}
            <div style={{ padding: '12px 14px', background: brandColor, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {config?.logoUrl ? (
                        <img src={config.logoUrl} alt={botName} />
                    ) : (
                        icon
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{botName} Sandbox</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>● Testing Mode</div>
                </div>
            </div>

            {/* Widget Tabs */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <div onClick={() => setActiveTab('chat')} style={{ flex: 1, textAlign: 'center', padding: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: activeTab === 'chat' ? '600' : '500', color: activeTab === 'chat' ? brandColor : '#6b7280', borderBottom: `2px solid ${activeTab === 'chat' ? brandColor : 'transparent'}`, background: activeTab === 'chat' ? 'white' : 'transparent' }}>Chat</div>
                {config.capFaqs && <div onClick={() => setActiveTab('faq')} style={{ flex: 1, textAlign: 'center', padding: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: activeTab === 'faq' ? '600' : '500', color: activeTab === 'faq' ? brandColor : '#6b7280', borderBottom: `2px solid ${activeTab === 'faq' ? brandColor : 'transparent'}`, background: activeTab === 'faq' ? 'white' : 'transparent' }}>FAQs</div>}
                {config.capOrderTracking && <div onClick={() => setActiveTab('track')} style={{ flex: 1, textAlign: 'center', padding: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: activeTab === 'track' ? '600' : '500', color: activeTab === 'track' ? brandColor : '#6b7280', borderBottom: `2px solid ${activeTab === 'track' ? brandColor : 'transparent'}`, background: activeTab === 'track' ? 'white' : 'transparent' }}>Track</div>}
            </div>

            {/* Chat Panel */}
            <div style={{ flex: 1, display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column', background: '#f9fafb', overflowY: 'auto' }}>
                <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{ marginBottom: '10px', maxWidth: '85%', padding: '10px 12px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.4', wordBreak: 'break-word', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', background: m.role === 'user' ? brandColor : 'white', color: m.role === 'user' ? 'white' : '#111', marginLeft: m.role === 'user' ? 'auto' : '0', marginRight: m.role === 'user' ? '0' : 'auto', borderTopRightRadius: m.role === 'user' ? '4px' : '12px', borderTopLeftRadius: m.role === 'bot' ? '4px' : '12px', border: m.role === 'bot' ? '1px solid #e5e7eb' : 'none' }}>
                            {m.content}
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ fontStyle: 'italic', color: '#9ca3af', padding: '4px 12px', fontSize: '12px' }}>{botName} is thinking...</div>
                    )}

                    {/* Starter Prompts */}
                    {starterPrompts.length > 0 && messages.length === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginTop: '5px' }}>
                            {starterPrompts.map((prompt, i) => (
                                <button key={i} onClick={() => handleSend(prompt)} style={{ background: 'white', border: `1px solid ${brandColor}`, borderRadius: '20px', padding: '5px 12px', fontSize: '11px', color: brandColor, cursor: 'pointer' }}>{prompt}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{ display: 'flex', padding: '10px 12px', borderTop: '1px solid #e1e3e5', background: 'white', alignItems: 'center', gap: '8px' }}>
                    <input type="text" placeholder={`Message ${botName}...`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '20px', outline: 'none', fontSize: '12px', color: '#111' }} />
                    <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} style={{ width: '28px', height: '28px', borderRadius: '50%', background: brandColor, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (isLoading || !input.trim()) ? 0.5 : 1 }}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            </div>

            {/* FAQ Panel */}
            <div style={{ flex: 1, display: activeTab === 'faq' ? 'block' : 'none', overflowY: 'auto', padding: '12px', background: '#f9fafb' }}>
                {activeFaqs.length === 0 ? (
                    <div style={{ color: '#8e8e93', textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>No FAQs available at the moment.</div>
                ) : (
                    activeFaqs.map(faq => (
                        <div key={faq.id} style={{ background: 'white', marginBottom: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <div onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)} style={{ fontWeight: '600', padding: '10px 12px', fontSize: '12px', color: '#111', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {faq.question}
                                <span style={{ fontSize: '12px', color: '#9ca3af', transform: openFaqId === faq.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                            </div>
                            {openFaqId === faq.id && (
                                <div style={{ padding: '10px 12px', fontSize: '12px', color: '#4b5563', borderTop: '1px solid #f3f4f6', background: '#fafafa', lineHeight: '1.4' }}>{faq.answer}</div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Track Panel */}
            <div style={{ flex: 1, display: activeTab === 'track' ? 'block' : 'none', padding: '16px', background: '#f9fafb' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0', textAlign: 'center' }}>Enter your details to get your latest order status.</p>
                    <input type="text" placeholder="Order number (e.g. #1020)" style={{ width: '100%', padding: '10px 12px', marginBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
                    <input type="email" placeholder="Email used at checkout" style={{ width: '100%', padding: '10px 12px', marginBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }} />
                    <button style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: brandColor, color: 'white' }}>Track Order (Disabled in Sandbox)</button>
                </div>
            </div>

        </div>
    );
}