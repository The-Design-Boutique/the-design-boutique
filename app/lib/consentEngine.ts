/**
 * The consent gate engine, as source to be inlined in the document.
 *
 * This is a string rather than a module, and that is not laziness. The engine
 * has to have replaced the browser's network primitives before the first tag on
 * the page gets a chance to use them. Anything imported, bundled or hydrated
 * runs too late by definition: by the time React is awake, a pixel in the head
 * has already fired. So it ships as a synchronous inline script, first thing on
 * the page, and everything else is arranged around that constraint.
 *
 * It is deliberately ES5 and dependency-free for the same reason. It runs before
 * any polyfill, in whatever browser turned up.
 *
 * What it does NOT do is draw anything. The WordPress original builds its own
 * banner in vanilla DOM because WordPress has no view layer to borrow. Here the
 * banner is a React component that talks to the API this exposes, which keeps
 * the markup consistent with the rest of the site and means there is only one
 * place that knows what a button looks like.
 *
 * Ported from Privacy Choices v2.1.1 (assets/consent-gate.js).
 */

/**
 * The engine source.
 *
 * Configuration arrives on window.PCGATE_CONFIG, printed immediately above this
 * by the server. The blocklist arrives fully merged, so this file contains no
 * copy of it: see app/lib/consent.ts, which is where it lives and is tested.
 */
