// ─── Shared performance metrics — used by Dashboard, Performance, Journal, Settings ───

export function computeCoreStats(trades = []) {
  if (!trades.length) return {
    totalPnL:0, totalTrades:0, wins:0, losses:0, breakeven:0,
    winRate:0, avgWin:0, avgLoss:0, avgR:0, largestWin:0,
    largestLoss:0, avgPnL:0, profitFactor:0,
  };
  const wins   = trades.filter(t => (t.pnl||0) > 0);
  const losses = trades.filter(t => (t.pnl||0) < 0);
  const totalPnL  = trades.reduce((s,t) => s+(t.pnl||0), 0);
  const grossWin  = wins.reduce((s,t) => s+(t.pnl||0), 0);
  const grossLoss = Math.abs(losses.reduce((s,t) => s+(t.pnl||0), 0));
  const rTrades   = trades.filter(t => t.r_multiple != null);
  const avgR      = rTrades.length
    ? rTrades.reduce((s,t) => s+(parseFloat(t.r_multiple)||0), 0) / rTrades.length : 0;
  return {
    totalPnL, totalTrades:trades.length,
    wins:wins.length, losses:losses.length,
    breakeven: trades.length - wins.length - losses.length,
    winRate: (wins.length / trades.length) * 100,
    avgWin:  wins.length   ? grossWin  / wins.length   : 0,
    avgLoss: losses.length ? -(grossLoss / losses.length) : 0,
    avgR, largestWin:  wins.length   ? Math.max(...wins.map(t=>t.pnl||0))   : 0,
    largestLoss: losses.length ? Math.min(...losses.map(t=>t.pnl||0)) : 0,
    avgPnL: totalPnL / trades.length,
    profitFactor: grossLoss>0 ? grossWin/grossLoss : grossWin>0 ? Infinity : 0,
  };
}

export function getTodayStats(trades = []) {
  const now = new Date();
  const today = trades.filter(t => {
    const d = new Date(t.entry_time || t.created_date || 0);
    return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
  });
  return { trades: today, ...computeCoreStats(today) };
}

export function buildEquityCurve(trades = [], initialBalance = 50000) {
  if (!trades.length) return [];
  const sorted = [...trades]
    .filter(t => t.entry_time || t.created_date)
    .sort((a,b) => new Date(a.entry_time||a.created_date) - new Date(b.entry_time||b.created_date));
  let balance = initialBalance, peak = initialBalance;
  return sorted.map(t => {
    balance += (t.pnl||0);
    if (balance > peak) peak = balance;
    return { date:(t.entry_time||t.created_date).slice(0,10), balance:Math.round(balance*100)/100, drawdown:Math.round((balance-peak)*100)/100, pnl:t.pnl||0 };
  });
}

export function computeMaxDrawdown(curve = []) {
  return curve.reduce((min,p) => Math.min(min,p.drawdown), 0);
}

export function computeSharpeRatio(trades = []) {
  const byDay = {};
  trades.forEach(t => { const d=(t.entry_time||t.created_date||'').slice(0,10); if(d) byDay[d]=(byDay[d]||0)+(t.pnl||0); });
  const daily = Object.values(byDay);
  if (daily.length < 2) return 0;
  const mean = daily.reduce((s,v)=>s+v,0)/daily.length;
  const std  = Math.sqrt(daily.reduce((s,v)=>s+(v-mean)**2,0)/daily.length);
  return std>0 ? (mean/std)*Math.sqrt(252) : 0;
}

export function computeStreaks(trades = []) {
  const sorted = [...trades]
    .filter(t => t.entry_time||t.created_date)
    .sort((a,b) => new Date(a.entry_time||a.created_date)-new Date(b.entry_time||b.created_date));
  let cur=0, type=null, bestW=0, bestL=0;
  sorted.forEach(t => {
    const w=(t.pnl||0)>0, tp=w?'win':'loss';
    if (tp===type) cur++; else { type=tp; cur=1; }
    if (type==='win'&&cur>bestW) bestW=cur;
    if (type==='loss'&&cur>bestL) bestL=cur;
  });
  return { currentStreak:cur, currentType:type, bestWin:bestW, bestLoss:bestL };
}

export function getDailySequence(trades = [], days = 20) {
  const byDay = {};
  trades.forEach(t => { const d=(t.entry_time||t.created_date||'').slice(0,10); if(d) byDay[d]=(byDay[d]||0)+(t.pnl||0); });
  return Object.entries(byDay)
    .sort((a,b)=>a[0].localeCompare(b[0])).slice(-days)
    .map(([date,pnl]) => ({ date, pnl, result:pnl>0?'W':pnl<0?'L':'B' }));
}

export function computeEmotionStats(trades = []) {
  const order = ['confident','disciplined','neutral','nervous','fomo','revenge'];
  const g = {};
  trades.forEach(t => {
    const e=(t.emotions||'neutral').toLowerCase();
    if (!g[e]) g[e]={trades:[],pnl:0,wins:0};
    g[e].trades.push(t); g[e].pnl+=(t.pnl||0);
    if ((t.pnl||0)>0) g[e].wins++;
  });
  return order.filter(e=>g[e]).map(e => {
    const row=g[e], n=row.trades.length;
    const rT=row.trades.filter(t=>t.r_multiple!=null);
    const avgR=rT.length ? rT.reduce((s,t)=>s+(parseFloat(t.r_multiple)||0),0)/rT.length : 0;
    return { emotion:e, count:n, winRate:n?(row.wins/n)*100:0, avgPnL:n?row.pnl/n:0, totalPnL:row.pnl, avgR };
  });
}

export function computePlanAdherence(trades = []) {
  const f=trades.filter(t=>t.followed_plan===true||t.followed_plan==='true');
  const d=trades.filter(t=>t.followed_plan===false||t.followed_plan==='false');
  return { followed:{trades:f,...computeCoreStats(f)}, deviated:{trades:d,...computeCoreStats(d)} };
}

export function filterByPeriod(trades = [], period = 'all') {
  if (period==='all') return trades;
  const now=new Date(), cutoff=new Date(now);
  if (period==='1W') cutoff.setDate(now.getDate()-7);
  else if (period==='1M') cutoff.setMonth(now.getMonth()-1);
  else if (period==='3M') cutoff.setMonth(now.getMonth()-3);
  return trades.filter(t => new Date(t.entry_time||t.created_date||0)>=cutoff);
}

export function computeHoldDuration(trade) {
  if (!trade.entry_time || !trade.exit_time) return null;
  const mins = Math.round((new Date(trade.exit_time)-new Date(trade.entry_time))/60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}
