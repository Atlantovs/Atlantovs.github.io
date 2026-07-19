(function () {
  'use strict';

  const CryptoUtil = {
    async hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async verifyPassword(password, hash) {
      const hashed = await this.hashPassword(password);
      return hashed === hash;
    },

    generateUID() {
      return 'ZV-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    }
  };

  const Storage = {
    KEY_ACCOUNTS: 'zeus-accounts',
    KEY_SESSION: 'zeus-session',
    KEY_SESSION_TEMP: 'zeus-session-temp',

    getAccounts() {
      try { return JSON.parse(localStorage.getItem(this.KEY_ACCOUNTS) || '[]'); }
      catch { return []; }
    },

    saveAccounts(accounts) {
      localStorage.setItem(this.KEY_ACCOUNTS, JSON.stringify(accounts));
    },

    getSession() {
      return localStorage.getItem(this.KEY_SESSION) || sessionStorage.getItem(this.KEY_SESSION_TEMP);
    },

    setSession(username, remember) {
      if (remember) {
        localStorage.setItem(this.KEY_SESSION, username);
        sessionStorage.removeItem(this.KEY_SESSION_TEMP);
      } else {
        sessionStorage.setItem(this.KEY_SESSION_TEMP, username);
        localStorage.removeItem(this.KEY_SESSION);
      }
    },

    clearSession() {
      localStorage.removeItem(this.KEY_SESSION);
      sessionStorage.removeItem(this.KEY_SESSION_TEMP);
    }
  };

  const Toast = {
    show(message, type = 'info', duration = 3000) {
      const el = document.createElement('div');
      el.className = `toast toast-${type}`;
      el.textContent = message;
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
      }, duration);
    }
  };

  const Modal = {
    currentModal = null,
    previousActiveElement = null,

    init(modalId) {
      this.modal = document.getElementById(modalId);
      if (!this.modal) return;
      this.closeBtn = this.modal.querySelector('.modal-close');
      this.overlay = this.modal.closest('.modal-overlay');
      this.bindEvents();
    },

    bindEvents() {
      this.closeBtn?.addEventListener('click', () => this.close());
      this.overlay?.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen()) this.close(); });
    },

    open() {
      if (!this.modal) return;
      this.previousActiveElement = document.activeElement;
      this.overlay.classList.add('open');
      this.modal.setAttribute('role', 'dialog');
      this.modal.setAttribute('aria-modal', 'true');
      this.modal.setAttribute('aria-labelledby', this.modal.querySelector('h2')?.id || '');
      document.body.style.overflow = 'hidden';
      this.trapFocus();
      this.closeBtn?.focus();
    },

    close() {
      if (!this.modal) return;
      this.overlay.classList.remove('open');
      document.body.style.overflow = '';
      this.previousActiveElement?.focus();
    },

    isOpen() { return this.overlay?.classList.contains('open'); },

    trapFocus() {
      const focusable = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      this.modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
  };

  const CursorGlow = {
    el: null,
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    rafId: null,
    enabled: true,

    init() {
      this.el = document.getElementById('cursorGlow');
      if (!this.el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.enabled = false;
        this.el.style.display = 'none';
        return;
      }
      this.x = window.innerWidth / 2;
      this.y = window.innerHeight / 2;
      this.targetX = this.x;
      this.targetY = this.y;
      window.addEventListener('mousemove', this.onMove.bind(this), { passive: true });
      window.addEventListener('mouseleave', this.onLeave.bind(this));
      document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
      this.render();
    },

    onMove(e) {
      if (!this.enabled) return;
      this.targetX = e.clientX;
      this.targetY = e.clientY;
      this.el.style.opacity = '1';
    },

    onLeave() { if (this.enabled) this.el.style.opacity = '0'; },

    onVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(this.rafId);
      } else {
        this.render();
      }
    },

    render() {
      if (!this.enabled) return;
      this.x += (this.targetX - this.x) * 0.15;
      this.y += (this.targetY - this.y) * 0.15;
      this.el.style.left = this.x + 'px';
      this.el.style.top = this.y + 'px';
      this.rafId = requestAnimationFrame(this.render.bind(this));
    }
  };

  const ScrollProgress = {
    el: null,
    init() {
      this.el = document.getElementById('progress');
      if (!this.el) return;
      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
      this.onScroll();
    },
    onScroll() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      this.el.style.width = progress + '%';
    }
  };

  const NavHighlight = {
    links: [],
    sections: [],
    observer: null,

    init(navSelector, sectionIds) {
      this.links = document.querySelectorAll(navSelector);
      this.sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
      if (!this.links.length || !this.sections.length) return;
      this.observer = new IntersectionObserver(this.onIntersect.bind(this), { threshold: 0.4 });
      this.sections.forEach(s => this.observer.observe(s));
    },

    onIntersect(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          this.links.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === '#' + id || href === id + '.html' || href.endsWith('#' + id));
          });
        }
      });
    },

    destroy() { this.observer?.disconnect(); }
  };

  const Reveal = {
    observer: null,
    init(selector = '.reveal') {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); this.observer.unobserve(e.target); } });
      }, { threshold: 0.15 });
      document.querySelectorAll(selector).forEach(el => this.observer.observe(el));
    }
  };

  const FormUtil = {
    showError(input, message) {
      input.setAttribute('aria-invalid', 'true');
      const errorEl = input.parentElement.querySelector('.field-error');
      if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
    },
    clearError(input) {
      input.removeAttribute('aria-invalid');
      const errorEl = input.parentElement.querySelector('.field-error');
      if (errorEl) { errorEl.classList.remove('visible'); }
    },
    setLoading(btn, loading) {
      if (loading) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.textContent = '';
      } else {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || btn.textContent;
      }
    },
    validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
    validatePassword(pwd) { return pwd.length >= 6; }
  };

  window.ZeusV2 = {
    CryptoUtil,
    Storage,
    Toast,
    Modal,
    CursorGlow,
    ScrollProgress,
    NavHighlight,
    Reveal,
    FormUtil
  };

  document.addEventListener('DOMContentLoaded', () => {
    CursorGlow.init();
    ScrollProgress.init();
    Reveal.init();
  });
})();