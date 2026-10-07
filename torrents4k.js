(function () {
    'use strict';

    // Torrents button: lists all torrent versions (from the pidtor source on public
    // Lampac instances) and streams the chosen one through the user's TorrServer.
    var INSTANCES = [
        'https://lam.akter-black.com',
        'https://lam.maxvol.pro',
        'https://z01.online'
    ];

    var BADGE = '<svg class="tor4k-badge" xmlns="http://www.w3.org/2000/svg" width="40" height="26" viewBox="0 0 40 26" fill="none">' +
        '<defs><linearGradient id="tor4kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ee8a0"/><stop offset="1" stop-color="#17b978"/></linearGradient></defs>' +
        '<rect x="1" y="1" width="38" height="24" rx="6" fill="url(#tor4kg)"/>' +
        '<path d="M20 6v9m0 0l-3.3-3.3M20 15l3.3-3.3M13 19h14" stroke="#073b22" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
    var MAGNET = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M6 3v7a6 6 0 0012 0V3h-4v7a2 2 0 01-4 0V3H6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';

    if (!document.getElementById('tor4k-css')) {
        var st = document.createElement('style');
        st.id = 'tor4k-css';
        st.textContent =
            '.view--tor4k .tor4k-badge{display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,.4));}' +
            '.view--tor4k.focus .tor4k-badge rect{stroke:#fff;stroke-width:2;}' +
            '.tor4k-list{position:absolute;top:0;left:0;right:0;overflow-y:auto;overflow-x:hidden;padding:1.5em 2.5em;scroll-padding:3em 0;}' +
            '.tor4k-item{display:flex;align-items:center;padding:1.1em 1.4em;margin:0 0 .7em 0;border-radius:.7em;background:rgba(255,255,255,.06);}' +
            '.tor4k-seed{display:inline-flex;align-items:center;font-weight:700;font-size:.98em;margin-right:.3em;}' +
            '.tor4k-seed__dot{width:.72em;height:.72em;border-radius:50%;display:inline-block;margin-right:.45em;box-shadow:0 0 .35em rgba(0,0,0,.4);}' +
            '.tor4k-seed.good .tor4k-seed__dot{background:#25d366;}' +
            '.tor4k-seed.mid .tor4k-seed__dot{background:#f5b301;}' +
            '.tor4k-seed.low .tor4k-seed__dot{background:#e53935;}' +
            '.tor4k-item.focus{background:#fff;color:#000;}' +
            '.tor4k-item__ico{flex:0 0 auto;margin-right:1.2em;opacity:.85;}' +
            '.tor4k-item__title{font-size:1.25em;font-weight:600;margin-bottom:.3em;line-height:1.3;}' +
            '.tor4k-item__meta{font-size:1.02em;opacity:.75;}' +
            '.tor4k-item__tag{display:inline-block;color:#073b22;font-weight:800;font-size:.78em;padding:.1em .5em;border-radius:.35em;margin-right:.55em;vertical-align:middle;background:linear-gradient(135deg,#7ee8a0,#17b978);}' +
            '.tor4k-empty{padding:2.5em 1.4em;font-size:1.3em;opacity:.7;text-align:center;}';
        document.head.appendChild(st);
    }

    function esc(s) { return (s || '').replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

    function buildQuery(movie) {
        var p = [];
        var title = movie.title || movie.name || movie.original_title || movie.original_name || '';
        p.push('title=' + encodeURIComponent(title));
        var orig = movie.original_title || movie.original_name || '';
        if (orig && orig !== title) p.push('original_title=' + encodeURIComponent(orig));
        var year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
        if (year) p.push('year=' + year);
        if (movie.id) p.push('tmdb=' + movie.id);
        if (movie.imdb_id) p.push('imdb=' + movie.imdb_id);
        if (movie.kinopoisk_id) p.push('kp=' + movie.kinopoisk_id);
        return '?' + p.join('&');
    }

    function parseItems(html) {
        var box = document.createElement('div');
        box.innerHTML = html;
        var out = [];
        box.querySelectorAll('.videos__item').forEach(function (el) {
            var j;
            try { j = JSON.parse(el.getAttribute('data-json')); } catch (e) { return; }
            if (!j || !j.url) return;
            var m = /\/pidtor\/s([a-fA-F0-9]{40})/.exec(j.url);
            if (!m) return;
            var hash = m1(m);
            // trackers
            var trackers = [];
            var qs = j.url.indexOf('?') >= 0 ? j.url.slice(j.url.indexOf('?') + 1) : '';
            qs.split('&').forEach(function (kv) {
                var i = kv.indexOf('=');
                if (i > 0 && kv.slice(0, i) === 'tr') trackers.push(decodeURIComponent(kv.slice(i + 1)));
            });
            var magnet = 'magnet:?xt=urn:btih:' + hash;
            trackers.forEach(function (t) { magnet += '&tr=' + encodeURIComponent(t); });
            // parse quality / size / seeders from voice_name
            var vn = j.voice_name || '';
            var qm = vn.match(/(\d{3,4})p?/);
            var quality = qm ? parseInt(qm[1], 10) : (parseInt(j.maxquality, 10) || 0);
            var size = (vn.match(/([\d.]+\s?(?:GB|МБ|MB|ГБ|TB))/i) || [])[1] || '';
            var hdr = /HDR|Dolby|DV|HEVC/i.test(vn) ? (vn.match(/HDR10\+?|Dolby Vision|DV|HDR|HEVC/i) || [''])[0] : '';
            var seed = parseInt((vn.match(/\/\s*(\d+)\s*$/) || [])[1] || '0', 10) || 0;
            out.push({
                title: (j.title || '').replace(/\s+/g, ' ').trim(),
                translate: (j.translate || '').replace(/\s+/g, ' ').trim(),
                quality: quality,
                size: size,
                hdr: hdr,
                seed: seed,
                hash: hash,
                magnet: magnet
            });
        });
        return out;
    }
    function m1(m) { return m[1]; }

    function fetchTorrents(query, idx, done, state) {
        state = state || { retried: false, sawResponse: false };
        idx = idx || 0;
        if (idx >= INSTANCES.length) {
            if (!state.sawResponse && !state.retried) {
                state.retried = true;
                setTimeout(function () { fetchTorrents(query, 0, done, state); }, 1500);
                return;
            }
            done([]); return;
        }
        fetch(INSTANCES[idx] + '/lite/pidtor' + query)
            .then(function (r) { if (r.ok) { state.sawResponse = true; return r.text(); } return Promise.reject(); })
            .then(function (html) {
                var items = parseItems(html);
                if (items.length) done(items);
                else fetchTorrents(query, idx + 1, done, state);
            })
            .catch(function () { fetchTorrents(query, idx + 1, done, state); });
    }

    function tsUrl() { return (Lampa.Storage.get('torrserver_url', '') || '').replace(/\/+$/, ''); }

    function playTorrent(item) {
        var ts = tsUrl();
        if (!ts) {
            if (window.torrserverDetect) {
                Lampa.Noty.show('Поиск TorrServer в сети…');
                window.torrserverDetect(true).then(function (found) {
                    if (found) playTorrent(item);
                    else Lampa.Noty.show('TorrServer не найден в сети');
                });
            } else {
                Lampa.Noty.show('TorrServer не настроен (Настройки → TorrServer)');
            }
            return;
        }
        Lampa.Noty.show('Добавление в TorrServer…');
        fetch(ts + '/torrents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', link: item.magnet, title: item.title, save_to_db: false }) })
            .then(function (r) { return r.json(); })
            .then(function (res) { poll(ts, res.hash || item.hash, 0); })
            .catch(function () { Lampa.Noty.show('TorrServer недоступен'); });
    }

    function poll(ts, hash, tries) {
        if (tries > 25) { Lampa.Noty.show('Торрент не отвечает'); return; }
        fetch(ts + '/torrents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get', hash: hash }) })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var fs = d.file_stats || [];
                if (!fs.length) { setTimeout(function () { poll(ts, hash, tries + 1); }, 1500); return; }
                var vids = fs.filter(function (f) { return /\.(mkv|mp4|avi|ts|m4v|mov|webm)$/i.test(f.path || ''); });
                if (!vids.length) vids = fs;
                vids.sort(function (a, b) { return (b.length || 0) - (a.length || 0); });
                var f = vids[0];
                var name = (f.path || 'video').split('/').pop();
                var url = ts + '/stream/' + encodeURIComponent(name) + '?link=' + hash + '&index=' + (f.id || 1) + '&play';
                Lampa.Noty.show('Запуск…');
                var playObj = { title: f.path ? name : 'Torrent', url: url };
                Lampa.Player.play(playObj);
                Lampa.Player.playlist([playObj]);
            })
            .catch(function () { setTimeout(function () { poll(ts, hash, tries + 1); }, 1500); });
    }

    // ---------- Full-page component ----------
    function seedClass(s) { return s >= 30 ? 'good' : (s >= 8 ? 'mid' : 'low'); }

    function component(object) {
        var html = $('<div class="tor4k-list"></div>');
        var movie = object.movie || {};
        var last;
        var self = this;

        function fit() {
            try {
                var top = html[0].getBoundingClientRect().top;
                html[0].style.height = Math.max(200, window.innerHeight - top) + 'px';
            } catch (e) {}
        }

        this.create = function () { this.activity.loader(true); load(); return this.render(); };
        this.render = function () { return html; };

        function load() {
            fetchTorrents(buildQuery(movie), 0, function (list) {
                self.activity.loader(false);
                if (!list.length) { html.append($('<div class="tor4k-empty">Торренты не найдены</div>')); self.activity.toggle(); return; }
                // best quality first, then most seeders
                list.sort(function (a, b) { return (b.quality - a.quality) || (b.seed - a.seed); });
                build(list);
            });
        }

        function build(list) {
            list.forEach(function (v) {
                var is4k = v.quality >= 2160;
                var tag = is4k ? '<span class="tor4k-item__tag">4K</span>' : '';
                var seedTag = '<span class="tor4k-seed ' + seedClass(v.seed) + '"><span class="tor4k-seed__dot"></span>' + v.seed + '</span>';
                var meta = [
                    v.quality ? v.quality + 'p' : '',
                    v.size,
                    v.hdr,
                    v.translate
                ].filter(Boolean).join('   •   ');
                var el = $(
                    '<div class="tor4k-item selector">' +
                    '<div class="tor4k-item__ico">' + MAGNET + '</div>' +
                    '<div class="tor4k-item__body">' +
                    '<div class="tor4k-item__title">' + tag + esc(v.title) + '</div>' +
                    '<div class="tor4k-item__meta">' + seedTag + '   ' + esc(meta) + '</div>' +
                    '</div></div>'
                );
                el.on('hover:enter', function () { playTorrent(v); });
                el.on('hover:focus', function (e) { last = e.target; if (e.target.scrollIntoView) e.target.scrollIntoView({ block: 'center' }); });
                html.append(el);
            });
            self.activity.toggle();
            setTimeout(fit, 0);
        }

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(html); Lampa.Controller.collectionFocus(last || false, html); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { if (Navigator.canmove('down')) Navigator.move('down'); },
                left: function () { Lampa.Controller.toggle('menu'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };
        this.pause = function () { };
        this.stop = function () { };
        this.destroy = function () { if (html) html.remove(); };
    }

    function open(movie) {
        Lampa.Activity.push({ url: '', title: 'Торренты', component: 'tor4k', movie: movie, page: 1 });
    }

    function addButton(e) {
        if (e.type !== 'complete' && e.type !== 'complite') return;
        var render = e.object.activity.render();
        if (render.find('.view--tor4k').length) return;
        var movie = e.data.movie || e.object.card || {};
        if (!movie || (!movie.title && !movie.name && !movie.original_title)) return;

        var btn = $('<div class="full-start__button selector view--tor4k">' + BADGE + '</div>');
        btn.on('hover:enter', function () { open(movie); });

        var box = render.find('.full-start-new__buttons');
        if (!box.length) box = render.find('.full-start__buttons');
        var fourk = box.find('.view--vk4k');
        if (fourk.length) fourk.after(btn); else box.prepend(btn);
    }

    if (!window.plugin_tor4k_ready) {
        window.plugin_tor4k_ready = true;
        Lampa.Component.add('tor4k', component);
        Lampa.Listener.follow('full', addButton);
    }
})();
