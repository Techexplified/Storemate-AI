(function () {
  const { shop, appUrl } = window.__storeMate || {};
  if (!shop || !appUrl) return;

  // Guard against double-mount
  if (document.getElementById('sm-widget')) return;

  let config = null;
  let conversationId = sessionStorage.getItem('sm_session') || crypto.randomUUID();
  sessionStorage.setItem('sm_session', conversationId);
  let leadCaptured = safeStorage(`sm_lead_${shop}`) !== null;
  let currentTab = 'chat';

  // --- SAFE STORAGE ---
  function safeStorage(key, value) {
    try {
      if (value !== undefined) localStorage.setItem(key, value);
      return localStorage.getItem(key);
    } catch { return null; }
  }

  // --- XSS ESCAPE ---
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // --- INITIALIZE ---
  async function init() {
    try {
      const response = await fetch(`${appUrl}/api/widget-config?shop=${shop}`);
      const data = await response.json();
      config = data.config || { botName: "Aria", brandColor: "#00A460", capFaqs: true };
      injectStyles();
      renderWidget();
    } catch (e) {
      console.error("StoreMate initialization failed:", e);
    }
  }

  // --- STYLES ---
  function injectStyles() {
    const styles = `
      #sm-widget { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #sm-fab { width: 60px; height: 60px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: none; color: white; background: ${config?.brandColor || '#00A460'}; }
      #sm-window { display: none; width: 360px; height: 600px; max-height: 80vh; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; position: absolute; bottom: 75px; right: 0; }
      #sm-window.open { display: flex; }
      #sm-header { padding: 16px; background: ${config?.brandColor || '#00A460'}; color: white; display: flex; align-items: center; gap: 10px; }
      .sm-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .sm-avatar img { width: 100%; height: 100%; object-fit: cover; }
      #sm-tabs { display: flex; background: #f4f4f4; border-bottom: 1px solid #e5e5e5; }
      .sm-tab { flex: 1; text-align: center; padding: 10px; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; }
      .sm-tab.active { color: ${config?.brandColor || '#00A460'}; border-bottom-color: ${config?.brandColor || '#00A460'}; font-weight: bold; }
      .sm-panel { flex: 1; display: none; overflow-y: auto; padding: 15px; background: #fafafa; }
      .sm-panel.active { display: block; }
      .sm-msg { margin-bottom: 12px; max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4; word-break: break-word; }
      .sm-msg.user { background: ${config?.brandColor || '#00A460'}; color: white; margin-left: auto; border-bottom-right-radius: 2px; }
      .sm-msg.bot { background: #e9e9eb; color: #1c1c1e; margin-right: auto; border-bottom-left-radius: 2px; }
      #sm-input-area { display: flex; padding: 12px; border-top: 1px solid #e5e5e5; background: white; }
      #sm-input-area input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
      #sm-input-area button { background: none; border: none; color: ${config?.brandColor || '#00A460'}; font-weight: bold; margin-left: 8px; cursor: pointer; }
      #sm-lead-popup { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; padding: 20px; z-index: 10; }
      .sm-lead-content { background: white; padding: 20px; border-radius: 8px; width: 100%; text-align: center; }
      .sm-lead-content input { width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      .sm-lead-content button { width: 100%; padding: 10px; background: ${config?.brandColor || '#00A460'}; color: white; border: none; border-radius: 4px; cursor: pointer; }
      .sm-indicator { font-style: italic; color: #8e8e93; }
      .sm-faq-item { background: white; padding: 10px; margin-bottom: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .sm-faq-q { font-weight: bold; margin-bottom: 4px; font-size: 14px; }
      .sm-faq-a { font-size: 13px; color: #444; }
    `;
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);
  }

  // --- UI RENDERING ---
  function renderWidget() {
    const container = document.createElement('div');
    container.id = 'sm-widget';

    const logoHtml = config.logoUrl
      ? `<img src="${esc(config.logoUrl)}" alt="logo" />`
      : `<span style="font-size:18px;">🤖</span>`;

    container.innerHTML = `
      <button id="sm-fab">${logoHtml}</button>
      <div id="sm-window">
        <div id="sm-header">
          <div class="sm-avatar">${logoHtml}</div>
          <div>
            <div style="font-weight: bold;">${esc(config.botName || 'Aria')}</div>
            <div style="font-size: 11px; opacity: 0.8;">AI Assistant</div>
          </div>
        </div>
        <div id="sm-tabs">
          <div class="sm-tab active" data-tab="chat">Chat</div>
          <div class="sm-tab" data-tab="faq">FAQs</div>
        </div>
        <div id="sm-panel-chat" class="sm-panel active">
          <div id="sm-chat-history"></div>
        </div>
        <div id="sm-panel-faq" class="sm-panel">
          <div id="sm-faq-content"></div>
        </div>
        <div id="sm-input-area">
          <input type="text" id="sm-message-input" placeholder="Ask a question..." autocomplete="off">
          <button id="sm-send-btn">Send</button>
        </div>
        <div id="sm-lead-popup">
          <div class="sm-lead-content">
            <h3>Get Updates</h3>
            <p>Please drop your info so we can reach out if needed!</p>
            <input type="text" id="sm-lead-name" placeholder="Your Name">
            <input type="email" id="sm-lead-email" placeholder="Your Email">
            <button id="sm-lead-submit">Continue</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    setupEventListeners();

    if (config.welcomeMessage) appendMessage('bot', config.welcomeMessage);
    triggerLeadCapture(2000);
    renderFaqs();
  }

  // --- EVENTS ---
  function setupEventListeners() {
    const fab = document.getElementById('sm-fab');
    const win = document.getElementById('sm-window');
    const sendBtn = document.getElementById('sm-send-btn');
    const input = document.getElementById('sm-message-input');
    const tabs = document.querySelectorAll('.sm-tab');

    fab.addEventListener('click', () => win.classList.toggle('open'));

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sm-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        document.getElementById(`sm-panel-${currentTab}`).classList.add('active');
      });
    });

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    document.getElementById('sm-lead-submit').addEventListener('click', () => {
      const name = document.getElementById('sm-lead-name').value.trim();
      const email = document.getElementById('sm-lead-email').value.trim();
      if (!name || !email) return alert("Please fill in both fields.");
      safeStorage(`sm_lead_${shop}`, JSON.stringify({ name, email }));
      leadCaptured = true;
      document.getElementById('sm-lead-popup').style.display = 'none';
    });
  }

  function triggerLeadCapture(delay) {
    if (leadCaptured) return;
    setTimeout(() => {
      document.getElementById('sm-lead-popup').style.display = 'flex';
    }, delay);
  }

  function appendMessage(role, text, isIndicator = false) {
    const history = document.getElementById('sm-chat-history');
    const msg = document.createElement('div');
    msg.className = `sm-msg ${role}${isIndicator ? ' sm-indicator' : ''}`;
    msg.textContent = text; // ✅ textContent prevents XSS
    history.appendChild(msg);
    document.getElementById('sm-panel-chat').scrollTop = 99999;
    return msg;
  }

  async function handleSend() {
    const input = document.getElementById('sm-message-input');
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    appendMessage('user', message);
    const thinkingIndicator = appendMessage('bot', `${config.botName} is thinking...`, true);
    const leadInfo = JSON.parse(safeStorage(`sm_lead_${shop}`) || '{}');

    try {
      const response = await fetch(`${appUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          message,
          sessionId: conversationId,
          customerName: leadInfo.name || null,
          customerEmail: leadInfo.email || null
        })
      });

      thinkingIndicator.remove();

      if (!response.ok) {
        appendMessage('bot', "I'm temporarily unavailable, please try again in a moment.");
        return;
      }

      const data = await response.json();
      appendMessage('bot', data.reply);
    } catch {
      thinkingIndicator.remove();
      appendMessage('bot', "I'm temporarily unavailable, please try again in a moment.");
    }
  }

  function renderFaqs() {
    const faqContainer = document.getElementById('sm-faq-content');
    if (!config.capFaqs || !config.faqs || config.faqs.length === 0) {
      faqContainer.innerHTML = `<div style="color:#8e8e93;text-align:center;margin-top:20px;">No FAQs available at the moment.</div>`;
      return;
    }
    // ✅ textContent for XSS-safe FAQ rendering
    config.faqs.forEach(faq => {
      const item = document.createElement('div');
      item.className = 'sm-faq-item';
      const q = document.createElement('div');
      q.className = 'sm-faq-q';
      q.textContent = `Q: ${faq.question}`;
      const a = document.createElement('div');
      a.className = 'sm-faq-a';
      a.textContent = faq.answer;
      item.appendChild(q);
      item.appendChild(a);
      faqContainer.appendChild(item);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();