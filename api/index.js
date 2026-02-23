const fs = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────
function formatMcap(n) {module.exports = async function handler(req, res) {

    // ── Get CA from URL ──
    const ca = req.query.ca || req.query.token || '';
    const host = req.headers.host || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const pageUrl = `${baseUrl}/?ca=${encodeURIComponent(ca)}`;

    // ── Fetch the HTML template from public folder ──
    let html = '';
    try {
        const templateRes = await fetch(`${baseUrl}/page.html`);
        if (!templateRes.ok) throw new Error('Template not found: ' + templateRes.status);
        html = await templateRes.text();
    } catch (err) {
        console.error('Template error:', err.message);

        // Fallback: redirect to page.html directly
        return res.status(302).redirect(`/page.html?ca=${encodeURIComponent(ca)}`);
    }

    // ── If no CA, serve page as-is ──
    if (!ca || ca.length < 10) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    }

    // ── Fetch token data from DexScreener ──
    let ogTitle = 'Vote to Earn — DexScreener CORE';
    let ogDesc = '🗳 Vote and earn rewards from the community voting pool';
    let ogImage = 'https://dexscreener.com/og.png';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const apiRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!apiRes.ok) throw new Error('API ' + apiRes.status);
        const data = await apiRes.json();

        if (data.pairs && data.pairs.length > 0) {
            // Pick best pair
            const pair = data.pairs.sort(
                (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];

            const token = pair.baseToken || {};
            const chain = pair.chainId || 'unknown';
            const mcap = pair.fdv || pair.marketCap || 0;

            const name = token.name || token.symbol || 'Token';
            const symbol = token.symbol || token.name || '???';

            // Chain reward symbol
            const chainRewards = {
                solana: 'SOL', ethereum: 'ETH', bsc: 'BNB', polygon: 'MATIC',
                arbitrum: 'ETH', avalanche: 'AVAX', base: 'ETH', optimism: 'ETH',
                fantom: 'FTM', cronos: 'CRO', sui: 'SUI', ton: 'TON'
            };
            const chainSym = chainRewards[chain] || chain.toUpperCase();

            // Format market cap
            let mcapStr = '$0';
            if (mcap >= 1e9) mcapStr = '$' + (mcap / 1e9).toFixed(1) + 'B';
            else if (mcap >= 1e6) mcapStr = '$' + (mcap / 1e6).toFixed(1) + 'M';
            else if (mcap >= 1e3) mcapStr = '$' + (mcap / 1e3).toFixed(1) + 'K';
            else if (mcap > 0) mcapStr = '$' + mcap.toFixed(0);

            // Image URL
            if (pair.info && pair.info.imageUrl) {
                ogImage = pair.info.imageUrl;
            } else {
                ogImage = `https://dd.dexscreener.com/ds-data/tokens/${chain}/${ca}.png`;
            }

            ogTitle = `${name} — Vote to Earn ${chainSym}`;
            ogDesc = `🗳 Vote for ${symbol} · ${mcapStr} mcap · Earn ${chainSym} rewards from the community voting pool`;
        }
    } catch (err) {
        console.error('DexScreener API error:', err.message);
    }

    // ── Escape HTML entities ──
    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // ── Inject OG tags into HTML ──
    const safeTitle = esc(ogTitle);
    const safeDesc = esc(ogDesc);
    const safeImage = esc(ogImage);
    const safeUrl = esc(pageUrl);

    // Replace existing meta tags
    html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${safeTitle}</title>`
    );
    html = html.replace(
        /<meta property="og:title" content="[^"]*"/,
        `<meta property="og:title" content="${safeTitle}"`
    );
    html = html.replace(
        /<meta property="og:description" content="[^"]*"/,
        `<meta property="og:description" content="${safeDesc}"`
    );
    html = html.replace(
        /<meta property="og:image" content="[^"]*"/,
        `<meta property="og:image" content="${safeImage}"`
    );
    html = html.replace(
        /<meta property="og:url" content="[^"]*"/,
        `<meta property="og:url" content="${safeUrl}"`
    );
    html = html.replace(
        /<meta name="twitter:title" content="[^"]*"/,
        `<meta name="twitter:title" content="${safeTitle}"`
    );
    html = html.replace(
        /<meta name="twitter:description" content="[^"]*"/,
        `<meta name="twitter:description" content="${safeDesc}"`
    );
    html = html.replace(
        /<meta name="twitter:image" content="[^"]*"/,
        `<meta name="twitter:image" content="${safeImage}"`
    );
    html = html.replace(
        /<link rel="icon" type="image\/png" href="[^"]*"/,
        `<link rel="icon" type="image/png" href="${safeImage}"`
    );

    // Add description meta if not present
    if (!html.includes('name="description"')) {
        html = html.replace(
            '</head>',
            `<meta name="description" content="${safeDesc}">\n</head>`
        );
    }

    // ── Send response ──
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=120, max-age=60, stale-while-revalidate=300');
    return res.status(200).send(html);
};
    if (!n || n === 0) return '$0';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const CHAIN_REWARDS = {
    solana: 'SOL', ethereum: 'ETH', bsc: 'BNB', polygon: 'MATIC',
    arbitrum: 'ETH', avalanche: 'AVAX', base: 'ETH', optimism: 'ETH',
    fantom: 'FTM', cronos: 'CRO', sui: 'SUI', ton: 'TON',
    mantle: 'MNT', linea: 'ETH', blast: 'ETH', scroll: 'ETH',
    zksync: 'ETH', sei: 'SEI', near: 'NEAR', aptos: 'APT'
};

// ── Cache template ───────────────────────────────────────
let templateCache = null;

function getTemplate() {
    if (!templateCache) {
        const filePath = path.join(process.cwd(), 'page.html');
        templateCache = fs.readFileSync(filePath, 'utf8');
    }
    return templateCache;
}

// ── Main Handler ─────────────────────────────────────────
module.exports = async function handler(req, res) {
    let html = getTemplate();

    const ca = req.query.ca || req.query.token || '';
    const host = req.headers.host || 'dexscreener-vote-nine.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const pageUrl = `${protocol}://${host}${req.url}`;

    if (ca && ca.length > 10) {
        try {
            const apiRes = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(ca)}`,
                { signal: AbortSignal.timeout(5000) }
            );
            const data = await apiRes.json();

            if (data.pairs && data.pairs.length > 0) {
                // Pick best pair by liquidity
                const pair = data.pairs.sort(
                    (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
                )[0];

                const token = pair.baseToken;
                const chain = pair.chainId || 'unknown';
                const mcap = pair.fdv || pair.marketCap || 0;
                const chainSym = CHAIN_REWARDS[chain] || chain.toUpperCase();

                const name = token.name || token.symbol || 'Token';
                const symbol = token.symbol || token.name || '???';
                const mcapStr = formatMcap(mcap);

                const imageUrl = (pair.info && pair.info.imageUrl)
                    || `https://dd.dexscreener.com/ds-data/tokens/${chain}/${ca}.png`;

                const ogTitle = `${name} — Vote to Earn ${chainSym}`;
                const ogDesc = `🗳 Vote for ${symbol} · ${mcapStr} mcap · Earn ${chainSym} rewards from the community voting pool`;

                // ── Replace meta tags in HTML ────────────
                const replacements = [
                    [/<title>[^<]*<\/title>/,
                        `<title>${escapeHtml(ogTitle)}</title>`],

                    [/<meta property="og:title" content="[^"]*"/,
                        `<meta property="og:title" content="${escapeHtml(ogTitle)}"`],

                    [/<meta property="og:description" content="[^"]*"/,
                        `<meta property="og:description" content="${escapeHtml(ogDesc)}"`],

                    [/<meta property="og:image" content="[^"]*"/,
                        `<meta property="og:image" content="${escapeHtml(imageUrl)}"`],

                    [/<meta property="og:url" content="[^"]*"/,
                        `<meta property="og:url" content="${escapeHtml(pageUrl)}"`],

                    [/<meta name="twitter:title" content="[^"]*"/,
                        `<meta name="twitter:title" content="${escapeHtml(ogTitle)}"`],

                    [/<meta name="twitter:description" content="[^"]*"/,
                        `<meta name="twitter:description" content="${escapeHtml(ogDesc)}"`],

                    [/<meta name="twitter:image" content="[^"]*"/,
                        `<meta name="twitter:image" content="${escapeHtml(imageUrl)}"`],

                    [/<link rel="icon" type="image\/png" href="[^"]*"/,
                        `<link rel="icon" type="image/png" href="${escapeHtml(imageUrl)}"`]
                ];

                for (const [pattern, replacement] of replacements) {
                    html = html.replace(pattern, replacement);
                }

                // Add description meta if not present
                if (!html.includes('name="description"')) {
                    html = html.replace(
                        '</head>',
                        `<meta name="description" content="${escapeHtml(ogDesc)}">\n</head>`
                    );
                }
            }
        } catch (err) {
            console.error('OG meta fetch error:', err.message);
            // Continue serving the page without OG tags — JS will fill them client-side
        }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=120, max-age=60, stale-while-revalidate=300');
    res.status(200).send(html);

};
