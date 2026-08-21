import { useState, useEffect } from "react";
import { data, useLoaderData, useFetcher, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { BookOpen, MessageSquare, ChevronRight, Truck } from "lucide-react";

import KbTab from "../components/train/Kbtab";
import FaqTab from "../components/train/FaqTab";
import SandboxPreview from "../components/train/SandboxPreview";
import TrackOrderTab from "../components/train/TrackOrderTab";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [merchantConfig, policies, faqs, chatbotConfig] = await Promise.all([
    db.merchantConfig.findUnique({ where: { shop } }),
    db.policy.findMany({ where: { shop }, orderBy: { createdAt: "asc" } }),
    db.faq.findMany({ where: { shop }, orderBy: { createdAt: "asc" } }),
    db.chatbotConfig.findUnique({ where: { shop } }),
  ]);

  return data({
    supportUrl: merchantConfig?.supportUrl ?? "",
    policies,
    faqs,
    trackConfig: chatbotConfig?.orderTrackingConfig || null,
    chatbotConfig: chatbotConfig || {
      botName: "Aria",
      brandColor: "#00A460",
      capFaqs: true,
      capPolicies: true,
      capOrderTracking: true,
    },
  });
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "train-save") {
    const payload = JSON.parse(formData.get("payload"));

    await db.$transaction(async (tx) => {
      if (payload.supportUrl !== undefined) {
        await tx.merchantConfig.upsert({
          where: { shop },
          update: { supportUrl: payload.supportUrl },
          create: { shop, supportUrl: payload.supportUrl },
        });
      }

      if (payload.customInstructions !== undefined) {
        await tx.chatbotConfig.upsert({
          where: { shop },
          update: { customInstructions: payload.customInstructions },
          create: { shop, botName: "Aria", customInstructions: payload.customInstructions },
        });
      }

      // Policies
      for (const p of payload.policies ?? []) {
        if (p._deleted && typeof p.id === "string" && !p.id.startsWith("temp-")) {
          await tx.policy.delete({ where: { id: p.id } });
        } else if (typeof p.id === "string" && !p.id.startsWith("temp-")) {
          await tx.policy.update({ where: { id: p.id }, data: { name: p.name, text: p.text } });
        } else if (!p._deleted) {
          await tx.policy.create({ data: { shop, name: p.name, text: p.text } });
        }
      }

      // Track Order Config
      if (payload.trackConfig !== undefined) {
        await tx.chatbotConfig.upsert({
          where: { shop },
          update: { orderTrackingConfig: payload.trackConfig },
          create: { shop, botName: "Aria", orderTrackingConfig: payload.trackConfig },
        });
      }

      // FAQs (Now with category & isActive)
      for (const f of payload.faqs ?? []) {
        const faqPayload = {
          question: f.question,
          answer: f.answer,
          category: f.category || "General",
          isActive: f.isActive !== false,
        };

        if (f._deleted && typeof f.id === "string" && !f.id.startsWith("temp-")) {
          await tx.faq.delete({ where: { id: f.id } });
        } else if (typeof f.id === "string" && !f.id.startsWith("temp-")) {
          await tx.faq.update({ where: { id: f.id }, data: faqPayload });
        } else if (!f._deleted) {
          await tx.faq.create({ data: { shop, ...faqPayload } });
        }
      }
    });

    return data({ success: true });
  }

  return data({ success: false }, { status: 400 });
}

