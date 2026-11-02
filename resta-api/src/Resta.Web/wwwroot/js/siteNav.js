(function () {
    function syncHeaderScroll() {
        var header = document.getElementById('site-header');
        if (!header) return;
        if (window.scrollY > 40) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    }

    document.addEventListener('scroll', syncHeaderScroll, { passive: true });
    document.addEventListener('DOMContentLoaded', syncHeaderScroll);

    // Close mobile menu when a nav link is tapped
    document.addEventListener('click', function (e) {
        var toggle = document.getElementById('site-nav-toggle');
        if (!toggle) return;
        if (e.target.closest('.main-nav a')) {
            toggle.checked = false;
        }
    });

    // Scroll to top after every Blazor enhanced navigation
    document.addEventListener('enhancedload', function () {
        window.scrollTo({ top: 0, behavior: 'instant' });
        syncHeaderScroll();
    });
})();
