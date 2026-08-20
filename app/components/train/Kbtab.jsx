import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const LINK_MAX = 2048;
const TEXT_MAX = 5000;
const isLink = (text) => /^https?:\/\//i.test((text || "").trim());

export default function KbTab({ supportUrl, setSupportUrl, customInstructions, setCustomInstructions, policies, setPolicies, config, onDisabled, isDirty, onBack }) {
  const [openPolicies, setOpenPolicies] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyText, setNewPolicyText] = useState("");
  const [newPolicyType, setNewPolicyType] = useState("link");
  const [typeChoice, setTypeChoice] = useState({});

  const visiblePolicies = policies.filter(p => !p._deleted);

  useEffect(() => {
    if (!isDirty) {
      setTypeChoice({});
    }
  }, [isDirty]);

  const togglePolicy = (id) => {
    if (!config.capPolicies) return onDisabled("Store Policies are disabled. Enable them in Chatbot Settings.");
    setOpenPolicies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updatePolicy = (id, text) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, text } : p));
  };

  const deletePolicy = (id) => {
    setPolicies(policies.map(p => {
      if (p.id === id) return typeof id === 'string' ? { ...p, _deleted: true } : null;
      return p;
    }).filter(Boolean));
  };

  const handleAddPolicy = () => {
    if (!newPolicyName.trim() || !newPolicyType || !newPolicyText.trim()) return;
    const newId = -Date.now();
    setPolicies([...policies, { id: newId, name: newPolicyName.trim(), text: newPolicyText }]);
    setOpenPolicies(prev => ({ ...prev, [newId]: true }));

    setIsAdding(false);
    setNewPolicyName("");
    setNewPolicyText("");
    setNewPolicyType("link");
  };

  const inputStyle = { 
    width: '100%', 
    padding: '12px 14px', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px', 
    fontSize: '14px', 
    outline: 'none', 
    color: '#0f172a', 
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  };

  const toggleBtnStyle = (active) => ({
    flex: 1,
    padding: '8px 14px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    background: active ? '#f8fafc' : '#fff',
    color: active ? '#0f172a' : '#64748b',
    boxShadow: active ? 'inset 0 1px 2px rgba(0,0,0,0.05)' : 'none',
    transition: 'all 0.15s ease'
  });

  const addDisabled = !newPolicyName.trim() || !newPolicyType || !newPolicyText.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Back Navigation */}
      {onBack && (
        <button 
          onClick={onBack} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to menu
        </button>
      )}
      
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>Knowledge Base</h2>
      <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>Manage your AI's knowledge base and test its responses in real-time.</p>

      {/* Main White Card Container */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        
        {/* Support Contact */}
        <div>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Support Contact</label>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', marginBottom: '14px' }}>Where should the AI direct customers when they need a human?</p>
          <input 
            type="text" 
            style={inputStyle} 
            placeholder="e.g., support@yourstore.com" 
            value={supportUrl || ""} 
            onChange={(e) => setSupportUrl(e.target.value)} 
          />
        </div>

        <div style={{ height: '1px', background: '#f1f5f9' }}></div>

        {/* Product Catalog */}
        <div>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>Product Catalog</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#334155' }}>Synced automatically</div>
          </div>
        </div>

        <div style={{ height: '1px', background: '#f1f5f9' }}></div>

        {/* Store Policies */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: !config.capPolicies ? '#94a3b8' : '#1e293b' }}>
              Store Policies {!config.capPolicies && "(Disabled)"}
            </label>
            <button
              onClick={() => {
                if (!config.capPolicies) return onDisabled("Store Policies are disabled. Enable them in Chatbot Settings.");
                setIsAdding(!isAdding);
                setNewPolicyName(""); setNewPolicyText(""); setNewPolicyType("link");
              }}
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
            >
              {isAdding ? "Cancel" : "+ Add Policy"}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: visiblePolicies.length > 0 || isAdding ? '16px' : '0' }}>
            {/* Add Policy Form */}
            {isAdding && (
              <div style={{ padding: '20px', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div style={{ display: 'flex', background: '#fff', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', width: 'fit-content' }}>
                  <button onClick={() => { setNewPolicyType("link"); setNewPolicyText(""); }} style={{ ...toggleBtnStyle(newPolicyType === "link"), border: 'none', borderRight: '1px solid #cbd5e1' }}>
                    🔗 Link
                  </button>
                  <button onClick={() => { setNewPolicyType("text"); setNewPolicyText(""); }} style={{ ...toggleBtnStyle(newPolicyType === "text"), border: 'none' }}>
                    📝 Text
                  </button>
                </div>

                <input type="text" placeholder="Policy Name (e.g. Privacy Policy)" style={inputStyle} value={newPolicyName} onChange={(e) => setNewPolicyName(e.target.value)} />

                {newPolicyType === "link" && (
                  <div>
                    <input type="text" placeholder="https://yourstore.com/policies/refund-policy" maxLength={LINK_MAX} style={inputStyle} value={newPolicyText} onChange={(e) => setNewPolicyText(e.target.value)} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ fontSize: '12px', color: (newPolicyText && !isLink(newPolicyText)) ? '#ef4444' : 'transparent' }}>Should start with http:// or https://</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{newPolicyText.length}/{LINK_MAX}</span>
                    </div>
                  </div>
                )}

                {newPolicyType === "text" && (
                  <div>
                    <textarea placeholder="Paste full policy content here..." maxLength={TEXT_MAX} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={newPolicyText} onChange={(e) => setNewPolicyText(e.target.value)} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{newPolicyText.length}/{TEXT_MAX}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddPolicy}
                  disabled={addDisabled}
                  style={{ alignSelf: 'flex-start', background: '#0f172a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: addDisabled ? 0.5 : 1, transition: 'background 0.2s' }}
                >
                  Save Policy
                </button>
              </div>
            )}

            {/* Mapped Policies */}
            {visiblePolicies.map((p) => {
              const isOpen = openPolicies[p.id];
              const activeType = typeChoice[p.id] ?? (isLink(p.text) ? "link" : "text");
              const currentText = p.text || "";

              return (
                <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                  <div
                    onClick={() => togglePolicy(p.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span style={{ fontSize: '14.5px', fontWeight: '600', color: !config.capPolicies ? '#94a3b8' : '#0f172a', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                        {isLink(p.text) ? "🔗 Link" : "📝 Text"}
                      </span>
                      {p.name.replace(/-/g, ' ')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: currentText.trim() ? '#0f172a' : '#3b82f6', background: currentText.trim() ? '#f8fafc' : '#eff6ff', border: currentText.trim() ? '1px solid #e2e8f0' : 'none', padding: '6px 12px', borderRadius: '100px' }}>
                        {currentText.trim() ? "Manage" : "Setup"}
                      </span>
                      <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '12px', color: '#94a3b8' }}>▼</span>
                    </div>
                  </div>

                  {isOpen && config.capPolicies && (
                    <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', background: '#fff', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '16px', width: 'fit-content' }}>
                        {["link", "text"].map(t => (
                          <button
                            key={t}
                            onClick={() => {
                              if (activeType !== t) {
                                setTypeChoice(prev => ({ ...prev, [p.id]: t }));
                                updatePolicy(p.id, ""); 
                              }
                            }}
                            style={{ ...toggleBtnStyle(activeType === t), border: 'none', borderRight: t === 'link' ? '1px solid #cbd5e1' : 'none' }}
                          >
                            {t === "link" ? "Link " : "Text"}
                          </button>
                        ))}
                      </div>

                      {activeType === "link" ? (
                        <div>
                          <input type="text" placeholder="https://yourstore.com/policy" maxLength={LINK_MAX} style={inputStyle} value={currentText} onChange={(e) => updatePolicy(p.id, e.target.value)} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                            <span style={{ fontSize: '12px', color: (currentText && !isLink(currentText)) ? '#ef4444' : 'transparent' }}>Should start with http:// or https://</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentText.length}/{LINK_MAX}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} placeholder={`Paste your ${p.name} policy text here...`} maxLength={TEXT_MAX} value={currentText} onChange={(e) => updatePolicy(p.id, e.target.value)} />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentText.length}/{TEXT_MAX}</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button onClick={() => deletePolicy(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Remove Policy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: '1px', background: '#f1f5f9' }}></div>

        {/* Custom Instructions & Rules */}
        <div>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
            Custom Instructions & Rules
          </label>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', marginBottom: '14px' }}>
            Add specific guidelines, store rules, or tone constraints for the AI to follow.
          </p>
          <textarea
            style={{
              ...inputStyle,
              minHeight: '130px',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: '1.6'
            }}
            placeholder={`e.g.,\n- Always recommend our flagship product first.\n- Never guarantee exact shipping dates.\n- Keep answers concise and under 3 sentences.`}
            value={customInstructions || ""}
            onChange={(e) => setCustomInstructions(e.target.value)}
          />
        </div>

      </div>
    </div>
  );
}