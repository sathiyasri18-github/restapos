(function () {
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
    });
})();
