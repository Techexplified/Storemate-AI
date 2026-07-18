import { useState, useEffect } from "react";
import { data, useLoaderData, useFetcher, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

import KbTab from "../components/train/KbTab";
import FaqTab from "../components/train/FaqTab";
import SandboxPreview from "../components/train/SandboxPreview";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [merchantConfig, policies, faqs, chatbotConfig] = await Promise.all([
    db.merchantConfig.findUnique({ where: { shop } }),
    db.policy.findMany({ where: { shop }, orderBy: { createdAt: "asc" } }),
    db.faq.findMany({ where: { shop }, orderBy: { createdAt: "asc" } }),
    db.chatbotConfig.findUnique({ where: { shop } })
  ]);

  return data({
    supportUrl: merchantConfig?.supportUrl ?? "",
    policies,
    faqs,
    chatbotConfig: chatbotConfig || { botName: "Aria", brandColor: "#00A460", capFaqs: true, capPolicies: true, capOrderTracking: true }
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

      // Fix for Policies
      for (const p of payload.policies ?? []) {
        if (p._deleted && typeof p.id === 'string') {
          // It exists in the DB, so we can safely delete it
          await tx.policy.delete({ where: { id: p.id } });
        } else if (typeof p.id === 'string') {
          // It exists in the DB, so we update it
          await tx.policy.update({ where: { id: p.id }, data: { name: p.name, text: p.text } });
        } else if (!p._deleted) {
          // It has a temporary numeric ID (or no ID), so we create it
          await tx.policy.create({ data: { shop, name: p.name, text: p.text } });
        }
      }

      // Fix for FAQs
      for (const f of payload.faqs ?? []) {
        if (f._deleted && typeof f.id === 'string') {
           // It exists in the DB, so we can safely delete it
          await tx.faq.delete({ where: { id: f.id } });
        } else if (typeof f.id === 'string') {
          // It exists in the DB, so we update it
          await tx.faq.update({ where: { id: f.id }, data: { question: f.question, answer: f.answer } });
        } else if (!f._deleted) {
          // It has a temporary numeric ID (or no ID), so we create it
          await tx.faq.create({ data: { shop, question: f.question, answer: f.answer } });
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
  const currentTab = searchParams.get("tab") || "kb";

  const [supportUrl, setSupportUrl] = useState(loaderData.supportUrl);
  const [policies, setPolicies] = useState(loaderData.policies);
  const [faqs, setFaqs] = useState(loaderData.faqs);
  const [isDirty, setIsDirty] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const config = loaderData.chatbotConfig;

  useEffect(() => {
    setSupportUrl(loaderData.supportUrl);
    setPolicies(loaderData.policies);
    setFaqs(loaderData.faqs);
    setIsDirty(false);
  }, [loaderData]);

  const handleSave = () => {
    const payload = { supportUrl, policies, faqs };
    fetcher.submit({ intent: "train-save", payload: JSON.stringify(payload) }, { method: "post" });
  };

  const setTab = (tab) => {
    if (tab === "faqs" && !config.capFaqs) {
      setAlertMsg("FAQs are disabled. Please enable them in Chatbot Settings to use this feature.");
      setTimeout(() => setAlertMsg(""), 4000);
      return;
    }
    setSearchParams({ tab }, { preventScrollReset: true });
  };

  const handleDisabledAction = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(""), 4000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', margin: '0 0 8px 0' }}>
          Train {config.botName}
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          Manage your AI's knowledge base and test its responses in real-time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '6px', borderRadius: '12px', gap: '4px' }}>
            <button 
              onClick={() => setTab("kb")}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: currentTab === "kb" ? '#fff' : 'transparent', color: currentTab === "kb" ? '#0f172a' : '#64748b', boxShadow: currentTab === "kb" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Knowledge Base
            </button>
            <button 
              onClick={() => setTab("faqs")}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', background: currentTab === "faqs" ? '#fff' : 'transparent', color: !config.capFaqs ? '#94a3b8' : currentTab === "faqs" ? '#0f172a' : '#64748b', boxShadow: currentTab === "faqs" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              FAQs {!config.capFaqs && " (Disabled)"}
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            {currentTab === "kb" && (
              <KbTab 
                supportUrl={supportUrl} setSupportUrl={(val) => { setSupportUrl(val); setIsDirty(true); }}
                policies={policies} setPolicies={(val) => { setPolicies(val); setIsDirty(true); }}
                config={config} onDisabled={handleDisabledAction}
              />
            )}
            {currentTab === "faqs" && (
              <FaqTab faqs={faqs} setFaqs={(val) => { setFaqs(val); setIsDirty(true); }} />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <SandboxPreview config={config} faqs={faqs} />
      </div>

      {/* Floating Save / Alert Bar */}
      <div style={{ position: 'fixed', bottom: (isDirty || alertMsg) ? '24px' : '-100px', left: '50%', transform: 'translateX(-50%)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: alertMsg ? '#ef4444' : 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#fff', padding: '16px 24px', borderRadius: '100px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {alertMsg ? "Feature Disabled" : "Unsaved Changes"}
            </span>
            <span style={{ fontSize: '12px', color: alertMsg ? '#fecaca' : '#94a3b8' }}>
              {alertMsg || "Publish updates to your live AI widget."}
            </span>
          </div>
          {!alertMsg && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setSupportUrl(loaderData.supportUrl); setPolicies(loaderData.policies); setFaqs(loaderData.faqs); setIsDirty(false); }} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: '8px 12px' }}>Discard</button>
              <button onClick={handleSave} disabled={fetcher.state !== "idle"} style={{ background: '#fff', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '100px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{fetcher.state === "submitting" ? "Saving..." : "Publish to Store"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}