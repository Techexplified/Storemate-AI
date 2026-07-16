import { useLoaderData, useFetcher, useNavigate, redirect, data } from "react-router";
import { authenticate } from "../shopify.server";
import { AppProvider, Text, Banner } from "@shopify/polaris";
import db from "../db.server";
import { useState } from "react";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

const ICONS = {
    capProducts: (
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00A460" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        </div>
    ),
    capOrderTracking: (
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00A460" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <path d="M16 8h4l3 5v3h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
        </div>
    ),
    capPolicies: (
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00A460" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
            </svg>
        </div>
    ),
    capFaqs: (
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00A460" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                <path d="M9 10h.01M12 10c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3" />
            </svg>
        </div>
    ),
};


const CAPABILITIES = [
    {
        key: "capProducts",
        title: "Product Recommendations",
        description: "AI suggests relevant products based on customer queries and context.",
        bottomLeft: "Revenue driver", // placeholder
        icon: "capProducts",
    },
    {
        key: "capOrderTracking",
        title: "Order Tracking",
        description: "Customers check delivery status get live updates and view tracking links.",
        bottomLeft: "Most requested", // placeholder
        icon: "capOrderTracking",
    },
    {
        key: "capPolicies",
        title: "Store Policies",
        description: "AI answers shipping, returns and refund questions from your uploaded policies.",
        bottomLeft: "Reduces tickets", // placeholder
        icon: "capPolicies",
    },
    {
        key: "capFaqs",
        title: "FAQs",
        description: "AI answers from custom Q&A pairs you configure in the dashboard.",
        bottomLeft: "Instant answers", // placeholder
        icon: "capFaqs",
    },
];

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const config = await db.chatbotConfig.findUnique({ where: { shop: session.shop } });

    const url = new URL(request.url);
    if (config && url.searchParams.get("mode") !== "edit") return redirect("/app/dashboard");

    return data({ config });
};

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    // 1. Gather all the capability values from the page
    const capabilityData = {
        capProducts: formData.get("capProducts") === "true",
        capOrderTracking: formData.get("capOrderTracking") === "true",
        capPolicies: formData.get("capPolicies") === "true",
        capFaqs: formData.get("capFaqs") === "true",
    };

    // 2. Run the upsert with the capability data
    await db.chatbotConfig.upsert({
        where: { shop: session.shop },
        update: capabilityData,
        create: {
            shop: session.shop,
            ...capabilityData,
        },
    });

    // 3. Handle the final step vs draft routing
    if (intent === "finish") {
        // Mark onboarding complete and redirect to dashboard securely
        await db.chatbotConfig.update({
            where: { shop: session.shop },
            data: { setupComplete: true }
        });
        return redirect("/app/dashboard");
    }

    // Otherwise, they clicked Save Draft: keep them right here
    return redirect("/app/capabilities?mode=edit");
};

export default function Capabilities() {
    const { config } = useLoaderData();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [selected, setSelected] = useState({
        capProducts: config?.capProducts ?? true,
        capOrderTracking: config?.capOrderTracking ?? true,
        capPolicies: config?.capPolicies ?? true,
        capFaqs: config?.capFaqs ?? true,
    });

    const toggle = (key) => setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleSave = (andContinue = false) => {
        fetcher.submit(
            {
                ...Object.fromEntries(Object.entries(selected).map(([k, v]) => [k, String(v)])),
                intent: andContinue ? "finish" : "draft",
            },
            { method: "POST" }
        );
        // don't navigate here — let the server's redirect (in the action) handle it
    };

    const enabledCount = Object.values(selected).filter(Boolean).length;

    return (
        <AppProvider i18n={enTranslations}>
        <div style={{ minHeight: "100vh", background: "#f6f6f7", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
                <div style={{ display: "inline-block", backgroundColor: "#e8f5e9", color: "#00A460", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>
                    Step 2 - AI Capabilities
                </div>
                <Text variant="headingXl" as="h1">Enable chatbot capabilities</Text>
                <Text variant="bodyMd" tone="subdued">
                    Select what your AI assistant can handle. Enable multiple to build a fully capable storefront bot.
                </Text>
            </div>

            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", maxWidth: "960px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
                {CAPABILITIES.map(({ key, title, description, bottomLeft, icon }) => {
                    const active = selected[key];
                    return (
                        <div
                            key={key}
                            onClick={() => toggle(key)}
                            style={{
                                background: "#fff",
                                border: `2px solid ${active ? "#00A460" : "#e5e7eb"}`,
                                borderRadius: "12px",
                                padding: "16px",
                                cursor: "pointer",
                                position: "relative",
                                transition: "border-color 0.15s",
                                minHeight: "160px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}
                        >
                            {/* Top row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                {ICONS[icon]}
                                {/* Radio-style toggle */}
                                <div style={{
                                    width: "20px", height: "20px", borderRadius: "50%",
                                    border: `2px solid ${active ? "#00A460" : "#d1d5db"}`,
                                    background: active ? "#00A460" : "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    {active && (
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Title + description */}
                            <div style={{ margin: "12px 0 8px" }}>
                                <p style={{ fontWeight: "600", fontSize: "14px", color: "#111827", margin: "0 0 4px" }}>{title}</p>
                                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, lineHeight: "1.5" }}>{description}</p>
                            </div>

                            {/* Bottom row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{
                                    fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px",
                                    background: "#dcfce7",
                                    color: "#16a34a",
                                }}>
                                    {bottomLeft}
                                </span>
                                <span style={{
                                    fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px",
                                    background: active ? "#dcfce7" : "#f3f4f6",
                                    color: active ? "#16a34a" : "#9ca3af",
                                }}>
                                    {active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Footer */}
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                    {enabledCount > 0
                        ? `✓ Setup complete — ${enabledCount} ${enabledCount === 1 ? "capability" : "capabilities"} enabled`
                        : "Select at least one capability to continue"}
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={() => navigate("/app")}
                        style={{ border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 16px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#374151" }}
                    >
                        ← Back
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={fetcher.state !== "idle"}
                        style={{ border: "1px solid #e1e3e5", borderRadius: "8px", padding: "8px 16px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#374151" }}
                    >
                        🖫 {fetcher.state !== "idle" ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={enabledCount === 0}
                        style={{ backgroundColor: enabledCount === 0 ? "#9ca3af" : "#00A460", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: enabledCount === 0 ? "not-allowed" : "pointer" }}
                    >
                        Finish →
                    </button>
                </div>
            </div>
        </div>
        </AppProvider>
    );
}