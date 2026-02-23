import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    var url = new URL(req.url);
    var ca = url.searchParams.get('ca') || '';

    var name = 'DexScreener CORE';
    var symbol = '???';
    var priceStr = '$0.00';
    var mcap = '--';
    var liq = '--';
    var vol = '--';
    var chain = 'UNKNOWN';
    var chainSym = '???';
    var logoUrl = '';
    var milestone = Math.floor(Math.random() * 600) + 200;
    var total = Math.floor(Math.random() * 1500) + 500;
    var pct = Math.round((milestone / total) * 100);

    if (ca.length > 10) {
        try {
            var res = await fetch(
                'https://api.dexscreener.com/latest/dex/tokens/' + encodeURIComponent(ca)
            );
            var data = await res.json();

            if (data.pairs && data.pairs.length > 0) {
                data.pairs.sort(function (a, b) {
                    return ((b.liquidity && b.liquidity.usd) || 0) -
                           ((a.liquidity && a.liquidity.usd) || 0);
                });

                var p = data.pairs[0];
                var tk = p.baseToken || {};

                name = tk.name || tk.symbol || 'Token';
                symbol = tk.symbol || tk.name || '???';
                chain = (p.chainId || 'unknown').toUpperCase();

                var pr = parseFloat(p.priceUsd || 0);
                if (pr >= 1000) priceStr = '$' + pr.toLocaleString('en-US', { maximumFractionDigits: 2 });
                else if (pr >= 1) priceStr = '$' + pr.toFixed(2);
                else if (pr >= 0.01) priceStr = '$' + pr.toFixed(4);
                else if (pr >= 0.000001) priceStr = '$' + pr.toFixed(8);
                else priceStr = '$' + pr.toFixed(12);

                var m = p.fdv || p.marketCap || 0;
                if (m >= 1e9) mcap = '$' + (m / 1e9).toFixed(2) + 'B';
                else if (m >= 1e6) mcap = '$' + (m / 1e6).toFixed(2) + 'M';
                else if (m >= 1e3) mcap = '$' + (m / 1e3).toFixed(1) + 'K';
                else mcap = '$' + Math.round(m);

                var l = (p.liquidity && p.liquidity.usd) || 0;
                if (l >= 1e6) liq = '$' + (l / 1e6).toFixed(2) + 'M';
                else if (l >= 1e3) liq = '$' + (l / 1e3).toFixed(1) + 'K';
                else liq = '$' + Math.round(l);

                var v = (p.volume && p.volume.h24) || 0;
                if (v >= 1e6) vol = '$' + (v / 1e6).toFixed(2) + 'M';
                else if (v >= 1e3) vol = '$' + (v / 1e3).toFixed(1) + 'K';
                else vol = '$' + Math.round(v);

                var rewards = {
                    solana: 'SOL', ethereum: 'ETH', bsc: 'BNB', base: 'ETH',
                    arbitrum: 'ETH', polygon: 'MATIC', avalanche: 'AVAX',
                    optimism: 'ETH', fantom: 'FTM', sui: 'SUI', ton: 'TON',
                    cronos: 'CRO', sei: 'SEI', near: 'NEAR', aptos: 'APT'
                };
                chainSym = rewards[p.chainId] || chain;

                if (p.info && p.info.imageUrl) {
                    logoUrl = p.info.imageUrl;
                }
            }
        } catch (err) {
            console.error('OG image API error:', err.message);
        }
    }

    var displayName = name.length > 16 ? name.substring(0, 16) + '...' : name;

    return new ImageResponse(
        (
            <div style={{
                width: '100%',
                height: '100%',
                background: '#020203',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'sans-serif'
            }}>

                {/* Background grid */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'linear-gradient(rgba(34,197,94,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.025) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    display: 'flex'
                }} />

                {/* Green glow top-right */}
                <div style={{
                    position: 'absolute', top: '-80px', right: '-80px',
                    width: '350px', height: '350px',
                    background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
                    borderRadius: '50%',
                    display: 'flex'
                }} />

                {/* Green glow bottom-left */}
                <div style={{
                    position: 'absolute', bottom: '-60px', left: '-60px',
                    width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)',
                    borderRadius: '50%',
                    display: 'flex'
                }} />

                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '30px 50px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        color: '#ffffff', fontSize: '20px', fontWeight: 800
                    }}>
                        <div style={{
                            width: '10px', height: '10px',
                            background: '#22c55e', borderRadius: '50%',
                            display: 'flex'
                        }} />
                        DEXSCREENER
                        <span style={{ color: '#22c55e' }}>CORE</span>
                    </div>
                    <div style={{
                        display: 'flex', gap: '10px'
                    }}>
                        <div style={{
                            background: 'rgba(34,197,94,0.1)',
                            color: '#22c55e',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'flex'
                        }}>
                            {chain}
                        </div>
                        <div style={{
                            background: 'rgba(34,197,94,0.06)',
                            color: '#22c55e',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'flex'
                        }}>
                            ACTIVE POOL
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div style={{
                    display: 'flex', flex: 1, padding: '40px 50px', gap: '40px'
                }}>
                    {/* Left side */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1.3, gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            {/* Logo */}
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    width="120"
                                    height="120"
                                    style={{
                                        borderRadius: '28px',
                                        border: '2px solid rgba(34,197,94,0.2)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '120px', height: '120px',
                                    borderRadius: '28px',
                                    background: 'linear-gradient(135deg, #111, #0a0a0a)',
                                    border: '2px solid rgba(34,197,94,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#22c55e', fontSize: '48px', fontWeight: 800
                                }}>
                                    {symbol.charAt(0)}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{
                                    fontSize: '42px', fontWeight: 800, color: '#ffffff',
                                    lineHeight: 1, letterSpacing: '-1px'
                                }}>
                                    {displayName}
                                </div>
                                <div style={{
                                    fontSize: '28px', fontWeight: 700, color: '#22c55e',
                                    fontFamily: 'monospace'
                                }}>
                                    {priceStr}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            fontSize: '16px', color: '#6b7280',
                            marginTop: '8px', display: 'flex'
                        }}>
                            🗳 Vote to Earn {chainSym} Rewards · Community Voting Pool
                        </div>
                    </div>

                    {/* Right side — milestone */}
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        background: 'rgba(10,11,13,0.8)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: '24px',
                        width: '320px',
                        gap: '12px'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '12px', color: '#6b7280', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                            <span style={{ display: 'flex' }}>Milestone Progress</span>
                            <span style={{ color: '#22c55e', display: 'flex' }}>{pct}%</span>
                        </div>

                        <div style={{
                            fontSize: '40px', fontWeight: 800, color: '#ffffff',
                            display: 'flex', alignItems: 'baseline', gap: '4px'
                        }}>
                            {milestone}
                            <span style={{ fontSize: '18px', color: '#1a1b1e' }}>/{total}</span>
                        </div>

                        {/* Progress bar */}
                        <div style={{
                            height: '12px', background: '#000',
                            borderRadius: '10px', overflow: 'hidden',
                            border: '1px solid #222',
                            display: 'flex', width: '100%'
                        }}>
                            <div style={{
                                width: pct + '%', height: '100%',
                                background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                                borderRadius: '10px',
                                display: 'flex'
                            }} />
                        </div>

                        {/* Vote button */}
                        <div style={{
                            background: '#22c55e',
                            color: '#000',
                            padding: '16px',
                            borderRadius: '14px',
                            fontWeight: 800,
                            fontSize: '16px',
                            textAlign: 'center',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            VOTE TO UNLOCK
                        </div>
                    </div>
                </div>

                {/* Bottom stats */}
                <div style={{
                    display: 'flex', gap: '0',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    padding: '0 50px'
                }}>
                    <div style={{
                        flex: 1, padding: '20px 0',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        borderRight: '1px solid rgba(255,255,255,0.04)'
                    }}>
                        <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', display: 'flex' }}>{mcap}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex' }}>Market Cap</div>
                    </div>
                    <div style={{
                        flex: 1, padding: '20px 0',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        borderRight: '1px solid rgba(255,255,255,0.04)'
                    }}>
                        <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', display: 'flex' }}>{liq}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex' }}>Liquidity</div>
                    </div>
                    <div style={{
                        flex: 1, padding: '20px 0',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                    }}>
                        <div style={{ color: '#22c55e', fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', display: 'flex' }}>{vol}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex' }}>24h Volume</div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630
        }
    );
}
