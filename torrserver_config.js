(function () {
    'use strict';
    // Auto-detect TorrServer on the local network, so it works no matter which
    // device (Mac / Android / phone) runs it and without a static IP.
    //
    // It scans the LAN /24 subnets for a service answering TorrServer's /echo.
    // Found address is cached; re-detected automatically if it ever goes away.
    if (window.plugin_tsdetect_ready) return;
    window.plugin_tsdetect_ready = true;

    // Default to the BEST available quality (4K). The player prefers 2160p when a
    // stream has it, and falls back to the highest available otherwise. Set once,
    // so the user can still change it in Settings → Player afterwards.
    try {
        if (!Lampa.Storage.get('best_quality_set', false)) {
            Lampa.Storage.set('video_quality_default', '2160');
            Lampa.Storage.set('best_quality_set', true);
        }
    } catch (e) {}

    var PORT = 8090;
    // Subnets to probe. The user's network is 192.168.10.x; a few common ones are
    // included so it still works if the router hands out a different range.
    var SUBNETS = ['192.168.10.', '192.168.1.', '192.168.0.', '192.168.31.', '10.0.0.', '10.0.1.'];
    var TIMEOUT = 1200;

    function withTimeout(url) {
        var ctrl = new AbortController();
        var t = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
        return fetch(url, { signal: ctrl.signal })
            .then(function (r) { clearTimeout(t); return r.ok ? r.text() : null; })
            .catch(function () { clearTimeout(t); return null; });
    }

    function isTorrServer(body) {
        return !!body && /MatriX|TorrServer|BitTorrent/i.test(body);
    }

    function alive(base) {
        return withTimeout(base + '/echo').then(isTorrServer);
    }

    // Probe a list of hosts, return the first that is a TorrServer.
    function firstAlive(bases, batch) {
        batch = batch || 40;
        var i = 0;
        return new Promise(function (resolve) {
            function next() {
                if (i >= bases.length) { resolve(null); return; }
                var slice = bases.slice(i, i + batch);
                i += batch;
                Promise.all(slice.map(function (b) {
                    return alive(b).then(function (ok) { return ok ? b : null; });
                })).then(function (results) {
                    var hit = results.filter(Boolean)[0];
                    if (hit) resolve(hit); else next();
                });
            }
            next();
        });
    }

    var inflight = null;
    function detect(force) {
        if (inflight) return inflight;
        inflight = runDetect(force).then(function (r) { inflight = null; return r; }, function (e) { inflight = null; return null; });
        return inflight;
    }

    function runDetect(force) {
        var cached = (Lampa.Storage.get('torrserver_url', '') || '').replace(/\/+$/, '');
        var chain = Promise.resolve(null);
        if (cached && !force) {
            chain = alive(cached).then(function (ok) { return ok ? cached : null; });
        }
        return chain.then(function (found) {
            if (found) return found;
            // Check localhost FIRST — covers TorrServer running on the TV itself
            // (http://127.0.0.1 is a secure context, so the https page can reach it).
            var hosts = ['http://127.0.0.1:' + PORT, 'http://localhost:' + PORT];
            SUBNETS.forEach(function (sub) {
                for (var n = 1; n < 255; n++) hosts.push('http://' + sub + n + ':' + PORT);
            });
            return firstAlive(hosts).then(function (hit) {
                if (hit) {
                    Lampa.Storage.set('torrserver_url', hit);
                    if (Lampa.Storage.get('torrserver_use_link', '') === '') Lampa.Storage.set('torrserver_use_link', true);
                    if (window.Lampa && Lampa.Noty) Lampa.Noty.show('TorrServer найден: ' + hit.replace('http://', ''));
                }
                return hit;
            });
        });
    }

    // Expose for on-demand use (the Torrents plugin calls this if no server is set).
    window.torrserverDetect = detect;

    // Kick off a background detect shortly after startup.
    setTimeout(function () { try { detect(false); } catch (e) {} }, 4000);
})();
