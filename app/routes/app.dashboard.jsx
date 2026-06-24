// app/routes/app.dashboard.jsx
import { data, redirect, useLoaderData, useSearchParams, useRevalidator, useNavigate, useSubmit, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState, useEffect } from "react";
import { AppProvider, Text, Banner } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

export const loader = async ({ request }) => {
    const { session, admin } = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "7d";

    const rangeMap = { "7d": 7, "1m": 30, "3m": 90 };
    const days = rangeMap[range] || 7;
    const since = new Date(Date.now() - days * 86400000);

    const [conversations, config, merchantConfig, faqs, policies] = await Promise.all([
        db.conversation.findMany({
            where: { shop, role: "user", createdAt: { gte: since } },
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
        db.chatbotConfig.findUnique({ where: { shop } }),
        db.merchantConfig.findUnique({ where: { shop } }),
        db.faq.findMany({ where: { shop }, orderBy: { createdAt: "asc" } }),
        db.policy.findMany({ where: { shop }, orderBy: { createdAt: "asc" } }),
    ]);

    // Most asked questions
    const freq = {};
    for (const { message } of conversations) {
        const key = message.toLowerCase().trim();
        freq[key] = (freq[key] || 0) + 1;
    }
    const topQuestions = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }));

    // Build the direct Deep-Link to the Shopify Theme Customizer app embeds tab
    const themeCustomizerUrl = `https://admin.shopify.com/store/${shop.split('.')[0]}/themes/current/editor?context=apps`;

    // Theme embed check
    let isEmbedded = false;
    try {
        const response = await admin.graphql(`
      query {
        currentAppInstallation {
          embeddedInStructure
        }
      }
    `);
        const resJson = await response.json();
        isEmbedded = resJson?.data?.currentAppInstallation?.embeddedInStructure ?? false;
    } catch (_) { }

    const supportLinksAdded = !!(merchantConfig?.supportEmail || merchantConfig?.supportUrl);

    return data({
        conversations,
        topQuestions,
        range,
        config,
        merchantConfig,
        faqs,
        policies,
        isEmbedded,
        supportLinksAdded,
        totalConversations: conversations.length,
        themeCustomizerUrl,
    });
};

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function getInitials(name) {
    if (!name || name === "Guest") return "G";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#7C3AED", "#0F6E56", "#185FA5", "#993C1D", "#854F0B", "#A32D2D", "#3B6D11"];
function avatarColor(name) {
    if (!name) return "#888";
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const fd = await request.formData();
    const intent = fd.get("intent");

    if (intent === "save-support") {
        await db.merchantConfig.upsert({
            where: { shop },
            update: {
                supportEmail: fd.get("supportEmail") || null,
                supportUrl: fd.get("supportUrl") || null,
            },
            create: {
                shop,
                supportEmail: fd.get("supportEmail") || null,
                supportUrl: fd.get("supportUrl") || null,
            },
        });
        return data({ ok: true });
    }

    if (intent === "add-faq") {
        const question = fd.get("question")?.toString().trim();
        const answer = fd.get("answer")?.toString().trim();
        if (question && answer) {
            await db.faq.create({ data: { shop, question, answer } });
        }
        return data({ ok: true });
    }

    if (intent === "delete-faq") {
        await db.faq.delete({ where: { id: fd.get("id").toString() } });
        return data({ ok: true });
    }

    if (intent === "add-policy") {
        const name = fd.get("name")?.toString().trim();
        const text = fd.get("text")?.toString().trim();
        if (name && text) {
            await db.policy.create({ data: { shop, name, text } });
        }
        return data({ ok: true });
    }

    if (intent === "delete-policy") {
        await db.policy.delete({ where: { id: fd.get("id").toString() } });
        return data({ ok: true });
    }

    return data({ ok: false });
};

export default function Dashboard() {
    const { conversations, topQuestions, range, config, merchantConfig, faqs, policies, isEmbedded, supportLinksAdded, totalConversations, themeCustomizerUrl } = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();
    const { revalidate } = useRevalidator();
    const navigate = useNavigate();
    const [showBanner, setShowBanner] = useState(false);

    const [activePanel, setActivePanel] = useState(null); // 'support' | 'faqs' | 'policies'
    const [supportEmail, setSupportEmail] = useState(merchantConfig?.supportEmail || "");
    const [supportUrl, setSupportUrl] = useState(merchantConfig?.supportUrl || "");
    const [faqQ, setFaqQ] = useState("");
    const [faqA, setFaqA] = useState("");
    const [policyName, setPolicyName] = useState("");
    const [policyText, setPolicyText] = useState("");
    const fetcher = useFetcher();

    // Show banner if not embedded — dismiss resets on every app open (no localStorage)
    useEffect(() => {
        if (!isEmbedded) setShowBanner(true);
    }, [isEmbedded]);

    const handleExport = () => {
        const rows = [
            ["Customer Name", "Email", "Query Preview", "Time"],
            ...conversations.map(c => [
                `"${(c.customerName || "Guest").replace(/"/g, '""')}"`,
                `"${(c.customerEmail || "—").replace(/"/g, '""')}"`,
                `"${(c.message || "").replace(/"/g, '""').slice(0, 100)}"`,
                new Date(c.createdAt).toLocaleString(),
            ])
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `conversations-${range}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Readiness checks
    const readiness = [
        {
            key: "support",
            label: "Support Links",
            done: supportLinksAdded,
            mandatory: true,
            disabled: false,
            onSetup: () => setActivePanel(activePanel === "support" ? null : "support"),
        },
        {
            key: "embed",
            label: "App Embedded",
            done: isEmbedded,
            mandatory: false,
            disabled: false,
            onSetup: () => window.open(themeCustomizerUrl, "_blank", "noopener,noreferrer"), // ← Clicking "Setup →" will now also launch the editor
        },
        {
            key: "faqs",
            label: "FAQs Added",
            done: faqs.length > 0,
            mandatory: false,
            disabled: !config?.capFaqs,
            onSetup: () => setActivePanel(activePanel === "faqs" ? null : "faqs"),
        },
        {
            key: "policies",
            label: "Policies Synced",
            done: policies.length > 0,
            mandatory: false,
            disabled: !config?.capPolicies,
            onSetup: () => setActivePanel(activePanel === "policies" ? null : "policies"),
        },
    ];
    const doneCount = readiness.filter(r => !r.disabled && r.done).length;
    const totalCount = readiness.filter(r => !r.disabled).length;
    const progressPct = Math.round((doneCount / totalCount) * 100);

    return (
        <AppProvider i18n={enTranslations}>
            <div className="dashboard-root">

                {/* HEADER */}
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title">Store Overview</h1>
                        <p className="dash-subtitle">Latest Customer interactions handled by AI.</p>
                    </div>
                    <div className="dash-header-actions">
                        <select
                            className="dash-select"
                            value={range}
                            onChange={e => setSearchParams({ range: e.target.value })}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="1m">Last 1 Month</option>
                            <option value="3m">Last 3 Months</option>
                        </select>
                        <button className="dash-btn" onClick={revalidate}>↻ Refresh</button>
                        <button className="dash-btn" onClick={handleExport}>↓ Export</button>
                    </div>
                </div>

                {/* EMBED BANNER */}
                {showBanner && (
                    <div className="embed-banner">
                        <div className="embed-banner-left">
                            <span className="embed-banner-icon">⬡</span>
                            <div>
                                <div className="embed-banner-title">
                                    Embed App to Your Theme
                                    <span className="embed-banner-badge">Setup Required</span>
                                </div>
                                <div className="embed-banner-desc">
                                    Your StoreMate AI chatbot hasn't been embedded yet. Customers can't see it until you add the app block to your active theme.
                                </div>
                            </div>
                        </div>
                        <div className="embed-banner-actions">
                            <button className="embed-btn-primary"
                                onClick={() => window.open(themeCustomizerUrl, "_blank", "noopener,noreferrer")}
                            >⬡ Go to Theme Editor ↗</button>
                            {/* <button className="embed-btn-secondary">View Setup Guide</button> */}
                            <button className="embed-banner-close" onClick={() => setShowBanner(false)}>✕</button>
                        </div>
                    </div>
                )}

                {/* RECENT CONVERSATIONS */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <div>
                            <div className="dash-card-title">Recent Conversations</div>
                            <div className="dash-card-subtitle">Latest customer interactions handled by your AI</div>
                        </div>
                    </div>

                    {conversations.length === 0 ? (
                        <div className="dash-empty">No conversations yet in this period.</div>
                    ) : (
                        <table className="conv-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Query Preview</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conversations.slice(0, 10).map(c => {
                                    const isEscalated =
                                        (merchantConfig?.supportEmail && c.message?.toLowerCase().includes(merchantConfig.supportEmail.toLowerCase())) ||
                                        (merchantConfig?.supportUrl && c.message?.toLowerCase().includes(merchantConfig.supportUrl.toLowerCase()));

                                    return (
                                        <tr key={c.id}>
                                            <td>
                                                <div className="conv-customer">
                                                    <div
                                                        className="conv-avatar"
                                                        style={{ background: avatarColor(c.customerName) }}
                                                    >
                                                        {getInitials(c.customerName)}
                                                    </div>
                                                    <div>
                                                        <div className="conv-name">{c.customerName || "Guest"}</div>
                                                        <div className="conv-email">{c.customerEmail || "—"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="conv-query">
                                                {(c.message || "").slice(0, 80)}{c.message?.length > 80 ? "…" : ""}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${isEscalated ? "escalated" : "resolved"}`}>
                                                    {isEscalated ? "Escalated" : "Resolved"}
                                                </span>
                                            </td>
                                            <td className="conv-time">{timeAgo(c.createdAt)}</td>
                                            <td>
                                                <button
                                                    className="conv-view-btn"
                                                    onClick={() => navigate(`/app/conversation/${c.sessionId}`)}
                                                >
                                                    View ↗
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {conversations.length > 10 && (
                        <div className="dash-table-footer">
                            Showing 10 of {conversations.length} conversations
                        </div>
                    )}
                </div>

                {/* BOTTOM ROW */}
                <div className="dash-bottom-row">
                    {/* Most Asked — unchanged */}
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <div className="dash-card-title">Most Asked Questions</div>
                            <span className="dash-card-badge">This week</span>
                        </div>
                        {topQuestions.length === 0 ? (
                            <div className="dash-empty">No data yet.</div>
                        ) : (
                            <ol className="faq-list">
                                {topQuestions.map((q, i) => (
                                    <li key={i} className="faq-item">
                                        <span className="faq-num">{i + 1}</span>
                                        <span className="faq-msg">{q.message.slice(0, 60)}{q.message.length > 60 ? "…" : ""}</span>
                                        <span className="faq-count">{q.count}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* STORE READINESS */}
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <div className="dash-card-title">Store Readiness</div>
                            <span className="readiness-pct">{progressPct}%</span>
                        </div>
                        <div className="readiness-bar-track">
                            <div className="readiness-bar-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <ul className="readiness-list">
                            {readiness.map(r => (
                                <li key={r.key} className={`readiness-item${r.disabled ? " readiness-disabled" : ""}`}>
                                    <span className={`readiness-icon ${r.done && !r.disabled ? "readiness-done" : "readiness-todo"}`}>
                                        {r.done && !r.disabled ? "✓" : "○"}
                                    </span>
                                    <span className="readiness-label">
                                        {r.label}
                                        {r.mandatory && <span className="readiness-mandatory">*</span>}
                                    </span>
                                    {!r.disabled && (
                                        r.onSetup
                                            ? <button className={`readiness-status-btn ${r.done ? "status-done" : ""}`} onClick={r.onSetup}>
                                                {activePanel === r.key ? "Close ✕" : r.done ? "Manage ✓" : "Setup →"}
                                            </button>
                                            : <span className={`readiness-status ${r.done ? "status-done" : "status-setup"}`}>
                                                {r.done ? "Done" : "Setup"}
                                            </span>
                                    )}
                                    {r.disabled && <span className="readiness-status status-disabled">Disabled</span>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="dash-card">
                        <div className="dash-card-title" style={{ marginBottom: 12 }}>Quick Actions</div>
                        <div className="quick-actions">
                            <button className="qa-btn" onClick={() => navigate("/app?mode=edit")}>✎ Customize Chatbot</button>
                            <button className="qa-btn" onClick={() => {
                                fetcher.submit({}, { method: "POST", action: "/api/sync" });
                                revalidate();
                            }}>
                                {fetcher.state === "submitting" ? "Syncing..." : "↻ Sync Products"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* SETUP PANELS */}
                <div className={`setup-panel-wrap ${activePanel ? "panel-open" : ""}`}>

                    {/* SUPPORT LINKS */}
                    {activePanel === "support" && (
                        <div className="setup-panel">
                            <div className="setup-panel-header">
                                <div>
                                    <div className="setup-panel-title">Support Links</div>
                                    <div className="setup-panel-desc">Shown to customers when the AI can't resolve their issue.</div>
                                </div>
                                <button className="setup-panel-close" onClick={() => setActivePanel(null)}>✕</button>
                            </div>
                            <div className="setup-fields">
                                <div className="setup-field">
                                    <label className="setup-label">Support Email</label>
                                    <input
                                        className="setup-input"
                                        type="email"
                                        placeholder="support@yourstore.com"
                                        value={supportEmail}
                                        onChange={e => setSupportEmail(e.target.value)}
                                    />
                                </div>
                                <div className="setup-field">
                                    <label className="setup-label">Support URL</label>
                                    <input
                                        className="setup-input"
                                        type="url"
                                        placeholder="https://yourstore.com/support"
                                        value={supportUrl}
                                        onChange={e => setSupportUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="setup-actions">
                                <button className="setup-save-btn" onClick={() => {
                                    fetcher.submit(
                                        { intent: "save-support", supportEmail, supportUrl },
                                        { method: "POST" }
                                    );
                                }}>Save</button>
                                <button className="setup-cancel-btn" onClick={() => setActivePanel(null)}>Close</button>
                            </div>
                        </div>
                    )}

                    {/* FAQs */}
                    {activePanel === "faqs" && (
                        <div className="setup-panel">
                            <div className="setup-panel-header">
                                <div>
                                    <div className="setup-panel-title">FAQs</div>
                                    <div className="setup-panel-desc">Your AI will use these to answer common questions.</div>
                                </div>
                                <button className="setup-panel-close" onClick={() => setActivePanel(null)}>✕</button>
                            </div>
                            <div className="setup-fields">
                                <div className="setup-field">
                                    <label className="setup-label">Question</label>
                                    <input
                                        className="setup-input"
                                        placeholder="e.g. Do you offer free shipping?"
                                        value={faqQ}
                                        onChange={e => setFaqQ(e.target.value)}
                                    />
                                </div>
                                <div className="setup-field">
                                    <label className="setup-label">Answer <span className="setup-hint">(max 500 chars)</span></label>
                                    <textarea
                                        className="setup-input setup-textarea"
                                        placeholder="e.g. Yes, we offer free shipping on orders over $50."
                                        maxLength={500}
                                        value={faqA}
                                        onChange={e => setFaqA(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="setup-actions">
                                <button className="setup-save-btn" onClick={() => {
                                    if (!faqQ.trim() || !faqA.trim()) return;
                                    fetcher.submit(
                                        { intent: "add-faq", question: faqQ, answer: faqA },
                                        { method: "POST" }
                                    );
                                    setFaqQ("");
                                    setFaqA("");
                                }}>Add FAQ</button>
                                <button className="setup-cancel-btn" onClick={() => setActivePanel(null)}>Close</button>
                            </div>

                            {/* Existing FAQs */}
                            {faqs.length > 0 && (
                                <div className="existing-list">
                                    <div className="existing-list-title">Added FAQs</div>
                                    {faqs.map(f => (
                                        <div key={f.id} className="existing-item">
                                            <div className="existing-item-content">
                                                <div className="existing-item-q">{f.question}</div>
                                                <div className="existing-item-a">{f.answer}</div>
                                            </div>
                                            <button className="existing-delete-btn" onClick={() =>
                                                fetcher.submit({ intent: "delete-faq", id: f.id }, { method: "POST" })
                                            }>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* POLICIES */}
                    {activePanel === "policies" && (
                        <div className="setup-panel">
                            <div className="setup-panel-header">
                                <div>
                                    <div className="setup-panel-title">Store Policies</div>
                                    <div className="setup-panel-desc">Your AI will reference these for shipping, returns, and other policy questions.</div>
                                </div>
                                <button className="setup-panel-close" onClick={() => setActivePanel(null)}>✕</button>
                            </div>
                            <div className="setup-fields">
                                <div className="setup-field">
                                    <label className="setup-label">Policy Name</label>
                                    <input
                                        className="setup-input"
                                        placeholder="e.g. Return Policy"
                                        value={policyName}
                                        onChange={e => setPolicyName(e.target.value)}
                                    />
                                </div>
                                <div className="setup-field">
                                    <label className="setup-label">Policy Text</label>
                                    <textarea
                                        className="setup-input setup-textarea"
                                        placeholder="e.g. We accept returns within 30 days of purchase..."
                                        value={policyText}
                                        onChange={e => setPolicyText(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="setup-actions">
                                <button className="setup-save-btn" onClick={() => {
                                    if (!policyName.trim() || !policyText.trim()) return;
                                    fetcher.submit(
                                        { intent: "add-policy", name: policyName, text: policyText },
                                        { method: "POST" }
                                    );
                                    setPolicyName("");
                                    setPolicyText("");
                                }}>Add Policy</button>
                                <button className="setup-cancel-btn" onClick={() => setActivePanel(null)}>Close</button>
                            </div>

                            {policies.length > 0 && (
                                <div className="existing-list">
                                    <div className="existing-list-title">Added Policies</div>
                                    {policies.map(p => (
                                        <div key={p.id} className="existing-item">
                                            <div className="existing-item-content">
                                                <div className="existing-item-q">{p.name}</div>
                                                <div className="existing-item-a">{p.text.slice(0, 120)}{p.text.length > 120 ? "…" : ""}</div>
                                            </div>
                                            <button className="existing-delete-btn" onClick={() =>
                                                fetcher.submit({ intent: "delete-policy", id: p.id }, { method: "POST" })
                                            }>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .dashboard-root {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* HEADER */
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .dash-title {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 2px;
          color: #1a1a1a;
        }
        .dash-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .dash-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .dash-select {
          height: 34px;
          padding: 0 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          background: #fff;
          cursor: pointer;
        }
        .dash-btn {
          height: 34px;
          padding: 0 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          background: #fff;
          cursor: pointer;
          white-space: nowrap;
        }
        .dash-btn:hover { background: #f9fafb; }

        /* EMBED BANNER */
        .embed-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 20px;
          gap: 12px;
        }
        .embed-banner-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
        .embed-banner-icon { font-size: 20px; margin-top: 2px; }
        .embed-banner-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .embed-banner-badge {
          font-size: 11px;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
          border-radius: 4px;
          padding: 1px 6px;
          font-weight: 500;
        }
        .embed-banner-desc { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .embed-banner-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .embed-btn-primary {
          background: #00A460;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 7px 14px;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }
        .embed-btn-secondary {
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 7px 14px;
          font-size: 13px;
          cursor: pointer;
        }
        .embed-banner-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #9ca3af;
          padding: 4px;
          line-height: 1;
        }

        /* CARDS */
        .dash-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .dash-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .dash-card-title { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
        .dash-card-subtitle { font-size: 12px; color: #9ca3af; }
        .dash-card-badge {
          font-size: 11px;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 4px;
          padding: 2px 8px;
        }
        .dash-empty { font-size: 13px; color: #9ca3af; padding: 20px 0; text-align: center; }

        /* CONVERSATIONS TABLE */
        .conv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .conv-table th {
          text-align: left;
          font-weight: 500;
          color: #6b7280;
          font-size: 12px;
          padding: 0 12px 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .conv-table td {
          padding: 12px 12px 12px 0;
          border-bottom: 1px solid #f9fafb;
          vertical-align: middle;
        }
        .conv-table tr:last-child td { border-bottom: none; }
        .conv-customer { display: flex; align-items: center; gap: 10px; }
        .conv-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
        }
        .conv-name { font-weight: 500; color: #1a1a1a; }
        .conv-email { font-size: 11px; color: #9ca3af; }
        .conv-query { color: #374151; max-width: 320px; }
        .conv-time { color: #9ca3af; white-space: nowrap; }
        .conv-view-btn {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 5px;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
          color: #374151;
          white-space: nowrap;
        }
        .conv-view-btn:hover { background: #f9fafb; }
        .dash-table-footer {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 12px;
          text-align: right;
        }

        /* BOTTOM ROW */
        .dash-bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        .dash-bottom-row .dash-card { margin-bottom: 0; }

        /* MOST ASKED */
        .faq-list { list-style: none; padding: 0; margin: 0; }
        .faq-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .faq-item:last-child { border-bottom: none; }
        .faq-num {
          width: 22px;
          height: 22px;
          background: #e8f5e9;
          color: #00A460;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .faq-msg { flex: 1; font-size: 13px; color: #374151; }
        .faq-count {
          font-size: 12px;
          font-weight: 600;
          color: #00A460;
          background: #e8f5e9;
          border-radius: 4px;
          padding: 2px 7px;
        }

        /* READINESS */
        .readiness-pct { font-size: 15px; font-weight: 600; color: #00A460; }
        .readiness-bar-track {
          height: 4px;
          background: #f3f4f6;
          border-radius: 2px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .readiness-bar-fill {
          height: 100%;
          background: #00A460;
          border-radius: 2px;
          transition: width 0.3s;
        }
        .readiness-list { list-style: none; padding: 0; margin: 0; }
        .readiness-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
        }
        .readiness-item:last-child { border-bottom: none; }
        .readiness-disabled { opacity: 0.4; }
        .readiness-icon { font-size: 14px; width: 18px; text-align: center; }
        .readiness-done { color: #00A460; }
        .readiness-todo { color: #d1d5db; }
        .readiness-label { flex: 1; color: #374151; }
        .readiness-mandatory { color: #ef4444; margin-left: 2px; }
        .readiness-status {
          font-size: 11px;
          border-radius: 4px;
          padding: 2px 8px;
          font-weight: 500;
        }
        .status-done { background: #e8f5e9; color: #00A460; }
        .status-setup { background: #fef3c7; color: #92400e; }
        .status-disabled { background: #f3f4f6; color: #9ca3af; }

        /* QUICK ACTIONS */
        .quick-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .qa-btn {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          background: #fff;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          color: #374151;
        }
        .qa-btn:hover { background: #f9fafb; }

        /* SETUP PANEL */
.setup-panel-wrap {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease;
}
.setup-panel-wrap.panel-open {
  max-height: 800px;
}
.setup-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-top: 16px;
}
.setup-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.setup-panel-title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.setup-panel-desc { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.setup-panel-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #9ca3af;
}
.setup-fields { display: flex; gap: 12px; margin-bottom: 16px; }
.setup-field { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.setup-label { font-size: 12px; font-weight: 500; color: #374151; }
.setup-hint { font-weight: 400; color: #9ca3af; }
.setup-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}
.setup-input:focus { outline: none; border-color: #00A460; }
.setup-textarea {
  height: 80px;
  padding: 8px 10px;
  resize: vertical;
}
.setup-actions { display: flex; gap: 8px; margin-bottom: 20px; }
.setup-save-btn {
  background: #00A460;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 13px;
  cursor: pointer;
}
.setup-save-btn:hover { background: #008f54; }
.setup-cancel-btn {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 13px;
  cursor: pointer;
}
.setup-cancel-btn:hover { background: #f9fafb; }

/* EXISTING ITEMS */
.existing-list { border-top: 1px solid #f3f4f6; padding-top: 16px; }
.existing-list-title { font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 10px; }
.existing-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  margin-bottom: 8px;
}
.existing-item-content { flex: 1; }
.existing-item-q { font-size: 13px; font-weight: 500; color: #1a1a1a; margin-bottom: 2px; }
.existing-item-a { font-size: 12px; color: #6b7280; }
.existing-delete-btn {
  background: none;
  border: none;
  color: #d1d5db;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  flex-shrink: 0;
}
.existing-delete-btn:hover { color: #ef4444; }

.readiness-status-btn {
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
  background: #fef3c7;
  color: #92400e;
  border: none;
  cursor: pointer;
}
.readiness-status-btn:hover { background: #fde68a; }

.status-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
}
.status-pill.resolved {
  background: #e8f5e9;
  color: #00A460;
}
.status-pill.escalated {
  background: #ffebe9;
  color: #cc1f1f;
}
      `}</style>
        </AppProvider>
    );
}