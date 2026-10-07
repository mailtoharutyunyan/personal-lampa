(function(){
    var old = Lampa.Plugins.get();
    old.forEach(function(p){ Lampa.Plugins.remove(p.url); });
    Lampa.Plugins.save();

    var plugins = [
        // Online Streaming
        'http://lampa.stream/modss',
        'https://nb557.github.io/plugins/online_mod.js',
        'http://showy.online/m.js',
        'http://arkmv.ru/vod',
        'http://wtch.ch/m',
        'http://skaz.tv/onlines.js',
        'http://smotret24.ru/online.js',
        'http://llpp.in/v/vod.js',
        'http://z01.online/live',
        'https://beta.l-vid.online/on.js',
        'https://bylampa.github.io/cinema.js',
        'https://lampaplugins.github.io/store/fx.js',
        // Interface & UI
        'http://cub.red/plugin/interface',
        'http://cub.red/plugin/quality',
        'http://cub.red/plugin/tmdb-proxy',
        'http://nb557.github.io/plugins/rating.js',
        'https://bylampa.github.io/interface.js',
        'https://bylampa.github.io/start.js',
        'https://bylampa.github.io/source.js',
        'https://lampame.github.io/main/newcategory.js',
        'https://andreyurl54.github.io/diesel5/tricks.js',
        'http://github.freebie.tom.ru/want.js',
        'https://xiaomishka.github.io/lampa/ads.js',
        'https://tvigl.github.io/plugins/notrailers.js',
        // Collections & Catalog
        'https://cub.red/plugin/collections',
        'https://lampaplugins.github.io/store/p.js',
        'http://skaztv.online/o.js',
        'https://lampaplugins.github.io/store/logo.js',
        // Plugin Store
        'https://skaztv.online/store.js',
        // Navigation & Control
        'https://tsynik.github.io/lampa/e.js',
        'https://nb557.github.io/plugins/not_mobile.js',
        'https://nb557.github.io/plugins/reset_subs.js',
        // Torrent Tools
        'http://cub.red/plugin/etor',
        'https://bylampa.github.io/jackett.js',
        'https://plugin.rootu.top/ts-preload.js',
        'https://lampame.github.io/td/td.js',
        'https://github.freebie.tom.ru/torrents.js',
        'https://lampame.github.io/main/pubtorr.js',
        'https://num.jac-red.ru/plugin/nmprs.js',
        // TV & IPTV
        'http://cub.red/plugin/iptv',
        'https://andreyurl54.github.io/diesel5/diesel.js',
        'http://skaztv.online/tv.js',
        'https://bylampa.github.io/tv.js',
        'https://plugin.rootu.top/tv.js',
        'https://bywolf88.github.io/lampa-plugins/cinemabywolf.js',
        // Music & Radio
        'https://tsynik.github.io/lampa/soma.js',
        'https://lampame.github.io/main/music.js',
        'https://lampaplugins.github.io/store/record.js',
        'https://lampame.github.io/main/cts.js',
        // Weather
        'https://bylampa.github.io/weather.js',
        // Advanced
        'https://levende.github.io/lampa-plugins/bookmarks-sync.js',
        'https://levende.github.io/lampa-plugins/profiles.js',
        'https://levende.github.io/lampa-plugins/tmdb-networks.js',
        'https://levende.github.io/lampa-plugins/custom-favs.js',
        'https://levende.github.io/lampa-plugins/trash-filter.js',
        'https://levende.github.io/lampa-plugins/history-filter.js',
        'https://levende.github.io/lampa-plugins/random-scheduled.js',
        // Self-reference (keeps this installer active)
        'https://mailtoharutyunyan.github.io/personal-lampa/autoinstall.js'
    ];

    plugins.forEach(function(url){ Lampa.Plugins.add(url); });
    Lampa.Plugins.save();
    Lampa.Noty.show(plugins.length + ' verified plugins installed! Restart Lampa.');
})();
