(function () {
    'use strict';

    // Free 4K via public Lampac instances (VK / Rutube parsers). No account, no own server.
    // Calls the OPEN /lite/ endpoints directly, so it works even though the instances'
    // own online.js gates behind a CUB login.
    var INSTANCES = [
        'https://lam.akter-black.com',
        'https://lam.maxvol.pro',
        'https://z01.online'
    ];
    var PROVIDERS = [
        { id: 'vkmovie', label: 'VK' },
        { id: 'rutubemovie', label: 'Rutube' }
    ];

    var ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/><text x="12" y="15.5" font-size="7" font-weight="bold" text-anchor="middle" fill="currentColor">4K</text></svg>';

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

    function parseItems(html, sourceLabel) {
        var box = document.createElement('div');
        box.innerHTML = html;
        var out = [];
        box.querySelectorAll('.videos__item').forEach(function (el) {
            var j;
            try { j = JSON.parse(el.getAttribute('data-json')); } catch (e) { return; }
            if (!j || j.method !== 'play' || (!j.url && !j.quality)) return;
            out.push({
                source: sourceLabel,
                title: (j.title || j.translate || '').replace(/\s+/g, ' ').trim(),
                maxquality: j.maxquality || '',
                url: j.url,
                quality: j.quality || null,
                subtitles: j.subtitles || []
            });
        });
        return out;
    }

    // Fetch one provider from the first instance that answers; fall back across INSTANCES.
    function fetchProvider(provider, query, idx, done) {
        idx = idx || 0;
        if (idx >= INSTANCES.length) { done([]); return; }
        var url = INSTANCES[idx] + '/lite/' + provider.id + query;
        fetch(url)
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

    function open(movie) {
        var title = movie.title || movie.name || movie.original_title || '';
        var query = buildQuery(movie);
        Lampa.Noty.show('4K: поиск «' + title + '»…');

        var collected = [];
        var pending = PROVIDERS.length;

        PROVIDERS.forEach(function (prov) {
            fetchProvider(prov, query, 0, function (items) {
                collected = collected.concat(items);
                if (--pending === 0) finish();
            });
        });

        function finish() {
            if (!collected.length) { Lampa.Noty.show('4K: ничего не найдено'); return; }
            collected.sort(function (a, b) { return qualityRank(b) - qualityRank(a); });

            var items = collected.map(function (v) {
                return {
                    title: v.title || v.source,
                    subtitle: [v.source, v.maxquality].filter(Boolean).join(' • '),
                    quality: v.maxquality,
                    data: v
                };
            });

            Lampa.Select.show({
                title: 'VK / Rutube — ' + title,
                items: items,
                onBack: function () { Lampa.Controller.toggle('full_start'); },
                onSelect: function (item) {
                    play(item.data);
                }
            });
        }
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

    function addButton(e) {
        if (e.type !== 'complete') return;
        var render = e.object.activity.render();
        if (render.find('.view--vk4k').length) return;
        var movie = e.data.movie || e.object.card || {};
        if (!movie || (!movie.title && !movie.name && !movie.original_title)) return;

        var btn = $('<div class="full-start__button selector view--vk4k">' + ICON + '<span>4K</span></div>');
        btn.on('hover:enter', function () { open(movie); });

        var box = render.find('.full-start-new__buttons');
        if (!box.length) box = render.find('.full-start__buttons');
        box.append(btn);
    }

    if (!window.plugin_vk4k_ready) {
        window.plugin_vk4k_ready = true;
        Lampa.Listener.follow('full', addButton);
    }
})();
