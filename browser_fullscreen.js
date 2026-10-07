(function () {
    'use strict';
    // On desktop browsers Lampa hides the header fullscreen button (it assumes native
    // fullscreen like on a TV). Show it so the page can be toggled to real browser
    // fullscreen, and make the in-player scale button also go fullscreen in a browser.
    if (window.plugin_browserfs_ready) return;
    window.plugin_browserfs_ready = true;

    function isBrowser() {
        try { return !Lampa.Platform.screen('tv'); } catch (e) { return true; }
    }

    function toggle() {
        try { Lampa.Utils.toggleFullscreen(); return; } catch (e) {}
        var doc = document, el = doc.documentElement;
        var req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        var exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        var fs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement;
        if (!fs) { if (req) req.call(el); } else { if (exit) exit.call(doc); }
    }

    function showButton() {
        if (!isBrowser()) return;
        try {
            var btn = $('.full--screen');
            if (btn.length) {
                btn.removeClass('hide');
                if (!btn.data('fs_bound')) {
                    btn.data('fs_bound', true);
                    btn.on('hover:enter click', function () { toggle(); });
                }
            }
        } catch (e) {}
    }

    try {
        Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') showButton(); });
    } catch (e) {}

    var tries = 0;
    var iv = setInterval(function () {
        showButton();
        if (++tries > 20) clearInterval(iv);
    }, 1500);
})();
