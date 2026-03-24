import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { computeCoreStats } from '@/lib/performanceMetrics';

const CACHE_KEY = 'morningBrief';
const today = () => new Date().toISOString().slice(0,10);

async function fetchBrief(trades) {
  // DISABLED: Direct API calls from browser are blocked by CORS and expose API keys
  // This should be moved to a backend API endpoint
  
  throw new Error('AI functionality disabled - requires backend API');
  
  // Original code (commented out for security):
  /*
  const recent = trades.slice(0,10);
  const s = computeCoreStats(recent);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      model:'claude-sonnet-4-20250514', max_tokens:300,
      messages:[{ role:'user', content:`You are a trading coach. Give exactly 3 short data-driven observations about this trader's recent performance.
Win rate: ${s.winRate.toFixed(0)}% | Avg R: ${s.avgR.toFixed(2)} | P&L: $${s.totalPnL.toFixed(0)} | Avg win: $${s.avgWin.toFixed(0)} | Avg loss: $${Math.abs(s.avgLoss).toFixed(0)}
Setups: ${[...new Set(recent.map(t=>t.setup_type).filter(Boolean))].join(', ')||'varied'}
Emotions: ${[...new Set(recent.map(t=>t.emotions).filter(Boolean))].join(', ')||'not logged'}
Plan followed: ${recent.length?(recent.filter(t=>t.followed_plan).length/recent.length*100).toFixed(0):0}%
Return ONLY JSON array: [{"type":"positive"|"warning"|"focus","text":"<max 20 words, specific>"}]` }],
    }),
  });
  const data = await res.json();
  return JSON.parse((data.content?.find(b=>b.type==='text')?.text||'[]').replace(/```json\n?|```\n?/g,'').trim());
  */
}

export default function MorningBrief({ trades=[] }) {
  const [brief,setBrief]   = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError]   = useState(null);

  const load = useCallback(async (force=false) => {
    if (!trades.length) return;
    if (!force) {
      try { const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}'); if(c.date===today()&&c.items?.length){setBrief(c.items);return;} } catch {}
    }
    setLoading(true); setError(null);
    try {
      const items = await fetchBrief(trades);
      setBrief(items);
      localStorage.setItem(CACHE_KEY,JSON.stringify({date:today(),items}));
    } catch { setError('Could not generate brief'); }
    finally { setLoading(false); }
  }, [trades]);

  useEffect(()=>{ load(); },[load]);

  const style = {
    positive:{ border:'border-emerald-500/25 bg-emerald-500/8', dot:'bg-emerald-400', text:'text-emerald-300/90' },
    warning: { border:'border-amber-500/25 bg-amber-500/8',     dot:'bg-amber-400',   text:'text-amber-300/90' },
    focus:   { border:'border-blue-500/25 bg-blue-500/8',        dot:'bg-blue-400',    text:'text-blue-300/90' },
  };

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">Morning Brief</span>
          <span className="text-[10px] text-white/30">AI · updates daily</span>
        </div>
        <button onClick={()=>load(true)} disabled={loading} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40" title="Regenerate">
          <RefreshCw className={`w-3.5 h-3.5 text-white/50 ${loading?'animate-spin':''}`} />
        </button>
      </div>
      {loading && <div className="flex flex-col items-center justify-center gap-2 py-6 text-white/40"><Loader2 className="w-5 h-5 animate-spin" /><p className="text-xs">Claude is reading your trades…</p></div>}
      {error&&!loading && <div className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
      {!loading&&!error&&!trades.length && <p className="text-xs text-white/30 text-center py-4">Log your first trade to unlock the morning brief.</p>}
      {!loading&&brief && (
        <div className="flex flex-col gap-2">
          {brief.map((item,i)=>{
            const s=style[item.type]||style.focus;
            return (
              <div key={i} className={`rounded-lg border px-3 py-2.5 flex items-start gap-2.5 ${s.border}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                <p className={`text-xs leading-relaxed ${s.text}`}>{item.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
