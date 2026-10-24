/*
 * Momentum Data website chat.
 *
 *   <script src="https://app.momentumdatasolutions.com/chat-widget.js" data-key="mds-website" defer></script>
 *
 * Draws a chat bubble that talks to CPSM's /api/chat/* routes. Each chat is
 * a Service Desk ticket the team answers from the Live Chat inbox. The
 * browser keeps one random token per chat in localStorage; that token is the
 * visitor's only credential.
 *
 * Opens itself on ?chat=open or #chat, and from any element with
 * data-open-chat. window.MomentumChat.open() / .close() for everything else.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || window.MomentumChat) return;

  var KEY = script.getAttribute("data-key") || "";
  var API = (script.getAttribute("data-api") || new URL(script.src).origin).replace(/\/+$/, "");
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(KEY)) return;

  var OPEN_POLL_MS = 4000;
  var CLOSED_POLL_MS = 30000;
  var store = {
    get: function (k) {
      try { return window.localStorage.getItem("mds-chat:" + KEY + ":" + k); } catch (e) { return null; }
    },
    set: function (k, v) {
      try {
        if (v === null) window.localStorage.removeItem("mds-chat:" + KEY + ":" + k);
        else window.localStorage.setItem("mds-chat:" + KEY + ":" + k, v);
      } catch (e) { /* private mode: chat still works for this page view */ }
    }
  };

  var state = {
    config: null,
    token: store.get("token"),
    messages: [],
    status: null,
    open: false,
    ended: false,
    sending: false,
    error: "",
    timer: null
  };

  function api(path, options) {
    options = options || {};
    var headers = { "Content-Type": "application/json" };
    if (options.auth && state.token) headers.Authorization = "Bearer " + state.token;
    return fetch(API + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "omit"
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { status: res.status, ok: res.ok, data: data };
      });
    });
  }

  // ---------------------------------------------------------------------------
  // DOM (inside a shadow root so the site's CSS can't touch it, and vice versa)
  // ---------------------------------------------------------------------------

  var host, root, els = {};

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "class") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function css(accent) {
    return [
      ":host{all:initial}",
      "*{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}",
      ".bubble{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:" + accent + ";color:#fff;box-shadow:0 8px 24px rgba(15,23,42,.25);display:flex;align-items:center;justify-content:center;transition:transform .15s}",
      ".bubble:hover{transform:scale(1.06)}",
      ".bubble:focus-visible,.send:focus-visible,.close:focus-visible,.start:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}",
      ".bubble svg{width:28px;height:28px}",
      ".badge{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#c2410c;color:#fff;font-size:12px;font-weight:700;line-height:20px;text-align:center}",
      ".panel{position:fixed;right:20px;bottom:92px;z-index:2147483000;width:370px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:#fff;color:#0f172a;border-radius:16px;box-shadow:0 16px 48px rgba(15,23,42,.28);display:flex;flex-direction:column;overflow:hidden}",
      ".panel[hidden]{display:none}",
      ".head{background:" + accent + ";color:#fff;padding:16px 18px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}",
      ".title{font-size:16px;font-weight:700;margin:0}",
      ".sub{font-size:12.5px;opacity:.9;margin:4px 0 0}",
      ".close{background:transparent;border:0;color:#fff;cursor:pointer;font-size:22px;line-height:1;padding:2px 4px;border-radius:6px}",
      ".body{flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;gap:10px}",
      ".msg{max-width:82%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}",
      ".msg.visitor{align-self:flex-end;background:" + accent + ";color:#fff;border-bottom-right-radius:4px}",
      ".msg.team{align-self:flex-start;background:#fff;border:1px solid #e2e8f0;border-bottom-left-radius:4px}",
      ".meta{font-size:11px;color:#64748b;margin:0 4px}",
      ".meta.visitor{align-self:flex-end}",
      ".note{font-size:12.5px;color:#475569;background:#eef4ff;border-radius:10px;padding:10px 12px;line-height:1.45}",
      ".greet{font-size:14px;line-height:1.5;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px}",
      "form{display:flex;flex-direction:column;gap:10px}",
      "label{font-size:12.5px;font-weight:600;color:#334155;display:flex;flex-direction:column;gap:4px}",
      "input,textarea{font-size:14px;border:1px solid #cbd5e1;border-radius:10px;padding:9px 11px;color:#0f172a;background:#fff;width:100%}",
      "input:focus,textarea:focus{outline:2px solid " + accent + ";outline-offset:0;border-color:transparent}",
      "textarea{resize:none}",
      ".hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}",
      ".start,.send{background:" + accent + ";color:#fff;border:0;border-radius:10px;padding:10px 14px;font-size:14px;font-weight:700;cursor:pointer}",
      ".start[disabled],.send[disabled]{opacity:.6;cursor:default}",
      ".foot{border-top:1px solid #e2e8f0;padding:10px;display:flex;gap:8px;align-items:flex-end;background:#fff}",
      ".foot textarea{max-height:120px}",
      ".foot[hidden]{display:none}",
      ".err{color:#b91c1c;font-size:12.5px;margin:0;padding:0 12px 8px;background:#fff}",
      ".err:empty{display:none}",
      ".fine{font-size:11px;color:#64748b;margin:0;text-align:center}",
      "@media (max-width:480px){.panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100%;max-height:100%;border-radius:0}.bubble.is-open{display:none}}"
    ].join("");
  }

  var CHAT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  var CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function build() {
    var cfg = state.config;
    host = el("div", { id: "mds-chat-widget" });
    root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    root.appendChild(el("style", { text: css(cfg.accent_color) }));

    els.bubble = el("button", { class: "bubble", type: "button", "aria-label": "Open chat", "aria-expanded": "false" });
    els.bubble.innerHTML = CHAT_ICON;
    els.badge = el("span", { class: "badge", hidden: "" });
    els.bubble.appendChild(els.badge);

    els.close = el("button", { class: "close", type: "button", "aria-label": "Minimize chat", text: "×" });
    els.panel = el("div", { class: "panel", role: "dialog", "aria-label": cfg.title, hidden: "" }, [
      el("div", { class: "head" }, [
        el("div", null, [el("p", { class: "title", text: cfg.title }), el("p", { class: "sub", text: "We reply here, and by email if you step away." })]),
        els.close
      ]),
      (els.body = el("div", { class: "body", "aria-live": "polite" })),
      (els.error = el("p", { class: "err", role: "alert" })),
      (els.foot = el("div", { class: "foot" }))
    ]);

    root.appendChild(els.panel);
    root.appendChild(els.bubble);
    document.body.appendChild(host);

    els.bubble.addEventListener("click", function () { state.open ? close() : open(); });
    els.close.addEventListener("click", close);
    els.panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function setError(message) {
    state.error = message || "";
    if (els.error) els.error.textContent = state.error;
  }

  function timeLabel(iso) {
    try { return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; }
  }

  function render() {
    els.body.innerHTML = "";
    els.foot.innerHTML = "";
    if (!state.token || state.ended) renderStart();
    else renderThread();
  }

  function renderStart() {
    els.foot.hidden = true;
    if (state.ended) {
      els.body.appendChild(el("p", { class: "note", text: "That chat has ended. Send a new message and we'll pick it up." }));
    }
    els.body.appendChild(el("div", { class: "greet", text: state.config.greeting }));

    var name = el("input", { name: "name", type: "text", autocomplete: "name", maxlength: "120" });
    var email = el("input", { name: "email", type: "email", autocomplete: "email", required: "", maxlength: "254" });
    var message = el("textarea", { name: "message", rows: "4", required: "", maxlength: "4000" });
    var honeypot = el("input", { name: "website", type: "text", tabindex: "-1", autocomplete: "off" });
    name.value = store.get("name") || "";
    email.value = store.get("email") || "";

    var submit = el("button", { class: "start", type: "submit", text: "Start chat" });
    var form = el("form", { novalidate: "" }, [
      el("label", null, [document.createTextNode("Your name"), name]),
      el("label", null, [document.createTextNode("Email (so we can reach you)"), email]),
      el("label", null, [document.createTextNode("How can we help?"), message]),
      el("div", { class: "hp", "aria-hidden": "true" }, [el("label", null, [document.createTextNode("Website"), honeypot])]),
      submit,
      el("p", { class: "fine", text: "By chatting you agree we can email you about this conversation." })
    ]);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (state.sending) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError("Enter a valid email so we can reach you."); email.focus(); return; }
      if (!message.value.trim()) { setError("Type a message first."); message.focus(); return; }
      setError("");
      state.sending = true;
      submit.disabled = true;
      submit.textContent = "Starting…";
      api("/api/chat/start", {
        method: "POST",
        body: {
          key: KEY,
          name: name.value.trim(),
          email: email.value.trim(),
          message: message.value,
          page_url: window.location.href.slice(0, 2000),
          website: honeypot.value
        }
      }).then(function (res) {
        state.sending = false;
        if (!res.ok) {
          submit.disabled = false;
          submit.textContent = "Start chat";
          setError(res.data.error || "We couldn't start the chat. Please try again.");
          return;
        }
        store.set("name", name.value.trim());
        store.set("email", email.value.trim());
        store.set("token", res.data.token);
        state.token = res.data.token;
        state.ended = false;
        applyConversation(res.data);
        render();
        schedule();
      }).catch(function () {
        state.sending = false;
        submit.disabled = false;
        submit.textContent = "Start chat";
        setError("You seem to be offline. Check your connection and try again.");
      });
    });

    els.body.appendChild(form);
    if (state.open) setTimeout(function () { (email.value ? message : name).focus(); }, 0);
  }

  function renderThread() {
    els.foot.hidden = false;
    renderMessages();
    renderComposer();
  }

  /** Just the conversation, so a reply arriving mid-typing leaves the composer alone. */
  function renderMessages() {
    var nearBottom = els.body.scrollHeight - els.body.scrollTop - els.body.clientHeight < 80;
    els.body.innerHTML = "";
    var lastFrom = null;
    state.messages.forEach(function (m) {
      if (m.from !== lastFrom) {
        var who = m.from === "team" ? (m.name || "Momentum Data") : "You";
        els.body.appendChild(el("p", { class: "meta " + m.from, text: who + " · " + timeLabel(m.at) }));
      }
      els.body.appendChild(el("div", { class: "msg " + m.from, text: m.body }));
      lastFrom = m.from;
    });

    var hasReply = state.messages.some(function (m) { return m.from === "team"; });
    if (!hasReply) {
      var email = store.get("email");
      els.body.appendChild(el("p", {
        class: "note",
        text: "Thanks! You're in our queue and someone will reply here shortly." + (email ? " If you leave, we'll email you at " + email + "." : "")
      }));
    }
    if (state.status === "resolved") {
      els.body.appendChild(el("p", { class: "note", text: "We've marked this as resolved. Reply if there's anything else and it reopens." }));
    }
    if (nearBottom || state.sending) els.body.scrollTop = els.body.scrollHeight;
  }

  function renderComposer() {
    els.foot.innerHTML = "";
    var input = el("textarea", { rows: "1", placeholder: "Write a message…", "aria-label": "Message", maxlength: "4000" });
    var draft = store.get("draft");
    if (draft) input.value = draft;
    var send = el("button", { class: "send", type: "button", "aria-label": "Send message", text: "Send" });
    els.foot.appendChild(input);
    els.foot.appendChild(send);

    function submit() {
      var text = input.value;
      if (!text.trim() || state.sending) return;
      state.sending = true;
      send.disabled = true;
      setError("");
      api("/api/chat/messages", { method: "POST", auth: true, body: { message: text } }).then(function (res) {
        state.sending = false;
        send.disabled = false;
        if (res.status === 404 || res.status === 410) { endConversation(); return; }
        if (!res.ok) { setError(res.data.error || "Your message didn't send. Please try again."); return; }
        store.set("draft", null);
        input.value = "";
        input.style.height = "auto";
        applyConversation(res.data);
        renderMessages();
        els.body.scrollTop = els.body.scrollHeight;
      }).catch(function () {
        state.sending = false;
        send.disabled = false;
        setError("You seem to be offline. Your message wasn't sent.");
      });
    }

    send.addEventListener("click", submit);
    input.addEventListener("input", function () {
      store.set("draft", input.value || null);
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    });

    els.body.scrollTop = els.body.scrollHeight;
    if (state.open) setTimeout(function () { input.focus(); }, 0);
  }

  // ---------------------------------------------------------------------------
  // Conversation state
  // ---------------------------------------------------------------------------

  function lastTeamId(messages) {
    for (var i = messages.length - 1; i >= 0; i--) if (messages[i].from === "team") return messages[i].id;
    return null;
  }

  function unreadCount() {
    var seen = store.get("seen");
    var count = 0;
    for (var i = state.messages.length - 1; i >= 0; i--) {
      var m = state.messages[i];
      if (m.id === seen) break;
      if (m.from === "team") count++;
    }
    return count;
  }

  function updateBadge() {
    if (!els.badge) return;
    var n = state.open ? 0 : unreadCount();
    if (n > 0) { els.badge.textContent = String(n); els.badge.hidden = false; }
    else els.badge.hidden = true;
  }

  function markSeen() {
    var id = lastTeamId(state.messages);
    if (id) store.set("seen", id);
    updateBadge();
  }

  function applyConversation(data) {
    state.messages = data.messages || [];
    state.status = data.status || null;
    if (state.open) markSeen();
    else updateBadge();
  }

  function endConversation() {
    store.set("token", null);
    store.set("seen", null);
    store.set("draft", null);
    state.token = null;
    state.messages = [];
    state.ended = true;
    render();
  }

  function poll() {
    if (!state.token || document.hidden) return schedule();
    var before = state.messages.length;
    api("/api/chat/messages", { auth: true }).then(function (res) {
      if (res.status === 404 || res.status === 410) { endConversation(); return; }
      if (res.ok) {
        var changed = (res.data.messages || []).length !== before || res.data.status !== state.status;
        applyConversation(res.data);
        if (changed && state.open && !state.ended) renderMessages();
      }
      schedule();
    }).catch(schedule);
  }

  function schedule() {
    clearTimeout(state.timer);
    if (!state.token) return;
    state.timer = setTimeout(poll, state.open ? OPEN_POLL_MS : CLOSED_POLL_MS);
  }

  function open() {
    if (!els.panel) return;
    state.open = true;
    els.panel.hidden = false;
    els.bubble.classList.add("is-open");
    els.bubble.setAttribute("aria-expanded", "true");
    els.bubble.setAttribute("aria-label", "Close chat");
    els.bubble.innerHTML = CLOSE_ICON;
    els.bubble.appendChild(els.badge);
    markSeen();
    render();
    if (state.token) poll();
  }

  function close() {
    if (!els.panel) return;
    state.open = false;
    els.panel.hidden = true;
    els.bubble.classList.remove("is-open");
    els.bubble.setAttribute("aria-expanded", "false");
    els.bubble.setAttribute("aria-label", "Open chat");
    els.bubble.innerHTML = CHAT_ICON;
    els.bubble.appendChild(els.badge);
    updateBadge();
    schedule();
    els.bubble.focus();
  }

  function wantsOpen() {
    var params = new URLSearchParams(window.location.search);
    return params.get("chat") === "open" || window.location.hash === "#chat";
  }

  // Calls made before the config loads are remembered and replayed.
  var pendingOpen = false;
  window.MomentumChat = {
    open: function () { if (els.panel) open(); else pendingOpen = true; },
    close: function () { pendingOpen = false; close(); }
  };

  document.addEventListener("click", function (e) {
    var target = e.target && e.target.closest ? e.target.closest("[data-open-chat]") : null;
    if (!target) return;
    e.preventDefault();
    window.MomentumChat.open();
  });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.token) poll();
  });

  function start() {
    api("/api/chat/config?key=" + encodeURIComponent(KEY)).then(function (res) {
      if (!res.ok) return; // Chat is off or not allowed on this site: stay invisible.
      state.config = res.data;
      build();
      if (state.token) poll();
      if (pendingOpen || wantsOpen()) open();
    }).catch(function () { /* API unreachable: no bubble rather than a broken one */ });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
