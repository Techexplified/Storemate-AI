import { useState } from "react";

export default function KbTab({ supportUrl, setSupportUrl, policies, setPolicies, config, onDisabled }) {
  const [openPolicies, setOpenPolicies] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyText, setNewPolicyText] = useState("");

  const visiblePolicies = policies.filter(p => !p._deleted);

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
    if (!newPolicyName.trim()) return;
    const newId = -Date.now();
    setPolicies([...policies, { id: newId, name: newPolicyName.trim(), text: newPolicyText }]);
    setOpenPolicies(prev => ({ ...prev, [newId]: true }));
    setIsAdding(false);
    setNewPolicyName("");
    setNewPolicyText("");
  };

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#0f172a' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Support Link */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Support Contact</label>
        <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', marginBottom: '8px' }}>Where should the AI direct customers when they need a human?</p>
        <input type="text" style={{ ...inputStyle, maxWidth: '400px' }} placeholder="e.g., support@yourstore.com" value={supportUrl} onChange={(e) => setSupportUrl(e.target.value)} />
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
            }}
            style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
          >
            {isAdding ? "Cancel" : "+ Add Policy"}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Add Policy Form */}
          {isAdding && (
            <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Policy Name (e.g. Privacy Policy)" style={inputStyle} value={newPolicyName} onChange={(e) => setNewPolicyName(e.target.value)} />
              <textarea placeholder="Policy content..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={newPolicyText} onChange={(e) => setNewPolicyText(e.target.value)} />
              <button onClick={handleAddPolicy} disabled={!newPolicyName.trim()} style={{ alignSelf: 'flex-start', background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', opacity: !newPolicyName.trim() ? 0.5 : 1 }}>Save Policy</button>
            </div>
          )}

          {/* Mapped Policies */}
          {visiblePolicies.map((p) => {
            const hasText = p.text && p.text.trim().length > 0;
            const isOpen = openPolicies[p.id];
            
            return (
              <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div 
                  onClick={() => togglePolicy(p.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '500', color: !config.capPolicies ? '#94a3b8' : '#0f172a', textTransform: 'capitalize' }}>
                    {p.name.replace(/-/g, ' ')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: hasText ? '#0f172a' : '#3b82f6', background: hasText ? '#f1f5f9' : '#eff6ff', padding: '4px 10px', borderRadius: '100px' }}>
                      {hasText ? "Manage" : "Setup"}
                    </span>
                    <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '12px', color: '#94a3b8' }}>▼</span>
                  </div>
                </div>
                
                {isOpen && config.capPolicies && (
                  <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <textarea 
                      style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', marginBottom: '12px' }}
                      placeholder={`Paste your ${p.name} policy here...`}
                      value={p.text}
                      onChange={(e) => updatePolicy(p.id, e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                       <button onClick={() => deletePolicy(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Delete Policy</button>
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