export const CONSENT_ENGINE_SRC = String.raw`
(function () {
  'use strict';
  if (window.__PCGATE__) { return; }

  var cfg = window.PCGATE_CONFIG || {};
  var COOKIE = cfg.cookieName || 'privacy_choices_consent';
  var COOKIE_DAYS = parseInt(cfg.cookieDays, 10) || 180;
  var POLICY = parseInt(cfg.policyVersion, 10) || 1;
  var BLOCKLIST = cfg.blocklist || {};
  var CATS = cfg.categories || ['analytics', 'advertising', 'functional', 'session_replay'];
  /* Every category the engine knows how to deny, regardless of which are shown
     in the UI. Hiding a category must never mean quietly allowing it. */
  var ALL_CATS = ['analytics', 'advertising', 'functional', 'session_replay'];
  var HONOR_GPC = cfg.honorGpc !== false;
  /* Health-intent page: hold every non-necessary tag off whatever is stored. */
  var HARD_BLOCK = cfg.hardBlock === true;

  /* Global Privacy Control. A browser-level "do not sell or share" signal that
     several US states make legally binding, so it is treated as a choice the
     visitor has already made rather than as a preference to be confirmed. */
  var gpc = HONOR_GPC && (
    navigator.globalPrivacyControl === true ||
    (navigator.globalPrivacyControl && String(navigator.globalPrivacyControl) === 'true')
  ) ? 1 : 0;

  /* ---- URL classification (mirrors app/lib/consent.ts, which holds the tests) ---- */

  function normalizeUrl(url) {
    if (url == null) { return ''; }
    var s = String(url);
    if (s === '') { return ''; }
    s = s.replace(/^[a-z][a-z0-9+.-]*:/i, '');
    s = s.replace(/^\/\//, '');
    s = s.split('#')[0].split('?')[0];
    return s.toLowerCase();
  }

  function classify(url) {
    var hp = normalizeUrl(url);
    if (hp === '') { return ''; }
    for (var k in BLOCKLIST) {
      if (Object.prototype.hasOwnProperty.call(BLOCKLIST, k) && hp.indexOf(k) !== -1) {
        return BLOCKLIST[k];
      }
    }
    return '';
  }

  /* ---- Stored state ---- */

  function readCookie() {
    var raw;
    /* document.cookie throws in a sandboxed or opaque-origin frame. Losing the
       stored choice there is acceptable; losing the engine is not. */
    try { raw = document.cookie; } catch (e) { return null; }
    var m = raw.match(new RegExp('(?:^|;\\s*)' + COOKIE.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    if (!m) { return null; }
    try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
  }

  function writeCookie(s) {
    var d = new Date();
    d.setTime(d.getTime() + COOKIE_DAYS * 864e5);
    var secure = location.protocol === 'https:' ? ';Secure' : '';
    try {
      document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(s)) +
        ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax' + secure;
    } catch (e) { /* denied: the choice still governs this page view */ }
  }

  function blankState() {
    var s = { v: 1, necessary: 1, gpc: gpc, policy: POLICY, action: 'reject', ts: 0 };
    for (var i = 0; i < ALL_CATS.length; i++) { s[ALL_CATS[i]] = 0; }
    return s;
  }

  /* The denials no code path may undo.
     Necessary is always on. GPC denies sale/share and the categories that feed
     it. A health-intent page denies everything non-necessary, including
     functional, because consent does not make it lawful to disclose that
     somebody was reading about a medical condition. Applied on load and on every
     transition, so neither "Accept all" nor a stale cookie can escape it. */
  function floor(s) {
    s.necessary = 1;
    if (gpc) { s.advertising = 0; s.analytics = 0; s.session_replay = 0; s.gpc = 1; }
    if (HARD_BLOCK) {
      for (var i = 0; i < ALL_CATS.length; i++) { s[ALL_CATS[i]] = 0; }
    }
    return s;
  }

  var stored = readCookie();
  /* A record is only usable if it was written under the current policy version.
     Bumping the version is how the site re-asks everybody after a change. */
  var valid = !!stored && parseInt(stored.policy, 10) === POLICY;
  var state = valid ? stored : blankState();
  floor(state);

  function isAllowed(cat) {
    if (!cat || cat === 'necessary') { return true; }
    return state[cat] === 1;
  }

  /* ---- Blocked-script replay ---- */

  var blocked = [];

  function release(cat) {
    var keep = [];
    for (var i = 0; i < blocked.length; i++) {
      var it = blocked[i];
      if (it.category === cat && isAllowed(cat)) {
        var s = document.createElement('script');
        s.async = true;
        s.src = it.url; /* goes back through the guarded setter, now permitted */
        (document.head || document.documentElement).appendChild(s);
      } else {
        keep.push(it);
      }
    }
    blocked = keep;
  }

  /* ---- Interceptors ---- */

  /* Replace the element's own src setter so assignment is checked before the
     browser is asked to fetch anything. Swallowing the assignment means the
     request is never issued at all, as opposed to issued and then cancelled. */
  function guardSrc(el, kind) {
    var proto = Object.getPrototypeOf(el);
    var desc = proto && Object.getOwnPropertyDescriptor(proto, 'src');
    if (!desc || !desc.set) { return; }
    try {
      Object.defineProperty(el, 'src', {
        configurable: true,
        enumerable: true,
        get: function () { return desc.get.call(el); },
        set: function (v) {
          var cat = classify(v);
          if (cat && !isAllowed(cat)) {
            if (kind === 'script') { blocked.push({ url: String(v), category: cat }); }
            el.setAttribute('data-pcgate-blocked', cat);
            return;
          }
          desc.set.call(el, v);
        }
      });
      var origSet = el.setAttribute;
      el.setAttribute = function (name, value) {
        if (String(name).toLowerCase() === 'src') { el.src = value; return; }
        return origSet.call(el, name, value);
      };
    } catch (e) { /* non-configurable src: nothing to guard */ }
  }

  var origCreate = document.createElement;
  document.createElement = function (tag) {
    var el = origCreate.apply(document, arguments);
    var t = String(tag).toLowerCase();
    if (t === 'script' || t === 'img' || t === 'iframe') { guardSrc(el, t); }
    return el;
  };

  /* Nodes that arrive with src already set never pass through the setter above:
     innerHTML, cloneNode, and server-rendered markup all skip it. */
  if (window.MutationObserver) {
    try {
      new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var added = recs[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (!n || n.nodeType !== 1) { continue; }
            var tag = n.tagName ? n.tagName.toLowerCase() : '';
            if (tag !== 'script' && tag !== 'img' && tag !== 'iframe') { continue; }
            if (n.hasAttribute && n.hasAttribute('data-pcgate-blocked')) { continue; }
            var src = n.getAttribute && n.getAttribute('src');
            if (!src) { continue; }
            var cat = classify(src);
            if (cat && !isAllowed(cat)) {
              n.setAttribute('data-pcgate-blocked', cat);
              if (tag === 'script') { blocked.push({ url: src, category: cat }); }
              try { n.removeAttribute('src'); } catch (e) {}
              n.setAttribute('type', 'javascript/blocked');
              if (n.parentNode && tag !== 'script') { n.parentNode.removeChild(n); }
            }
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function (input) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var cat = classify(url);
      if (cat && !isAllowed(cat)) {
        /* An empty 204 rather than a rejection: a tag that throws on a failed
           beacon can take out whatever called it, and breaking the page is not
           an acceptable way to enforce a privacy choice. */
        if (typeof Response !== 'undefined') {
          /* null, not '', because 204 is a null-body status and the constructor
             throws on a 204 carrying a body. Passing '' turns a quietly blocked
             request into a TypeError thrown inside whichever tag called fetch,
             which is the opposite of the intent here. */
          return Promise.resolve(new Response(null, { status: 204, statusText: 'Blocked by consent' }));
        }
        return Promise.reject(new Error('Blocked by consent'));
      }
      return origFetch.apply(this, arguments);
    };
  }

  if (window.XMLHttpRequest) {
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__pcgUrl = url;
      return origOpen.apply(this, arguments);
    };
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      var cat = classify(this.__pcgUrl || '');
      if (cat && !isAllowed(cat)) { try { this.abort(); } catch (e) {} return; }
      return origSend.apply(this, arguments);
    };
  }

  if (navigator.sendBeacon) {
    var origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url) {
      var cat = classify(url);
      if (cat && !isAllowed(cat)) { return false; }
      return origBeacon.apply(navigator, arguments);
    };
  }

  if (window.Image) {
    var OrigImage = window.Image;
    window.Image = function (w, h) {
      var img = new OrigImage(w, h);
      guardSrc(img, 'img');
      return img;
    };
    window.Image.prototype = OrigImage.prototype;
  }

  /* ---- Transitions ---- */

  var subs = [];
  function notify() {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](api.state(), api.needsPrompt); } catch (e) {}
    }
  }

  function apply(next, action) {
    var before = {};
    for (var i = 0; i < ALL_CATS.length; i++) { before[ALL_CATS[i]] = state[ALL_CATS[i]]; }

    state = next;
    state.action = action;
    state.policy = POLICY;
    state.ts = Math.floor(Date.now() / 1000);
    floor(state);
    writeCookie(state);
    api.needsPrompt = false;

    /* Tell Google's own tags as well. The gate already stops the requests, but
       a tag that knows it is denied behaves better than one that is merely
       prevented, and Consent Mode is what Google's reporting reads. */
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: state.advertising ? 'granted' : 'denied',
        ad_user_data: state.advertising ? 'granted' : 'denied',
        ad_personalization: state.advertising ? 'granted' : 'denied',
        analytics_storage: state.analytics ? 'granted' : 'denied',
        functionality_storage: state.functional ? 'granted' : 'denied',
        personalization_storage: state.functional ? 'granted' : 'denied',
        security_storage: 'granted'
      });
      /* Redact outbound ad data when advertising is denied, so a rejection is a
         real opt-out rather than merely a cookieless one. */
      window.gtag('set', 'ads_data_redaction', state.advertising ? false : true);
    }

    for (var c = 0; c < ALL_CATS.length; c++) {
      if (!before[ALL_CATS[c]] && state[ALL_CATS[c]]) { release(ALL_CATS[c]); }
    }

    if (window.dataLayer) {
      window.dataLayer.push({ event: 'pcgate_consent_update', pcgate_state: api.state() });
    }
    notify();
  }

  function allOn() {
    var s = blankState();
    for (var i = 0; i < ALL_CATS.length; i++) { s[ALL_CATS[i]] = 1; }
    return s;
  }

  var api = {
    version: '2.1.1',
    /* True when no usable record exists for the current policy version, which is
       what the banner keys off. */
    needsPrompt: !valid,
    gpc: !!gpc,
    hardBlock: HARD_BLOCK,
    categories: CATS,
    state: function () {
      var c = {};
      for (var k in state) { if (Object.prototype.hasOwnProperty.call(state, k)) { c[k] = state[k]; } }
      return c;
    },
    isAllowed: isAllowed,
    classify: classify,
    acceptAll: function () { apply(allOn(), 'accept'); },
    rejectAll: function () { apply(blankState(), 'reject'); },
    save: function (choices) {
      var s = blankState();
      for (var i = 0; i < ALL_CATS.length; i++) {
        var c = ALL_CATS[i];
        s[c] = choices && choices[c] ? 1 : 0;
      }
      apply(s, 'custom');
    },
    subscribe: function (fn) {
      subs.push(fn);
      return function () {
        for (var i = 0; i < subs.length; i++) { if (subs[i] === fn) { subs.splice(i, 1); return; } }
      };
    }
  };

  window.__PCGATE__ = api;

  /* Note that GPC does not suppress the banner. The signal is a binding refusal
     to sell or share, and floor() enforces exactly that on every page load with
     or without a stored record. It says nothing about the chat widget, so the
     visitor is still asked, and the banner tells them the opt-out is already in
     place rather than making them repeat it. */
}());
`
