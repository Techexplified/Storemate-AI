import { useState } from "react";

export default function FaqTab({ faqs, setFaqs }) {
  const [openFaqs, setOpenFaqs] = useState({});
  const visibleFaqs = faqs.filter(f => !f._deleted);

  const addFaq = () => {
    const newId = -Date.now();
    setFaqs([...faqs, { id: newId, question: "New Question?", answer: "" }]);
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visibleFaqs.map((faq) => {
          const isOpen = openFaqs[faq.id];
          return (
            <div key={faq.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
              <div 
                onClick={() => toggleFaq(faq.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '12px', color: '#94a3b8' }}>▼</span>
                  <input 
                    type="text" 
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}
                    placeholder="Question..."
                    value={faq.question}
                    onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
                  />
                </div>
                <button onClick={(e) => deleteFaq(e, faq.id)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }} title="Remove FAQ">✕</button>
              </div>
              
              {isOpen && (
                <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <textarea 
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical', outline: 'none' }}
                    placeholder="Exact answer you want the AI to give..."
                    value={faq.answer}
                    onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}