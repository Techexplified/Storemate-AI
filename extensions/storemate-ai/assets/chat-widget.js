(function () {
  const { shop, appUrl } = window.__storeMate || {};
  if (!shop || !appUrl) return;

  if (document.getElementById('sm-widget')) return;

  let config = null;
  let conversationId = sessionStorage.getItem('sm_session') || crypto.randomUUID();
  sessionStorage.setItem('sm_session', conversationId);
  let leadCaptured = safeStorage(`sm_lead_${shop}`) !== null;
  let currentTab = 'chat';

  function safeStorage(key, value) {
    try {
      if (value !== undefined) localStorage.setItem(key, value);
      return localStorage.getItem(key);
    } catch { return null; }
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  async function init() {
    try {
      const response = await fetch(`${appUrl}/api/config?shop=${shop}`);
      const data = await response.json();
      config = data || { botName: "Aria", brandColor: "#00A460", capFaqs: true, capOrderTracking: true };
      injectStyles();
      renderWidget(config);
    } catch (e) {
      console.error("StoreMate initialization failed:", e);
    }
  }

  function injectStyles() {
    const styles = `
      #sm-widget { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #sm-fab { width: 50px; height: 50px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: none; color: white; background: ${config?.brandColor || '#00A460'}; padding: 10px; box-sizing: border-box; }
      #sm-fab svg, #sm-fab img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
      #sm-window { display: none; width: 320px; height: 500px; max-height: 80vh; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); flex-direction: column; overflow: hidden; position: absolute; bottom: 65px; right: 0; border: 1px solid #e1e3e5; }
      #sm-window.open { display: flex; }
      #sm-header { padding: 12px 14px; background: ${config?.brandColor || '#00A460'}; color: white; display: flex; align-items: center; gap: 10px; }
      .sm-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
      .sm-avatar img, .sm-avatar svg { width: 100%; height: 100%; object-fit: cover; }
      #sm-tabs { display: flex; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; }
      .sm-tab { flex: 1; text-align: center; padding: 8px; cursor: pointer; font-size: 12px; color: #6b7280; font-weight: 500; border-bottom: 2px solid transparent; }
      .sm-tab.active { color: ${config?.brandColor || '#00A460'}; border-bottom-color: ${config?.brandColor || '#00A460'}; font-weight: 600; background: white; }
      .sm-panel { flex: 1; display: none; overflow-y: auto; padding: 12px; background: #f9fafb; }
      .sm-panel.active { display: flex; flexDirection: column; display: block; }
      .sm-msg { margin-bottom: 10px; max-width: 85%; padding: 10px 12px; border-radius: 12px; font-size: 12px; line-height: 1.4; word-break: break-word; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .sm-msg.user { background: ${config?.brandColor || '#00A460'}; color: white; margin-left: auto; border-top-right-radius: 4px; }
      .sm-msg.bot { background: white; color: #111; margin-right: auto; border-top-left-radius: 4px; border: 1px solid #e5e7eb; }
      #sm-input-area { display: flex; padding: 10px 12px; border-top: 1px solid #e1e3e5; background: white; align-items: center; gap: 8px; }
      #sm-message-input { flex: 1; padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 20px; outline: none; font-size: 12px; color: #111; }
      #sm-message-input::placeholder { color: #9ca3af; }
      #sm-send-btn { width: 28px; height: 28px; border-radius: 50%; background: ${config?.brandColor || '#00A460'}; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; padding: 0; }
      #sm-lead-popup { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: none; align-items: center; justify-content: center; padding: 16px; z-index: 10; }
      .sm-lead-content { background: white; padding: 16px; border-radius: 12px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
      .sm-lead-content h3 { font-size: 14px; margin: 0 0 6px 0; color: #111; }
      .sm-lead-content p { font-size: 12px; margin: 0 0 12px 0; color: #6b7280; }
      .sm-lead-content input { width: 100%; padding: 8px 10px; margin-bottom: 8px; border: 1px solid #e5e7eb; border-radius: 6px; box-sizing: border-box; font-size: 12px; }
      .sm-lead-actions { display: flex; gap: 8px; }
      .sm-lead-actions button { flex: 1; padding: 8px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; }
      #sm-lead-popup-skip { background: #f3f4f6; color: #4b5563; }
      #sm-lead-submit { background: ${config?.brandColor || '#00A460'}; color: white; }
      .sm-indicator { font-style: italic; color: #9ca3af; box-shadow: none; background: transparent; border: none; padding: 4px 0; }
      
      /* Accordion FAQ styles */
      .sm-faq-item { background: white; margin-bottom: 8px; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
      .sm-faq-q { font-weight: 600; padding: 10px 12px; font-size: 12px; color: #111; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: white; user-select: none; }
      .sm-faq-q::after { content: '▾'; font-size: 12px; color: #9ca3af; transition: transform 0.2s; }
      .sm-faq-item.open .sm-faq-q::after { transform: rotate(180deg); }
      .sm-faq-a { display: none; padding: 10px 12px; font-size: 12px; color: #4b5563; border-top: 1px solid #f3f4f6; background: #fafafa; line-height: 1.4; }
      .sm-faq-item.open .sm-faq-a { display: block; }

      /* Track Panel UI Upgrades */
      .sm-track-container { padding: 16px; background: #f9fafb; }
      .sm-track-card { background: white; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.03); margin-bottom: 16px; }
      .sm-track-card p { font-size: 13px; color: #6b7280; margin: 0 0 16px 0; text-align: center; }
      .sm-form-input { width: 100%; padding: 10px 12px; margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; box-sizing: border-box; font-size: 13px; outline: none; transition: border-color 0.2s; }
      .sm-form-input:focus { border-color: ${config?.brandColor || '#00A460'}; }
      .sm-btn-primary { width: 100%; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; background: ${config?.brandColor || '#00A460'}; color: white; transition: opacity 0.2s; }
      .sm-btn-primary:hover { opacity: 0.9; }

      /* The 'white-space: pre-wrap' is the magic bullet that respects backend newlines */
      #sm-track-result { display: none; font-size: 13px; line-height: 1.6; color: #111; white-space: pre-wrap; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
      #sm-track-result.show { display: block; animation: sm-fade-in 0.3s ease; }
      @keyframes sm-fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

      /* Starter Prompts UI */
      .sm-starter-prompts { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 5px; margin-bottom: 10px; }
      .sm-starter-btn { background: white; border: 1px solid ${config?.brandColor || '#00A460'}; border-radius: 20px; padding: 5px 12px; font-size: 11px; color: ${config?.brandColor || '#00A460'}; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
      .sm-starter-btn:hover { background: ${config?.brandColor || '#00A460'}; color: white; }
    `;
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);
  }

  function renderWidget(config) {
    const container = document.createElement('div');
    container.id = 'sm-widget';

    const AVATARS = {
      green: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="7" fill="white"/><path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="white"/></svg>`,
      blue: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="white" stroke-width="2.5"/><circle cx="15" cy="17" r="2" fill="white"/><circle cx="25" cy="17" r="2" fill="white"/><path d="M13 24c1.5 3 12.5 3 14 0" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
      yellow: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5l3.9 8.26L33 14.6l-6.5 6.33 1.53 8.94L20 25.5l-8.03 4.37 1.53-8.94L7 14.6l9.1-1.34L20 5z" fill="white"/></svg>`,
      pink: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 34s-14-9.35-14-19a8 8 0 0116 0 8 8 0 0116 0c0 9.65-14 19-14 19z" fill="white"/></svg>`,
      teal: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="20" height="16" rx="3" fill="white"/><rect x="15" y="19" width="4" height="4" rx="1" fill="#14b8a6"/><rect x="21" y="19" width="4" height="4" rx="1" fill="#14b8a6"/><path d="M20 8v6" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="7" r="2" fill="white"/><path d="M13 30v3M27 30v3" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
      indigo: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4 6 6 0" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
      orange: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7a11 11 0 00-11 11c0 4.5 2.5 8 6 10v4h10v-4c3.5-2 6-5.5 6-10A11 11 0 0020 7z" fill="white"/><circle cx="15" cy="18" r="2.5" fill="#f97316"/><circle cx="25" cy="18" r="2.5" fill="#f97316"/><path d="M17 30h6M17 33h6" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/></svg>`
    };

    const logoHtml = config.logoUrl
      ? `<img src="${esc(config.logoUrl)}" alt="logo" />`
      : AVATARS[config.avatarPreset] || AVATARS.green;

    container.innerHTML = `
      <button id="sm-fab">${logoHtml}</button>
      <div id="sm-window">
        <div id="sm-header">
          <div class="sm-avatar">${logoHtml}</div>
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 600;">${esc(config.botName || 'Aria')}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.8);">● Online</div>
          </div>
          <div style="display: flex; gap: 8px; font-size: 16px; opacity: 0.8; cursor: pointer; user-select: none;">
            <span id="sm-minimize">−</span>
          </div>
        </div>
        <div id="sm-tabs">
          <div class="sm-tab active" data-tab="chat">Chat</div>
          ${ config.capFaqs ? `<div class="sm-tab" data-tab="faq">FAQs</div>` : ''}
          ${ config.capOrderTracking ? `<div class="sm-tab" data-tab="track">Track</div>` : ''}
        </div>
        <div id="sm-panel-chat" class="sm-panel active">
          <div id="sm-chat-history"></div>
        </div>
        <div id="sm-panel-faq" class="sm-panel">
          <div id="sm-faq-content"></div>
        </div>
        <div id="sm-panel-track" class="sm-panel sm-track-container">
          <div class="sm-track-card">
            <p>Enter your details to get your latest order status.</p>
            <input type="text" id="sm-track-order" placeholder="Order number (e.g. #1020)" class="sm-form-input">
            <input type="email" id="sm-track-email" placeholder="Email used at checkout" class="sm-form-input">
            <button id="sm-track-submit" class="sm-btn-primary">Track Order</button>
          </div>
          <div id="sm-track-result"></div>
        </div>
        <div id="sm-input-area">
          <input type="text" id="sm-message-input" placeholder="Message ${esc(config.botName || 'Aria')}..." autocomplete="off">
          <button id="sm-send-btn">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div id="sm-lead-popup">
          <div class="sm-lead-content">
            <h3>Get Updates</h3>
            <p>Please drop your info so we can reach out if needed!</p>
            <input type="text" id="sm-lead-name" placeholder="Your Name">
            <input type="email" id="sm-lead-email" placeholder="Your Email">
            <div class="sm-lead-actions">
              <button id="sm-lead-popup-skip">Skip</button>
              <button id="sm-lead-submit">Continue</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    setupEventListeners();

    if (config.welcomeMessage) appendMessage('bot', config.welcomeMessage);
    renderStarterPrompts();
    triggerLeadCapture(2000);
    renderFaqs();
  }

function renderStarterPrompts() {
    let prompts = [];
    try {
      prompts = typeof config.starterPrompts === 'string' ? JSON.parse(config.starterPrompts) : config.starterPrompts;
    } catch(e) {}
  
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) return;
  
    const history = document.getElementById('sm-chat-history');
    const container = document.createElement('div');
    container.className = 'sm-starter-prompts';
    container.id = 'sm-starter-container'; 
  
    prompts.forEach(promptText => {
      if (!promptText.trim()) return;
      
      const btn = document.createElement('button');
      btn.className = 'sm-starter-btn';
      btn.textContent = promptText;
      
      btn.addEventListener('click', (e) => {
        const input = document.getElementById('sm-message-input');
        input.value = promptText;
        
        // Remove ONLY the clicked button
        e.target.remove();
        
        // Remove the container if no buttons are left
        if (container.childNodes.length === 0) {
          container.remove();
        }
  
        // Trigger the send action
        handleSend(); 
      });
      
      container.appendChild(btn);
    });
  
    if (container.childNodes.length > 0) {
      history.appendChild(container);
      document.getElementById('sm-panel-chat').scrollTop = 99999;
    }
  }

  function setupEventListeners() {
    const fab = document.getElementById('sm-fab');
    const win = document.getElementById('sm-window');
    const minBtn = document.getElementById('sm-minimize');
    const sendBtn = document.getElementById('sm-send-btn');
    const input = document.getElementById('sm-message-input');
    const tabs = document.querySelectorAll('.sm-tab');

    const toggleWin = () => win.classList.toggle('open');
    fab.addEventListener('click', toggleWin);
    minBtn.addEventListener('click', toggleWin);

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

    document.getElementById('sm-lead-popup-skip').addEventListener('click', () => {
      document.getElementById('sm-lead-popup').style.display = 'none';
    });

    document.getElementById('sm-track-submit').addEventListener('click', async () => {
      const orderNumber = document.getElementById('sm-track-order').value.trim();
      const email = document.getElementById('sm-track-email').value.trim();
      const resultEl = document.getElementById('sm-track-result');
      
      if (!orderNumber || !email) { 
        resultEl.textContent = "Please fill in both fields."; 
        resultEl.classList.add('show');
        return; 
      }

      resultEl.textContent = "Looking up your order...";
      resultEl.classList.add('show'); // Make the result box visible while loading
      
      try {
        const response = await fetch(`${appUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop, sessionId: conversationId, orderLookup: { orderNumber, email } })
        });
        const data = await response.json();
        resultEl.textContent = response.ok ? data.reply : "Something went wrong. Please try again.";
      } catch {
        resultEl.textContent = "I'm temporarily unavailable, please try again in a moment.";
      }
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
    
    // 1. Create and add the new message bubble
    const msg = document.createElement('div');
    msg.className = `sm-msg ${role}${isIndicator ? ' sm-indicator' : ''}`;
    msg.textContent = text;
    history.appendChild(msg);

    // 2. Grab the starter prompts container and force it to the bottom
    const starterContainer = document.getElementById('sm-starter-container');
    if (starterContainer) {
      history.appendChild(starterContainer); 
    }

    // 3. Scroll to the bottom
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
          messages: [{ role: "user", content: message }],
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
      faqContainer.innerHTML = `<div style="color:#8e8e93;text-align:center;margin-top:20px;font-size:12px;">No FAQs available at the moment.</div>`;
      return;
    }

    faqContainer.innerHTML = ''; // Clear preview data securely
    
    config.faqs.forEach(faq => {
      const item = document.createElement('div');
      item.className = 'sm-faq-item';
      
      const q = document.createElement('div');
      q.className = 'sm-faq-q';
      q.textContent = faq.question;
      
      const a = document.createElement('div');
      a.className = 'sm-faq-a';
      a.textContent = faq.answer;

      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Optional: Close other opened items for accurate accordion behavior
        document.querySelectorAll('.sm-faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });

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