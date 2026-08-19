(function () {
  const { shop, appUrl, storemateLogo } = window.__storeMate || {};
  if (!shop || !appUrl || !storemateLogo) return;

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

  // Lucide SVG Path Dictionary (Stroke-based 24x24 viewBox)
  const LUCIDE_PATHS = {
    user: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    smile: `<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>`,
    meh: `<circle cx="12" cy="12" r="10"/><line x1="8" x2="16" y1="15" y2="15"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>`,
    frown: `<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>`,
    laugh: `<circle cx="12" cy="12" r="10"/><path d="M18 13a6 6 0 0 1-12 0"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>`,
    thumbsUp: `<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>`,
    star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    heart: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`,
    flame: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
    gift: `<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>`,
    partyPopper: `<path d="M5.8 11.3 2 22l10.7-3.79d"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.64-.7 1.08-1.35.98l-.44-.07c-.7-.11-1.36.31-1.53 1L15 18"/>`,
    rocket: `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>`,
    zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    bot: `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`,
    brain: `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/>`,
    sparkles: `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>`,
    messageCircle: `<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>`,
    headphones: `<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>`,
    gamepad2: `<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><rect width="20" height="12" x="2" y="6" rx="6"/>`,
    bell: `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
    megaphone: `<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>`,
    send: `<line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`,
    ghost: `<path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>`,
    crown: `<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>`,
    moon: `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`,
    sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
    flower2: `<path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1m0 3a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v7m-3-4a3 3 0 1 0 3-3m-3 3a3 3 0 1 1 3-3m-3 3h-7m10 0a3 3 0 1 0-3-3m3 3a3 3 0 1 1-3-3m-3 3h7"/>`,
    leaf: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`,
    flag: `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>`
  };

  function getAvatarDetails(cfg) {
    const raw = cfg.avatarPreset || 'green';
    const PRESET_SVGS = {
      green: { bg: "#22c55e", svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="7" fill="white"/><path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="white"/></svg>` },
      blue: { bg: "#3b82f6", svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="white" stroke-width="2.5"/><circle cx="15" cy="17" r="2" fill="white"/><circle cx="25" cy="17" r="2" fill="white"/><path d="M13 24c1.5 3 12.5 3 14 0" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>` },
      yellow: { bg: "#eab308", svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5l3.9 8.26L33 14.6l-6.5 6.33 1.53 8.94L20 25.5l-8.03 4.37 1.53-8.94L7 14.6l9.1-1.34L20 5z" fill="white"/></svg>` },
      pink: { bg: "#ec4899", svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 34s-14-9.35-14-19a8 8 0 0116 0 8 8 0 0116 0c0 9.65-14 19-14 19z" fill="white"/></svg>` },
      teal: { bg: "#14b8a6", svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="20" height="16" rx="3" fill="white"/><rect x="15" y="19" width="4" height="4" rx="1" fill="#14b8a6"/><rect x="21" y="19" width="4" height="4" rx="1" fill="#14b8a6"/><path d="M20 8v6" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="7" r="2" fill="white"/><path d="M13 30v3M27 30v3" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>` },
      indigo: { bg: "#6366f1", svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20c2-6 4-6 6 0s4 6 6 0 4-6 6 0 4-6 6 0" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>` },
      orange: { bg: "#f97316", svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7a11 11 0 00-11 11c0 4.5 2.5 8 6 10v4h10v-4c3.5-2 6-5.5 6-10A11 11 0 0020 7z" fill="white"/><circle cx="15" cy="18" r="2.5" fill="#f97316"/><circle cx="25" cy="18" r="2.5" fill="#f97316"/><path d="M17 30h6M17 33h6" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/></svg>` }
    };

    if (cfg.logoUrl) {
      return { bg: "#f3f4f6", html: `<img src="${esc(cfg.logoUrl)}" alt="logo" style="width:100%;height:100%;object-fit:cover;" />` };
    }

    if (raw.startsWith('custom:')) {
      const parts = raw.split(':');
      const iconKey = parts[1] || 'user';
      const bgColor = parts[2] || '#6366f1';
      const path = LUCIDE_PATHS[iconKey] || LUCIDE_PATHS.user;
      const html = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:65%;height:65%;">${path}</svg>`;
      return { bg: bgColor, html };
    }

    const matched = PRESET_SVGS[raw] || PRESET_SVGS.green;
    return { bg: matched.bg, html: matched.svg };
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
    const avatar = getAvatarDetails(config || {});
    const styles = `
      #sm-widget { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #sm-fab { width: 50px; height: 50px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.15); color: white; background: ${avatar.bg}; padding: 0px; box-sizing: border-box; overflow: hidden }
      #sm-fab img, #sm-fab svg { width: 100%; height: 100%; object-fit: cover; }
      #sm-window { display: none; width: 320px; height: 500px; max-height: 80vh; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); flex-direction: column; overflow: hidden; position: absolute; bottom: 65px; right: 0; border: 1px solid #e1e3e5; }
      #sm-window.open { display: flex; }
      #sm-header { padding: 12px 14px; background: ${config?.brandColor || '#00A460'}; color: white; display: flex; align-items: center; gap: 10px; }
      .sm-avatar { width: 36px; height: 36px; border-radius: 50%; background: ${avatar.bg}; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
      .sm-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .sm-avatar svg { width: 100%; height: 100%; }
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
      .sm-indicator { font-style: italic; color: #9ca3af; box-shadow: none; background: transparent; border: none; padding: 4px 12px; }
      
      #sm-panel-faq { padding: 0; background: #f4f4f5; }
      .sm-faq-item { border-bottom: 1px solid #e4e4e7; background: #f4f4f5; }
      .sm-faq-q { 
        font-weight: 500; 
        font-size: 13.5px; 
        color: #09090b; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        gap: 16px; 
        padding: 18px 20px; 
        user-select: none; 
        transition: background 0.15s ease;
      }
      .sm-faq-q:hover { background: #ececee; }
      .sm-faq-icon { 
        font-size: 20px; 
        line-height: 1; 
        font-weight: 300; 
        width: 18px; 
        height: 18px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        flex-shrink: 0; 
        color: #18181b; 
      }
      .sm-faq-a-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }
      .sm-faq-item.open .sm-faq-a-wrapper { grid-template-rows: 1fr; }
      .sm-faq-a { overflow: hidden; }
      .sm-faq-a-inner { 
        padding: 0 20px 20px 54px; 
        font-size: 13px; 
        color: #27272a; 
        line-height: 1.6; 
        font-weight: 400; 
      }

      .sm-track-container { padding: 16px; background: #f9fafb; }
      .sm-track-card { background: white; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.03); margin-bottom: 16px; }
      .sm-track-card p { font-size: 13px; color: #6b7280; margin: 0 0 16px 0; text-align: center; }
      .sm-form-input { width: 100%; padding: 10px 12px; margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; box-sizing: border-box; font-size: 13px; outline: none; transition: border-color 0.2s; }
      .sm-form-input:focus { border-color: ${config?.brandColor || '#00A460'}; }
      .sm-btn-primary { width: 100%; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; background: ${config?.brandColor || '#00A460'}; color: white; transition: opacity 0.2s; }
      .sm-btn-primary:hover { opacity: 0.9; }

      #sm-track-result { display: none; font-size: 13px; line-height: 1.6; color: #111; white-space: pre-wrap; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
      #sm-track-result.show { display: block; animation: sm-fade-in 0.3s ease; }
      @keyframes sm-fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

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

    const avatar = getAvatarDetails(config);
    const fabHtml = storemateLogo ? `<img src="${storemateLogo}" />` : avatar.html;

    container.innerHTML = `
      <button id="sm-fab">${fabHtml}</button>
      <div id="sm-window">
        <div id="sm-header">
          <div class="sm-avatar">${avatar.html}</div>
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
          ${config.capFaqs ? `<div class="sm-tab" data-tab="faq">FAQs</div>` : ''}
          ${config.capOrderTracking ? `<div class="sm-tab" data-tab="track">Track</div>` : ''}
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
    } catch (e) { }

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
        e.target.remove();
        if (container.childNodes.length === 0) {
          container.remove();
        }
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
      resultEl.classList.add('show');

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
    const msg = document.createElement('div');
    msg.className = `sm-msg ${role}${isIndicator ? ' sm-indicator' : ''}`;

    const safeText = esc(text);
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    msg.innerHTML = safeText.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; font-weight: 600;">$1</a>'
    );

    history.appendChild(msg);

    const starterContainer = document.getElementById('sm-starter-container');
    if (starterContainer) {
      history.appendChild(starterContainer);
    }

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

    faqContainer.innerHTML = '';

    config.faqs.forEach(faq => {
      const item = document.createElement('div');
      item.className = 'sm-faq-item';

      const q = document.createElement('div');
      q.className = 'sm-faq-q';
      q.innerHTML = `<span class="sm-faq-icon">+</span><span>${esc(faq.question)}</span>`;

      const aWrapper = document.createElement('div');
      aWrapper.className = 'sm-faq-a-wrapper';
      const a = document.createElement('div');
      a.className = 'sm-faq-a';
      a.innerHTML = `<div class="sm-faq-a-inner">${esc(faq.answer)}</div>`;
      aWrapper.appendChild(a);

      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.sm-faq-item').forEach(i => {
          i.classList.remove('open');
          const icon = i.querySelector('.sm-faq-icon');
          if (icon) icon.textContent = '+';
        });

        if (!isOpen) {
          item.classList.add('open');
          q.querySelector('.sm-faq-icon').textContent = '—';
        }
      });
      item.appendChild(q);
      item.appendChild(aWrapper);
      faqContainer.appendChild(item);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();