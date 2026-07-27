import { useState } from "react";

export default function FaqTab({ faqs, setFaqs }) {
  const [openFaqs, setOpenFaqs] = useState({});
  const visibleFaqs = faqs.filter(f => !f._deleted);

  const addFaq = () => {
    const newId = -Date.now();
    setFaqs([...faqs, { id: newId, question: "", answer: "" }]);
    setOpenFaqs({ ...openFaqs, [newId]: true });
  };

  const updateFaq = (id, field, value) => setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  
  const deleteFaq = (e, id) => {
    e.stopPropagation();
    setFaqs(faqs.map(f => {
      if (f.id === id) return typeof id === 'string' ? { ...f, _deleted: true } : null;
      return f;
    }).filter(Boolean));
  };

  const toggleFaq = (id) => setOpenFaqs(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>FAQs</h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>Hardcode exact answers for specific customer questions.</p>
        </div>
        <button onClick={addFaq} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>+ Add FAQ</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {visibleFaqs.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No FAQs added yet.</div>
        )}
        
        {visibleFaqs.map((faq, index) => {
          const isOpen = openFaqs[faq.id];
          const isLast = index === visibleFaqs.length - 1;
          
          return (
            <div key={faq.id} style={{ borderBottom: isLast ? 'none' : '1px solid #e2e8f0', background: '#fff' }}>
              <div 
                onClick={() => toggleFaq(faq.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ fontSize: '18px', fontWeight: '300', width: '16px', textAlign: 'center', color: '#64748b' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                  <input 
                    type="text" 
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: '500', color: '#0f172a', background: 'transparent' }}
                    placeholder="Question (e.g. How long does shipping take?)"
                    value={faq.question}
                    onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
                  />
                </div>
                <button 
                  onClick={(e) => deleteFaq(e, faq.id)} 
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', borderRadius: '4px', opacity: 0.7 }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                >
                  Remove
                </button>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateRows: isOpen ? '1fr' : '0fr', 
                transition: 'grid-template-rows 0.3s ease',
                background: '#fafafa'
              }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '0 16px 20px 44px' }}>
                    <textarea 
                      style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#4b5563' }}
                      placeholder="Standard shipping is 3-5 business days..."
                      value={faq.answer}
                      onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}