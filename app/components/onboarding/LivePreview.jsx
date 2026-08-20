import { useState } from "react";
import { Text } from "@shopify/polaris";
import { renderIcon, parseAvatarPreset } from "./AvatarAppearance";

// Dynamic user questions and AI responses across all 12 languages
const SAMPLE_CONVERSATIONS = {
  questions: {
    en: "Where is my order?",
    es: "¿Dónde está mi pedido?",
    fr: "Où est ma commande ?",
    de: "Wo ist meine Bestellung?",
    pt: "Onde está o meu pedido?",
    hi: "मेरा ऑर्डर कहाँ है?",
    ar: "أين طلبي؟",
    zh: "我的订单在哪里？",
    ja: "注文はどこにありますか？",
    ko: "제 주문은 어디에 있나요?",
    it: "Dov'è il mio ordine?",
    nl: "Waar is mijn bestelling?",
  },
  friendly: {
    en: "I'd love to help with that! Just drop your order number and I'll find its tracking status right away 😊",
    es: "¡Me encantaría ayudarte con eso! Solo dime tu número de pedido y buscaré el estado de inmediato 😊",
    fr: "Je serais ravi de vous aider ! Donnez-moi simplement votre numéro de commande et je vérifie ça tout de suite 😊",
    de: "Da helfe ich super gerne weiter! Nenne mir einfach deine Bestellnummer und ich prüfe den Status sofort 😊",
    pt: "Com certeza, vou adorar te ajudar! Me passa seu número de pedido que já verifico o status 😊",
    hi: "मुझे आपकी मदद करने में बहुत खुशी होगी! कृपया अपना ऑर्डर नंबर बताएं, मैं तुरंत चेक करता हूँ 😊",
    ar: "يسعدني جداً مساعدتك في ذلك! فقط زودني برقم طلبك وسأتحقق من حالة التتبع فوراً 😊",
    zh: "我很乐意为您提供帮助！只需提供您的订单号，我就会立即为您查询物流状态 😊",
    ja: "喜んでお手伝いします！注文番号を教えていただければ、すぐに配送状況をお調べします 😊",
    ko: "기꺼이 도와드릴게요! 주문 번호를 알려주시면 바로 배송 조회를 도와드리겠습니다 😊",
    it: "Sarei felice di aiutarti! Indicami il numero del tuo ordine e controllerò subito lo stato della spedizione 😊",
    nl: "Daar help ik je heel graag bij! Geef even je bestelnummer door, dan zoek ik het meteen voor je uit 😊",
  },
  professional: {
    en: "Certainly. Please provide your order number, and I will retrieve the current shipment status for you.",
    es: "Por supuesto. Por favor, proporcione su número de pedido y recuperaré el estado del envío para usted.",
    fr: "Certainement. Veuillez fournir votre numéro de commande et je récupérerai les détails de livraison.",
    de: "Gerne. Bitte geben Sie Ihre Bestellnummer an, damit ich den aktuellen Lieferstatus abrufen kann.",
    pt: "Certamente. Por favor, informe o número do seu pedido para que eu possa verificar o status da entrega.",
    hi: "ज़रूर। कृपया अपना ऑर्डर नंबर प्रदान करें, मैं आपके लिए वर्तमान शिपमेंट स्थिति प्राप्त करूँगा।",
    ar: "بالتأكيد. يرجى تزويدنا برقم الطلب، وسأقوم بجلب تفاصيل وحالة الشحنة الحالية لك.",
    zh: "好的。请提供您的订单编号，我将为您调取当前的物流发货状态。",
    ja: "かしこまりました。注文番号をご入力いただければ、現在の配送状況を確認いたします。",
    ko: "알겠습니다. 주문 번호를 입력해 주시면 현재 배송 상태를 조회해 드리겠습니다.",
    it: "Certamente. La preghiamo di fornire il numero d'ordine per verificare lo stato della spedizione.",
    nl: "Zeker. Voer alstublieft uw bestelnummer in, dan haal ik de actuele verzendstatus voor u op.",
  },
  concise: {
    en: "Please share your order number to track your package.",
    es: "Indique su número de pedido para rastrear su paquete.",
    fr: "Veuillez fournir votre numéro de commande pour le suivi.",
    de: "Bitte Bestellnummer eingeben, um das Paket zu verfolgen.",
    pt: "Informe seu número de pedido para rastreamento.",
    hi: "पैकेज ट्रैक करने के लिए कृपया अपना ऑर्डर नंबर दर्ज करें।",
    ar: "يرجى إدخال رقم الطلب لتتبع شحنتك.",
    zh: "请提供订单号以追踪包裹。",
    ja: "追跡のため注文番号を入力してください。",
    ko: "배송 조회를 위해 주문 번호를 입력해주세요.",
    it: "Inserisci il numero d'ordine per tracciare il pacco.",
    nl: "Voer je bestelnummer in om het pakket te volgen.",
  },
};

