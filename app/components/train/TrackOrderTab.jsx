import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

const DEFAULTS = {
  heading: "Track Your Order",
  description: "Enter your order details to check the latest order status.",
  orderPlaceholder: "Order number (e.g. #1020)",
  emailPlaceholder: "Email used at checkout",
  buttonText: "Track Order",
  successMessage: "We've found your order.",
  errorMessage: "We couldn't find an order with those details. Please check and try again.",
  showEstimatedDelivery: true,
  showFulfillmentStatus: true,
  showTrackingNumber: true,
  showCourierName: true,
  showTrackingLink: true,
};

export default function TrackOrderTab({ trackConfig, setTrackConfig, onBack }) {
  const config = { ...DEFAULTS, ...trackConfig };

  const update = (key, value) => {
    setTrackConfig({ ...config, [key]: value });
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    color: "#0f172a",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "6px",
    display: "block",
  };

  const subLabelStyle = {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "16px",
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "transparent",
            border: "none",
            color: "#64748b",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "20px",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to menu
        </button>
      )}

      {/* Header */}
      <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.3px" }}>
        Track Order
      </h2>
      <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 24px 0" }}>
        Customize how customers track their orders.
      </p>

      {/* Fields to Collect */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "#0f172a" }}>Fields to Collect</h3>
        <p style={subLabelStyle}>The details customers need to enter to track their orders.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>
            <input type="checkbox" checked disabled style={{ width: "16px", height: "16px", accentColor: "#10b981" }} />
            <span>Order Number</span>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>
              Required
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>
            <input type="checkbox" checked disabled style={{ width: "16px", height: "16px", accentColor: "#10b981" }} />
            <span>Email Address</span>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>
              Required
            </span>
          </label>
        </div>
      </div>

      {/* Text Customization */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "#0f172a" }}>Text Customization</h3>
        <p style={subLabelStyle}>Customize the text and placeholders customers will see.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Heading</label>
            <input style={inputStyle} value={config.heading} onChange={(e) => update("heading", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} value={config.description} onChange={(e) => update("description", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Order Number Placeholder</label>
            <input style={inputStyle} value={config.orderPlaceholder} onChange={(e) => update("orderPlaceholder", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Email Placeholder</label>
            <input style={inputStyle} value={config.emailPlaceholder} onChange={(e) => update("emailPlaceholder", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Button Text</label>
            <input style={inputStyle} value={config.buttonText} onChange={(e) => update("buttonText", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Success & Error Messages */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "16px" }}>
        {/* Success Message Card */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "#0f172a" }}>Success Message</h3>
              <p style={{ ...subLabelStyle, marginBottom: "12px" }}>Shown when order is found.</p>
            </div>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f0fdf4", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #bbf7d0" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <textarea
            rows={3}
            maxLength={100}
            value={config.successMessage}
            onChange={(e) => update("successMessage", e.target.value)}
            style={{ ...inputStyle, resize: "none", height: "80px" }}
          />
          <div style={{ textAlign: "right", fontSize: "11px", color: "#94a3b8", marginTop: "6px", fontWeight: "500" }}>
            {config.successMessage.length}/100
          </div>
        </div>

        {/* Error Message Card */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "#0f172a" }}>Error Message</h3>
              <p style={{ ...subLabelStyle, marginBottom: "12px" }}>Shown when order is not found.</p>
            </div>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #fecaca" }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <textarea
            rows={3}
            maxLength={100}
            value={config.errorMessage}
            onChange={(e) => update("errorMessage", e.target.value)}
            style={{ ...inputStyle, resize: "none", height: "80px" }}
          />
          <div style={{ textAlign: "right", fontSize: "11px", color: "#94a3b8", marginTop: "6px", fontWeight: "500" }}>
            {config.errorMessage.length}/100
          </div>
        </div>
      </div>

      {/* Advanced Display Options */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "#0f172a" }}>Advanced (Optional)</h3>
        <p style={subLabelStyle}>Choose what information to show in the order status.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {[
            { key: "showEstimatedDelivery", label: "Show estimated delivery date" },
            { key: "showFulfillmentStatus", label: "Show fulfillment status" },
            { key: "showTrackingNumber", label: "Show tracking number" },
            { key: "showCourierName", label: "Show courier name" },
            { key: "showTrackingLink", label: "Show tracking link" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: "#0f172a", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config[key]}
                onChange={(e) => update(key, e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#10b981", cursor: "pointer" }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}