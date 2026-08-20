import { useLoaderData, useFetcher, useNavigate, redirect, data } from "react-router";
import { authenticate } from "../shopify.server";
import { AppProvider, Text } from "@shopify/polaris";
import db from "../db.server";
import { useState } from "react";
import enTranslations from "@shopify/polaris/locales/en.json";
import { 
  ShoppingBag, 
  Truck, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Headphones, 
  ShieldCheck, 
  Clock, 
  Check
} from "lucide-react";

const SKILLS = [
  {
    key: "capProducts",
    title: "Shopping Assistant",
    description: "Help customers discover products, compare items and get personalized recommendations.",
    badgeIcon: TrendingUp,
    badgeText: "Boost sales",
    categoryIcon: ShoppingBag,
    imageSrc: "/shopping.png",
    themeColor: "#8b5cf6",
    themeBg: "#f5f3ff",
    badgeBg: "#f3e8ff",
    badgeColor: "#7c3aed",
  },
  {
    key: "capOrderTracking",
    title: "Order Tracking",
    description: "Customers can check order status, track deliveries and get real-time updates.",
    badgeIcon: Headphones,
    badgeText: "Reduce support load",
    categoryIcon: Truck,
    imageSrc: "/tracking.png",
    themeColor: "#3b82f6",
    themeBg: "#eff6ff",
    badgeBg: "#dbeafe",
    badgeColor: "#2563eb",
  },
  {
    key: "capPolicies",
    title: "Store Policies",
    description: "Answer questions about shipping, returns, refunds and other policies instantly.",
    badgeIcon: ShieldCheck,
    badgeText: "Reduce tickets",
    categoryIcon: FileText,
    imageSrc: "/policies.png",
    themeColor: "#22c55e",
    themeBg: "#f0fdf4",
    badgeBg: "#dcfce7",
    badgeColor: "#16a34a",
  },
  {
    key: "capFaqs",
    title: "FAQs",
    description: "Provide instant answers to common questions using your custom FAQ pairs.",
    badgeIcon: Clock,
    badgeText: "Always available",
    categoryIcon: MessageSquare,
    imageSrc: "/faqs.png",
    themeColor: "#f59e0b",
    themeBg: "#fffbeb",
    badgeBg: "#fef3c7",
    badgeColor: "#d97706",
  },
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const config = await db.chatbotConfig.findUnique({ where: { shop: session.shop } });

  const url = new URL(request.url);
  if (config && url.searchParams.get("mode") !== "edit" && config.setupComplete) {
    return redirect("/app/dashboard");
  }

  return data({ config });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  const capabilityData = {
    capProducts: formData.get("capProducts") === "true",
    capOrderTracking: formData.get("capOrderTracking") === "true",
    capPolicies: formData.get("capPolicies") === "true",
    capFaqs: formData.get("capFaqs") === "true",
  };

  await db.chatbotConfig.upsert({
    where: { shop: session.shop },
    update: capabilityData,
    create: {
      shop: session.shop,
      ...capabilityData,
    },
  });

  if (intent === "finish") {
    await db.chatbotConfig.update({
      where: { shop: session.shop },
      data: { setupComplete: true },
    });
    return redirect("/app/dashboard");
  }

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

  const handleComplete = () => {
    fetcher.submit(
      {
        ...Object.fromEntries(Object.entries(selected).map(([k, v]) => [k, String(v)])),
        intent: "finish",
      },
      { method: "POST" }
    );
  };

  const enabledCount = Object.values(selected).filter(Boolean).length;

  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ minHeight: "100vh", background: "#fcfcfd", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "40px 24px 32px" }}>
          <div style={{ display: "inline-block", backgroundColor: "#e8f5e9", color: "#00A460", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "500", marginBottom: "8px" }}>
            Step 2 of 2
          </div>
          <Text variant="headingXl" as="h1">Teach your AI what it can do</Text>
          <div style={{ marginTop: "6px" }}>
            <Text variant="bodyMd" tone="subdued">
              Pick the skills you want your AI assistant to handle for your customers.
            </Text>
            <Text variant="bodyMd" tone="subdued">
              You can enable or customize them anytime.
            </Text>
          </div>
        </div>

        {/* Skill Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {SKILLS.map((skill) => {
            const active = selected[skill.key];
            const BadgeIcon = skill.badgeIcon;
            const CategoryIcon = skill.categoryIcon;

            return (
              <div
                key={skill.key}
                onClick={() => toggle(skill.key)}
                style={{
                  background: active ? "#fff" : "#fafafa",
                  border: `1.5px solid ${active ? skill.themeColor : "#e5e7eb"}`,
                  borderRadius: "16px",
                  padding: "12px 14px 16px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: active ? `0 6px 20px ${skill.themeColor}18` : "0 1px 2px rgba(0,0,0,0.02)",
                  opacity: active ? 1 : 0.65,
                  userSelect: "none"
                }}
              >
                <div>
                  {/* Top Illustration Canvas */}
                  <div style={{
                    position: "relative",
                    width: "100%",
                    height: "140px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: active ? skill.themeBg : "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.2s ease"
                  }}>
                    <img
                      src={skill.imageSrc}
                      alt={skill.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: active ? "none" : "grayscale(100%)",
                        transition: "filter 0.2s ease"
                      }}
                    />

                    {/* Interactive Top-Right Checkmark Badge */}
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: active ? skill.themeColor : "#ffffff",
                      border: `1.5px solid ${active ? skill.themeColor : "#d1d5db"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
                    }}>
                      {active && <Check size={13} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Category Icon Badge */}
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: active ? skill.themeBg : "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "12px",
                    color: active ? skill.themeColor : "#9ca3af",
                    transition: "all 0.2s ease"
                  }}>
                    <CategoryIcon size={18} />
                  </div>

                  {/* Title & Description */}
                  <div style={{ marginTop: "10px" }}>
                    <div style={{
                      fontWeight: "700",
                      fontSize: "14.5px",
                      color: active ? "#111827" : "#6b7280",
                      marginBottom: "4px",
                      transition: "color 0.2s ease"
                    }}>
                      {skill.title}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: active ? "#6b7280" : "#9ca3af",
                      lineHeight: "1.45",
                      transition: "color 0.2s ease"
                    }}>
                      {skill.description}
                    </div>
                  </div>
                </div>

                {/* Bottom Benefit Tag */}
                <div style={{ marginTop: "16px" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    backgroundColor: active ? skill.badgeBg : "#f3f4f6",
                    color: active ? skill.badgeColor : "#9ca3af",
                    transition: "all 0.2s ease"
                  }}>
                    <BadgeIcon size={12} />
                    {skill.badgeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer Navigation */}
        <div style={{
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#fff",
          marginTop: "32px"
        }}>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
            {enabledCount > 0
              ? `✓ Setup complete — ${enabledCount} ${enabledCount === 1 ? "skill" : "skills"} enabled`
              : "Select at least one skill to continue"}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/app/appearance?mode=edit")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "1px solid #e1e3e5",
                borderRadius: "8px",
                padding: "8px 16px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "13px",
                color: "#374151",
                fontWeight: "500",
                transition: "background-color 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              ← Back
            </button>

            <button
              onClick={handleComplete}
              disabled={fetcher.state !== "idle" || enabledCount === 0}
              style={{
                backgroundColor: enabledCount === 0 ? "#9ca3af" : "#00A460",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 24px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: enabledCount === 0 ? "not-allowed" : "pointer",
                transition: "opacity 0.15s ease"
              }}
            >
              {fetcher.state !== "idle" ? "Saving..." : "Complete Setup"}
            </button>
          </div>
        </div>
      </div>
    </AppProvider>
  );
}