export default function LivePreview({ formData, logoUrl, starterPrompts }) {
  const [isMobile, setIsMobile] = useState(false);

  const parsed = parseAvatarPreset(formData.avatarPreset);
  const currentTone = formData.personalityTone || "friendly";
  const currentLang = formData.language || "en";

  const userQuestion =
    SAMPLE_CONVERSATIONS.questions[currentLang] || SAMPLE_CONVERSATIONS.questions.en;

  const toneReplies =
    SAMPLE_CONVERSATIONS[currentTone] || SAMPLE_CONVERSATIONS.friendly;
  const aiReply = toneReplies[currentLang] || toneReplies.en;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
          <Text variant="bodySm" fontWeight="semibold">Live Preview</Text>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {["Desktop", "Mobile"].map((mode) => (
            <button
              key={mode}
              onClick={() => setIsMobile(mode === "Mobile")}
              style={{
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                border: "1px solid #e1e3e5",
                backgroundColor: (isMobile ? "Mobile" : "Desktop") === mode ? "#f0fdf4" : "#fff",
                color: (isMobile ? "Mobile" : "Desktop") === mode ? "#00A460" : "#6b7280",
                fontWeight: (isMobile ? "Mobile" : "Desktop") === mode ? "600" : "400",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        width: isMobile ? "390px" : "100%",
        margin: "0 auto",
        border: "1px solid #e1e3e5",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#f9fafb",
        transition: "width 0.3s ease"
      }}>
        <div style={{ backgroundColor: "#f3f4f6", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #e1e3e5" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            {["#ef4444", "#eab308", "#22c55e"].map((c) => (
              <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: c }} />
            ))}
          </div>
          <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "4px", padding: "3px 10px", fontSize: "11px", color: "#9ca3af", textAlign: "center" }}>
            yourstore.myshopify.com
          </div>
        </div>

        <div style={{ position: "relative", padding: "16px", minHeight: "520px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#111" }}>Your Store</span>
            {!isMobile && (
              <div style={{ display: "flex", gap: "16px" }}>
                {["Shop", "Collections", "About"].map((l) => (
                  <span key={l} style={{ fontSize: "12px", color: "#6b7280" }}>{l}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{
            position: "absolute",
            bottom: "20px",
            right: "16px",
            width: isMobile ? "280px" : "320px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}>
            <div style={{ backgroundColor: formData.brandColor, padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: logoUrl ? "#f3f4f6" : parsed.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
                padding: logoUrl || parsed.isCustom ? "0" : "7px",
                boxSizing: "border-box"
              }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : parsed.isCustom ? (
                  renderIcon(parsed.icon, 20)
                ) : (
                  <div style={{ width: "100%", height: "100%" }}>{parsed.preset?.icon}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{formData.botName}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)" }}>● Online · Typically instant</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", cursor: "pointer" }}>−</span>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", cursor: "pointer" }}>×</span>
              </div>
            </div>

            <div style={{
              padding: "12px",
              backgroundColor: "#f9fafb",
              height: "280px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              {/* 1. Welcome Bubble */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: parsed.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  padding: logoUrl || parsed.isCustom ? "0" : "5px",
                  boxSizing: "border-box"
                }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : parsed.isCustom ? (
                    renderIcon(parsed.icon, 14)
                  ) : (
                    <div style={{ width: "100%", height: "100%" }}>{parsed.preset?.icon}</div>
                  )}
                </div>
                <div style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  borderTopLeftRadius: "4px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#111",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  maxWidth: "85%",
                  lineHeight: "1.4"
                }}>
                  {formData.welcomeMessage || `Hi! I'm ${formData.botName}, how can I help you?`}
                </div>
              </div>

              {/* 2. Starter Prompts */}
              {starterPrompts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  {starterPrompts.filter((p) => p.trim()).map((prompt, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "#fff",
                        border: `1px solid ${formData.brandColor}`,
                        borderRadius: "20px",
                        padding: "5px 12px",
                        fontSize: "11px",
                        color: formData.brandColor,
                        cursor: "pointer"
                      }}
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Localized User Question Bubble */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  backgroundColor: formData.brandColor,
                  color: "#fff",
                  borderRadius: "12px",
                  borderBottomRightRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  maxWidth: "80%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                }}>
                  {userQuestion}
                </div>
              </div>

              {/* 4. Localized & Tone-Aware AI Response Bubble */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: parsed.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  padding: logoUrl || parsed.isCustom ? "0" : "5px",
                  boxSizing: "border-box"
                }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : parsed.isCustom ? (
                    renderIcon(parsed.icon, 14)
                  ) : (
                    <div style={{ width: "100%", height: "100%" }}>{parsed.preset?.icon}</div>
                  )}
                </div>
                <div style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  borderTopLeftRadius: "4px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#111",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  maxWidth: "85%",
                  lineHeight: "1.4"
                }}>
                  {aiReply}
                </div>
              </div>
            </div>

            <div style={{ padding: "10px 12px", borderTop: "1px solid #e1e3e5", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fff" }}>
              <div style={{ flex: 1, fontSize: "12px", color: "#9ca3af" }}>Message {formData.botName}...</div>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: formData.brandColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}