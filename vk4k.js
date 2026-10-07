(function () {
    'use strict';

    // Free 4K via public Lampac instances (VK / Rutube parsers). No account, no own server.
    // Calls the OPEN /lite/ endpoints directly (the instances' own online.js gates on a CUB
    // login, the raw endpoints do not). Opens a full results page with a loader, like the
    // other online plugins.
    var INSTANCES = [
        'https://lam.akter-black.com',
        'https://lam.maxvol.pro',
        'https://z01.online'
    ];
    var PROVIDERS = [
        { id: 'vkmovie', label: 'VK' },
        { id: 'rutubemovie', label: 'Rutube' }
    ];

    var BADGE = '<svg class="vk4k-badge" xmlns="http://www.w3.org/2000/svg" width="40" height="26" viewBox="0 0 40 26" fill="none">' +
        '<defs><linearGradient id="vk4kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd86b"/><stop offset="1" stop-color="#f7971e"/></linearGradient></defs>' +
        '<rect x="1" y="1" width="38" height="24" rx="6" fill="url(#vk4kg)"/>' +
        '<text x="20" y="18" font-size="12" font-weight="800" text-anchor="middle" fill="#1b1300" font-family="Arial,Helvetica,sans-serif">4K</text></svg>';
    var PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.5l5.5 3.5L10 15.5v-7z" fill="currentColor"/></svg>';

    if (!document.getElementById('vk4k-css')) {
        var st = document.createElement('style');
        st.id = 'vk4k-css';
        st.textContent =
            '.view--vk4k .vk4k-badge{display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,.4));}' +
            '.view--vk4k.focus .vk4k-badge rect{stroke:#fff;stroke-width:2;}' +
            '.vk4k-item{display:flex;align-items:center;padding:1.2em 1.4em;margin:0 0 .7em 0;border-radius:.7em;background:rgba(255,255,255,.06);transition:none;}' +
            '.vk4k-item.focus{background:#fff;color:#000;}' +
            '.vk4k-item__ico{flex:0 0 auto;margin-right:1.2em;opacity:.85;}' +
            '.vk4k-item__title{font-size:1.35em;font-weight:600;margin-bottom:.3em;}' +
            '.vk4k-item__q{font-size:1.05em;opacity:.7;}' +
            '.vk4k-item__tag{display:inline-block;background:linear-gradient(135deg,#ffd86b,#f7971e);color:#1b1300;font-weight:800;font-size:.8em;padding:.1em .5em;border-radius:.35em;margin-right:.6em;vertical-align:middle;}' +
            '.vk4k-empty{padding:2.5em 1.4em;font-size:1.4em;opacity:.7;text-align:center;}';
        document.head.appendChild(st);
    }

    function esc(s) {
        return (s || '').replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; });
    }

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

    function parseItems(html, label) {
        var box = document.createElement('div');
        box.innerHTML = html;
        var out = [];
        box.querySelectorAll('.videos__item').forEach(function (el) {
            var j;
            try { j = JSON.parse(el.getAttribute('data-json')); } catch (e) { return; }
            if (!j || j.method !== 'play' || (!j.url && !j.quality)) return;
            out.push({
                source: label,
                title: (j.title || j.translate || '').replace(/\s+/g, ' ').trim(),
                maxquality: j.maxquality || '',
                url: j.url,
                quality: j.quality || null,
                subtitles: j.subtitles || []
            });
        });
        return out;
    }

    function fetchProvider(provider, query, idx, done) {
        idx = idx || 0;
        if (idx >= INSTANCES.length) { done([]); return; }
        fetch(INSTANCES[idx] + '/lite/' + provider.id + query)
            .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
            .then(function (html) {
                var items = parseItems(html, provider.label);
                if (items.length) done(items);
                else fetchProvider(provider, query, idx + 1, done);
            })
            .catch(function () { fetchProvider(provider, query, idx + 1, done); });
    }

    function qualityRank(item) {
        var m = (item.maxquality || '').match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
    }

    function qualityRange(v) {
        var keys = v.quality ? Object.keys(v.quality) : [];
        if (!keys.length) return v.maxquality || '';
        return keys[keys.length - 1] + ' ~ ' + keys[0];
    }

    function play(v) {
        var playObj = { title: v.title, url: v.url };
        if (v.quality && typeof v.quality === 'object') playObj.quality = v.quality;
        if (v.subtitles && v.subtitles.length) {
            playObj.subtitles = v.subtitles.map(function (s) { return { label: s.label || 'sub', url: s.url }; });
        }
        Lampa.Player.play(playObj);
        Lampa.Player.playlist([playObj]);
    }

    // ---------- Full-page component ----------
    function component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 300 });
        var items = [];
        var last;
        var movie = object.movie || {};
        var self = this;

        this.create = function () {
            this.activity.loader(true);
            load();
            return this.render();
        };

        this.render = function () { return scroll.render(); };

        function load() {
            var query = buildQuery(movie);
            var collected = [];
            var pending = PROVIDERS.length;
            PROVIDERS.forEach(function (prov) {
                fetchProvider(prov, query, 0, function (list) {
                    collected = collected.concat(list);
                    if (--pending === 0) done(collected);
                });
            });
        }

        function done(results) {
            self.activity.loader(false);
            if (!results.length) { empty(); return; }
            results.sort(function (a, b) { return qualityRank(b) - qualityRank(a); });
            build(results);
        }

        function build(results) {
            results.forEach(function (v) {
                var is4k = qualityRank(v) >= 2160;
                var tag = is4k ? '<span class="vk4k-item__tag">4K UHD</span>' : '';
                var el = $(
                    '<div class="vk4k-item selector">' +
                    '<div class="vk4k-item__ico">' + PLAY + '</div>' +
                    '<div class="vk4k-item__body">' +
                    '<div class="vk4k-item__title">' + tag + esc(v.title || v.source) + '</div>' +
                    '<div class="vk4k-item__q">' + esc([v.source, qualityRange(v)].filter(Boolean).join('   •   ')) + '</div>' +
                    '</div></div>'
                );
                el.on('hover:enter', function () { play(v); });
                el.on('hover:focus', function (e) { last = e.target; scroll.update($(e.target), true); });
                scroll.append(el);
                items.push(el);
            });
            self.activity.toggle();
        }

        function empty() {
            scroll.append($('<div class="vk4k-empty">В VK / Rutube ничего не найдено</div>'));
            self.activity.toggle();
        }

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { if (Navigator.canmove('down')) Navigator.move('down'); },
                left: function () { Lampa.Controller.toggle('menu'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () { };
        this.stop = function () { };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
        };
    }

    function open(movie) {
        Lampa.Activity.push({
            url: '',
            title: 'VK / Rutube 4K',
            component: 'vk4k',
            movie: movie,
            page: 1
        });
    }

    function addButton(e) {
        if (e.type !== 'complete' && e.type !== 'complite') return;
        var render = e.object.activity.render();
        if (render.find('.view--vk4k').length) return;
        var movie = e.data.movie || e.object.card || {};
        if (!movie || (!movie.title && !movie.name && !movie.original_title)) return;

        var btn = $('<div class="full-start__button selector view--vk4k">' + BADGE + '</div>');
        btn.on('hover:enter', function () { open(movie); });

        var box = render.find('.full-start-new__buttons');
        if (!box.length) box = render.find('.full-start__buttons');
        box.prepend(btn);
    }

    if (!window.plugin_vk4k_ready) {
        window.plugin_vk4k_ready = true;
        Lampa.Component.add('vk4k', component);
        Lampa.Listener.follow('full', addButton);
    }
})();