export default function TrainPage() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "menu";

  const [supportUrl, setSupportUrl] = useState(loaderData.supportUrl);
  const [customInstructions, setCustomInstructions] = useState(loaderData.chatbotConfig?.customInstructions || "");
  const [policies, setPolicies] = useState(loaderData.policies);
  const [faqs, setFaqs] = useState(loaderData.faqs);
  const [trackConfig, setTrackConfig] = useState(loaderData.trackConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const config = loaderData.chatbotConfig;

  useEffect(() => {
    setSupportUrl(loaderData.supportUrl);
    setCustomInstructions(loaderData.chatbotConfig?.customInstructions || "");
    setPolicies(loaderData.policies);
    setFaqs(loaderData.faqs);
    setTrackConfig(loaderData.trackConfig);
    setIsDirty(false);
  }, [loaderData]);

  const handleSave = () => {
    const payload = { supportUrl, customInstructions, policies, faqs, trackConfig };
    fetcher.submit({ intent: "train-save", payload: JSON.stringify(payload) }, { method: "post" });
  };

  const setTab = (tab) => {
    if (tab === "faqs" && !config.capFaqs) {
      handleDisabledAction("FAQs are disabled. Please enable them in Chatbot Settings to use this feature.");
      return;
    }
    setSearchParams({ tab }, { preventScrollReset: true });
  };

  const handleDisabledAction = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(""), 4000);
  };

  const activePoliciesCount = policies.filter((p) => !p._deleted).length;
  const activeFaqsCount = faqs.filter((f) => !f._deleted && f.isActive !== false).length;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#0f172a" }}>
      {/* Top Header */}
      {currentTab === "menu" && (
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px", margin: "0 0 8px 0" }}>
            Train Your AI
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Teach {config.botName} about your store so it can answer customers accurately.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "32px", alignItems: "start" }}>
        {/* LEFT COLUMN: Master Menu OR Detail Editor */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {currentTab === "menu" ? (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 4px 0", color: "#0f172a" }}>
                  What should {config.botName} learn?
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Complete each section to build a smarter assistant.
                </p>
              </div>

              <div style={{ position: "relative", paddingLeft: "44px" }}>
                <div style={{ position: "absolute", left: "15px", top: "30px", bottom: "60px", width: "2px", background: "#f1f5f9", zIndex: 0 }} />

                {/* 1. Knowledge Base Card */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: "-44px", top: "24px", width: "32px", height: "32px", borderRadius: "50%",
                    background: "#fff", border: "2px solid #e9d5ff", color: "#a855f7",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "14px", zIndex: 2
                  }}>
                    1
                  </div>

                  <div
                    onClick={() => setTab("kb")}
                    style={{ display: "flex", alignItems: "center", padding: "20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)")}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#f3e8ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "16px" }}>
                      <BookOpen size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>Knowledge Base</h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
                        Add and manage important information about your store, products, policies and more.
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: "16px" }}>
                      <span style={{ padding: "4px 10px", background: "#f3e8ff", color: "#8b5cf6", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                        {activePoliciesCount} policies
                      </span>
                    </div>
                    <div style={{ color: "#cbd5e1", marginLeft: "16px" }}>
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>

                {/* 2. FAQs Card */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: "-44px", top: "24px", width: "32px", height: "32px", borderRadius: "50%",
                    background: "#fff", border: `2px solid ${config.capFaqs ? "#bfdbfe" : "#e2e8f0"}`, color: config.capFaqs ? "#3b82f6" : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "14px", zIndex: 2
                  }}>
                    2
                  </div>

                  <div
                    onClick={() => setTab("faqs")}
                    style={{
                      display: "flex", alignItems: "center", padding: "20px", background: "#fff", border: "1px solid #e2e8f0",
                      borderRadius: "12px", cursor: config.capFaqs ? "pointer" : "not-allowed", transition: "all 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)", opacity: config.capFaqs ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => { if (config.capFaqs) e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
                    onMouseLeave={(e) => { if (config.capFaqs) e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)"; }}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: config.capFaqs ? "#eff6ff" : "#f1f5f9", color: config.capFaqs ? "#3b82f6" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "16px" }}>
                      <MessageSquare size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>
                        FAQs {!config.capFaqs && "(Disabled)"}
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
                        Add frequently asked questions and accurate answers for your customers.
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: "16px" }}>
                      {config.capFaqs ? (
                        <span style={{ padding: "4px 10px", background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                          {activeFaqsCount} active
                        </span>
                      ) : (
                        <span style={{ padding: "4px 10px", background: "#f1f5f9", color: "#64748b", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#cbd5e1", marginLeft: "16px" }}>
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>

                {/* 3. Track Order Card */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: "-44px", top: "24px", width: "32px", height: "32px", borderRadius: "50%",
                    background: "#fff", border: "2px solid #d1fae5", color: "#10b981",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "14px", zIndex: 2
                  }}>
                    3
                  </div>

                  <div
                    onClick={() => setTab("track-order")}
                    style={{
                      display: "flex", alignItems: "center", padding: "20px", background: "#fff", border: "1px solid #e2e8f0",
                      borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)")}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: "16px" }}>
                      <Truck size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>Track Order</h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
                        Customize how customers can track their orders and what details to collect.
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: "16px" }}>
                      <span style={{ padding: "4px 10px", background: trackConfig ? "#ecfdf5" : "#f1f5f9", color: trackConfig ? "#10b981" : "#64748b", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                        {trackConfig ? "Completed" : "Not configured"}
                      </span>
                    </div>
                    <div style={{ color: "#cbd5e1", marginLeft: "16px" }}>
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {currentTab === "kb" && (
                <KbTab
                  supportUrl={supportUrl}
                  setSupportUrl={(val) => { setSupportUrl(val); setIsDirty(true); }}
                  customInstructions={customInstructions}
                  setCustomInstructions={(val) => { setCustomInstructions(val); setIsDirty(true); }}
                  policies={policies}
                  setPolicies={(val) => { setPolicies(val); setIsDirty(true); }}
                  config={config}
                  onDisabled={handleDisabledAction}
                  isDirty={isDirty}
                  onBack={() => setTab("menu")}
                />
              )}
              {currentTab === "faqs" && (
                <FaqTab
                  faqs={faqs}
                  setFaqs={(val) => { setFaqs(val); setIsDirty(true); }}
                  onBack={() => setTab("menu")}
                />
              )}
              {currentTab === "track-order" && (
                <TrackOrderTab
                  trackConfig={trackConfig}
                  setTrackConfig={(val) => { setTrackConfig(val); setIsDirty(true); }}
                  onBack={() => setTab("menu")}
                />
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <SandboxPreview config={config} faqs={faqs} trackConfig={trackConfig} />
      </div>

      {/* Floating Save Bar */}
      <div style={{ position: "fixed", bottom: isDirty || alertMsg ? "24px" : "-100px", left: "50%", transform: "translateX(-50%)", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", background: alertMsg ? "#ef4444" : "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(8px)", color: "#fff", padding: "16px 24px", borderRadius: "100px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>{alertMsg ? "Feature Disabled" : "Unsaved Changes"}</span>
            <span style={{ fontSize: "12px", color: alertMsg ? "#fecaca" : "#94a3b8" }}>{alertMsg || "Publish updates to your live AI widget."}</span>
          </div>
          {!alertMsg && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  setSupportUrl(loaderData.supportUrl);
                  setCustomInstructions(loaderData.chatbotConfig?.customInstructions || "");
                  setPolicies(loaderData.policies);
                  setFaqs(loaderData.faqs);
                  setTrackConfig(loaderData.trackConfig);
                  setIsDirty(false);
                }}
                style={{ background: "transparent", border: "none", color: "#cbd5e1", fontSize: "14px", fontWeight: "500", cursor: "pointer", padding: "8px 12px" }}
              >
                Discard
              </button>
              <button onClick={handleSave} disabled={fetcher.state !== "idle"} style={{ background: "#fff", color: "#0f172a", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                {fetcher.state === "submitting" ? "Saving..." : "Publish to Store"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}