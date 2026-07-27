import { useState, useEffect } from "react";

const LINK_MAX = 2048; // Increased from 30 to support actual URLs
const TEXT_MAX = 5000;
const isLink = (text) => /^https?:\/\//i.test((text || "").trim());

export default function KbTab({ supportUrl, setSupportUrl, policies, setPolicies, config, onDisabled, isDirty }) {
  const [openPolicies, setOpenPolicies] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyText, setNewPolicyText] = useState("");
  const [newPolicyType, setNewPolicyType] = useState("link"); // Default to link as it's easier
  const [typeChoice, setTypeChoice] = useState({});

  const visiblePolicies = policies.filter(p => !p._deleted);

  useEffect(() => {
    if (!isDirty) {
      setTypeChoice({}); // Wipe the local toggle memory on Discard/Save
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
    
    // Reset form
    setIsAdding(false);
    setNewPolicyName("");
    setNewPolicyText("");
    setNewPolicyType("link");
  };

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#0f172a', boxSizing: 'border-box' };
  
  // Improved toggle button UI
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Support Link */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Support Contact</label>
        <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', marginBottom: '8px' }}>Where should the AI direct customers when they need a human?</p>
        <input type="text" style={{ ...inputStyle, maxWidth: '400px' }} placeholder="e.g., support@yourstore.com" value={supportUrl || ""} onChange={(e) => setSupportUrl(e.target.value)} />
      </div>

      <div style={{ height: '1px', background: '#e2e8f0' }}></div>

      {/* Product Catalog */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Product Catalog</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '8px' }}>
           <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></div>
           <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>Synced automatically</div>
        </div>
      </div>

      <div style={{ height: '1px', background: '#e2e8f0' }}></div>

      {/* Store Policies */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: !config.capPolicies ? '#94a3b8' : '#334155' }}>
              Store Policies {!config.capPolicies && "(Disabled)"}
            </label>
          </div>
          <button
            onClick={() => {
              if (!config.capPolicies) return onDisabled("Store Policies are disabled. Enable them in Chatbot Settings.");
              setIsAdding(!isAdding);
              setNewPolicyName(""); setNewPolicyText(""); setNewPolicyType("link");
            }}
            style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
          >
            {isAdding ? "Cancel" : "+ Add Policy"}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Add Policy Form */}
          {isAdding && (
            <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', background: '#fff', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <button onClick={() => { setNewPolicyType("link"); setNewPolicyText(""); }} style={{...toggleBtnStyle(newPolicyType === "link"), border: 'none', borderRight: '1px solid #cbd5e1'}}>
                  🔗 Link
                </button>
                <button onClick={() => { setNewPolicyType("text"); setNewPolicyText(""); }} style={{...toggleBtnStyle(newPolicyType === "text"), border: 'none'}}>
                  📄 Text
                </button>
              </div>

              <input type="text" placeholder="Policy Name (e.g. Privacy Policy)" style={inputStyle} value={newPolicyName} onChange={(e) => setNewPolicyName(e.target.value)} />

              {newPolicyType === "link" && (
                <div>
                  <input type="text" placeholder="https://yourstore.com/policies/refund-policy" maxLength={LINK_MAX} style={inputStyle} value={newPolicyText} onChange={(e) => setNewPolicyText(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: (newPolicyText && !isLink(newPolicyText)) ? '#ef4444' : 'transparent' }}>Should start with http:// or https://</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{newPolicyText.length}/{LINK_MAX}</span>
                  </div>
                </div>
              )}
              
              {newPolicyType === "text" && (
                <div>
                  <textarea placeholder="Paste full policy content here..." maxLength={TEXT_MAX} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={newPolicyText} onChange={(e) => setNewPolicyText(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{newPolicyText.length}/{TEXT_MAX}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleAddPolicy}
                disabled={addDisabled}
                style={{ alignSelf: 'flex-start', background: '#00A460', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: addDisabled ? 0.5 : 1, transition: 'background 0.2s' }}
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
              <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <div
                  onClick={() => togglePolicy(p.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '500', color: !config.capPolicies ? '#94a3b8' : '#0f172a', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      {isLink(p.text) ? "🔗 Link" : "📄 Text"}
                    </span>
                    {p.name.replace(/-/g, ' ')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: currentText.trim() ? '#0f172a' : '#3b82f6', background: currentText.trim() ? '#f8fafc' : '#eff6ff', border: currentText.trim() ? '1px solid #e2e8f0' : 'none', padding: '4px 10px', borderRadius: '100px' }}>
                      {currentText.trim() ? "Manage" : "Setup"}
                    </span>
                    <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '12px', color: '#94a3b8' }}>▼</span>
                  </div>
                </div>

                {isOpen && config.capPolicies && (
                  <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    
                    <div style={{ display: 'flex', background: '#fff', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '16px', width: 'fit-content' }}>
                      {["link", "text"].map(t => (
                        <button 
                          key={t} 
                          onClick={() => {
                            if (activeType !== t) {
                              setTypeChoice(prev => ({ ...prev, [p.id]: t }));
                              updatePolicy(p.id, ""); // Clears the content when switching types
                            }
                          }} 
                          style={{...toggleBtnStyle(activeType === t), border: 'none', borderRight: t === 'link' ? '1px solid #cbd5e1' : 'none'}}
                        >
                          {t === "link" ? "Link " : "Text"}
                        </button>
                      ))}
                    </div>

                    {activeType === "link" ? (
                      <div>
                        <input type="text" placeholder="https://yourstore.com/policy" maxLength={LINK_MAX} style={inputStyle} value={currentText} onChange={(e) => updatePolicy(p.id, e.target.value)} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                           <span style={{ fontSize: '12px', color: (currentText && !isLink(currentText)) ? '#ef4444' : 'transparent' }}>Should start with http:// or https://</span>
                           <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentText.length}/{LINK_MAX}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} placeholder={`Paste your ${p.name} policy text here...`} maxLength={TEXT_MAX} value={currentText} onChange={(e) => updatePolicy(p.id, e.target.value)} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentText.length}/{TEXT_MAX}</span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button onClick={() => deletePolicy(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
    </div>
  );
}