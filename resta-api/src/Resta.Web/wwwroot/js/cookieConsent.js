(function () {
    'use strict';

    var STORAGE_KEY = 'resta-cookie-consent';
    var OPEN_EVENT = 'resta-open-cookie-settings';

    var categories = [
        {
            key: 'essential',
            name: 'Essential Technologies',
            alwaysActive: true,
            description: 'These Technologies are necessary for the website to function and cannot be switched off. They are usually set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms.'
        },
        {
            key: 'performance',
            name: 'Performance and Analytics Technologies',
            description: 'These Technologies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us understand which pages are the most and least popular and see how visitors move around the site.'
        },
        {
            key: 'functional',
            name: 'Functional Technologies',
            description: 'These Technologies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.'
        },
        {
            key: 'targeting',
            name: 'Targeting Technologies',
            description: 'These Technologies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant adverts on other sites.'
        }
    ];

    var state = {
        performance: false,
        functional: false,
        targeting: false
    };

    var root = null;
    var bannerEl = null;
    var modalEl = null;
    var backdropEl = null;

    function getStored() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function savePrefs(prefs) {
        prefs.essential = true;
        prefs.hasConsented = true;
        prefs.consentedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        if (prefs.performance) {
            recordPageView();
        }
    }

    function getApiBase() {
        var meta = document.querySelector('meta[name="resta-api-base"]');
        return (meta && meta.content) ? meta.content.replace(/\/$/, '') : '';
    }

    function recordPageView() {
        var base = getApiBase();
        if (!base) return;
        fetch(base + '/api/public/pageview', { method: 'POST' }).catch(function () { });
    }

    function ensureRoot() {
        if (root) return;
        root = document.createElement('div');
        root.id = 'resta-cookie-root';
        document.body.appendChild(root);
    }

    function hideBanner() {
        if (bannerEl) bannerEl.classList.add('resta-hidden');
    }

    function showBanner() {
        ensureRoot();
        if (!bannerEl) {
            bannerEl = document.createElement('div');
            bannerEl.className = 'cookie-banner';
            bannerEl.setAttribute('role', 'dialog');
            bannerEl.setAttribute('aria-label', 'Cookie consent');
            bannerEl.innerHTML =
                '<div class="cookie-banner-inner">' +
                '<p class="cookie-banner-text">' +
                'We use cookies and other technologies (collectively &ldquo;Technologies&rdquo;) for site improvement, marketing, and personalized advertising. ' +
                'By clicking &ldquo;Accept All Cookies&rdquo;, you agree to our use of the Technologies described in our privacy notice, linked below. ' +
                'Click &ldquo;Cookie Settings&rdquo; to learn more about our use of Technologies and to manage your choices. ' +
                'For more information, see our ' +
                '<a href="/cookies">Cookies, Mobile IDs, and Other Technologies notice</a>. ' +
                '<a href="/privacy">Website Privacy Notice</a>' +
                '</p>' +
                '<div class="cookie-banner-actions">' +
                '<button type="button" class="cookie-link-btn" data-action="settings">Cookie Settings</button>' +
                '<button type="button" class="cookie-btn" data-action="reject">Reject All</button>' +
                '<button type="button" class="cookie-btn" data-action="accept">Accept All Cookies</button>' +
                '</div></div>';
            bannerEl.addEventListener('click', onBannerClick);
            root.appendChild(bannerEl);
        }
        bannerEl.classList.remove('resta-hidden');
    }

    function onBannerClick(e) {
        var action = e.target && e.target.getAttribute('data-action');
        if (!action) return;
        if (action === 'settings') openSettings();
        if (action === 'reject') rejectAll();
        if (action === 'accept') acceptAll();
    }

    function buildPrefRow(cat) {
        var expanded = false;
        var row = document.createElement('div');
        row.className = 'cookie-pref-item';
        row.dataset.key = cat.key;

        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'cookie-pref-toggle';
        toggle.innerHTML = '<span class="cookie-pref-icon">+</span><span class="cookie-pref-name">' + cat.name + '</span>';
        toggle.addEventListener('click', function () {
            expanded = !expanded;
            row.classList.toggle('expanded', expanded);
            toggle.querySelector('.cookie-pref-icon').textContent = expanded ? '\u2212' : '+';
            if (expanded && !row.querySelector('.cookie-pref-desc')) {
                var desc = document.createElement('p');
                desc.className = 'cookie-pref-desc';
                desc.textContent = cat.description;
                row.appendChild(desc);
            }
        });

        row.appendChild(toggle);

        if (cat.alwaysActive) {
            var badge = document.createElement('span');
            badge.className = 'cookie-always-active';
            badge.textContent = 'Always Active';
            row.appendChild(badge);
        } else {
            var label = document.createElement('label');
            label.className = 'cookie-switch';
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.key = cat.key;
            input.checked = state[cat.key];
            input.addEventListener('change', function () {
                state[cat.key] = input.checked;
            });
            var slider = document.createElement('span');
            slider.className = 'cookie-switch-slider';
            label.appendChild(input);
            label.appendChild(slider);
            row.appendChild(label);
        }

        return row;
    }

    function syncModalToggles() {
        if (!modalEl) return;
        modalEl.querySelectorAll('.cookie-switch input').forEach(function (input) {
            var key = input.dataset.key;
            if (key && key in state) input.checked = state[key];
        });
    }

    function openSettings() {
        ensureRoot();
        hideBanner();
        hideModal();

        if (!modalEl) {
            backdropEl = document.createElement('div');
            backdropEl.className = 'cookie-modal-backdrop';
            backdropEl.addEventListener('click', closeSettings);

            modalEl = document.createElement('div');
            modalEl.className = 'cookie-modal';
            modalEl.setAttribute('role', 'dialog');
            modalEl.setAttribute('aria-modal', 'true');
            modalEl.innerHTML =
                '<div class="cookie-modal-header">' +
                '<div class="cookie-modal-logo"><div class="logo-icon">R</div><strong>Resta</strong></div>' +
                '<button type="button" class="cookie-modal-close" aria-label="Close">&times;</button>' +
                '</div>' +
                '<div class="cookie-modal-body">' +
                '<p>When you visit our website, we store or retrieve Technologies on your browser in the form of cookies and similar methods. ' +
                'We use these Technologies for site operation, marketing, and personalized advertising. ' +
                'You can choose not to allow some Technologies. Click on the different category headings to find out more and change our default settings. ' +
                'For more information, see our <a href="/cookies">Cookies, Mobile IDs, and Other Technologies Notice</a> ' +
                'and <a href="/privacy">Website Privacy Notice</a>.</p>' +
                '<button type="button" class="cookie-btn cookie-allow-all" data-action="accept">Allow All</button>' +
                '<h3 class="cookie-prefs-title">Manage Consent Preferences</h3>' +
                '<div class="cookie-prefs-list"></div>' +
                '</div>' +
                '<div class="cookie-modal-footer">' +
                '<button type="button" class="cookie-btn" data-action="reject">Reject All</button>' +
                '<button type="button" class="cookie-btn" data-action="confirm">Confirm My Choices</button>' +
                '</div>';

            var list = modalEl.querySelector('.cookie-prefs-list');
            categories.forEach(function (cat) {
                list.appendChild(buildPrefRow(cat));
            });

            modalEl.querySelector('.cookie-modal-close').addEventListener('click', closeSettings);
            modalEl.addEventListener('click', function (e) {
                var action = e.target && e.target.getAttribute('data-action');
                if (action === 'accept') acceptAll();
                if (action === 'reject') rejectAll();
                if (action === 'confirm') confirmChoices();
            });

            root.appendChild(backdropEl);
            root.appendChild(modalEl);
        }

        syncModalToggles();
        backdropEl.classList.remove('resta-hidden');
        modalEl.classList.remove('resta-hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        if (backdropEl) backdropEl.classList.add('resta-hidden');
        if (modalEl) modalEl.classList.add('resta-hidden');
        document.body.style.overflow = '';
    }

    function closeSettings() {
        hideModal();
        if (!getStored()) showBanner();
    }

    function acceptAll() {
        state.performance = state.functional = state.targeting = true;
        persist();
    }

    function rejectAll() {
        state.performance = state.functional = state.targeting = false;
        persist();
    }

    function confirmChoices() {
        persist();
    }

    function persist() {
        var prefs = {
            essential: true,
            performance: state.performance,
            functional: state.functional,
            targeting: state.targeting
        };
        savePrefs(prefs);
        hideBanner();
        hideModal();
    }

    var initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;
        var stored = getStored();
        if (stored && stored.hasConsented) {
            state.performance = !!stored.performance;
            state.functional = !!stored.functional;
            state.targeting = !!stored.targeting;
            if (stored.performance) recordPageView();
            return;
        }
        showBanner();
    }

    window.restaCookieConsent = {
        notifyOpenSettings: function () {
            openSettings();
        },
        get: getStored,
        set: savePrefs
    };

    document.addEventListener('DOMContentLoaded', init);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    }
})();
