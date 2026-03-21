import { useState, useCallback } from 'react';

const SYSTEM_PROMPT = `You are an expert trading chart analyst. Analyze chart screenshots and return structured JSON only — no markdown, no explanation.`;

const USER_PROMPT = `Analyze this trading chart and return ONLY this JSON:
{"detected_setup":"VWAP Pullback|Breakout|Reversal|Continuation|Range|Momentum|Consolidation|Unknown","trend_direction":"up|down|sideways","timeframe":"string or null","entry_quality_score":0-10,"confidence":0.0-1.0,"risk_signals":["..."],"strength_signals":["..."],"narrative":"2-3 sentences","price_levels":{"support":number|null,"resistance":number|null,"entry_zone":"string|null"},"pattern_match":"string or null","entry_timing":"ideal|early|late|unknown","exit_timing":"ideal|early|late|cut_early|held_long|unknown","better_play":"string","one_thing_to_change":"string","entry_savings_potential":"$X or null","exit_left_on_table":"$X or null","advanced_analysis":{"execution":{"entry":{"grade":"A|B|C|D|F","timing":{"actual":"string|null","deviation_type":"early|late|ideal|null","deviation_minutes":0,"cost_of_deviation":0}},"exit":{"grade":"A|B|C|D|F","timing":{"actual":"string|null","deviation_type":"early|late|ideal|null","deviation_minutes":0,"cost_of_deviation":0}},"position":{"cost_of_size_mistake":0}},"pattern_matching":{"similar_trades_count":0,"similar_trades_win_rate":0,"similar_trades_avg_pnl":0,"recommendation":"string"},"improvement_analysis":{"primary_mistake":{"specific":"string","cost":0},"secondary_mistake":{"specific":"string|null","cost":0},"rewind":{"projected_pnl":0,"actual_vs_projected":0},"action_items":[{"description":"string","priority":"high|medium|low","type":"entry|exit|risk|psychology"}]}}}`;

async function analyzeImage(base64Data, mediaType='image/png') {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      model:'claude-sonnet-4-20250514', max_tokens:1500,
      system: SYSTEM_PROMPT,
      messages:[{ role:'user', content:[
        { type:'image', source:{ type:'base64', media_type:mediaType, data:base64Data } },
        { type:'text', text:USER_PROMPT },
      ]}],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const raw  = data.content?.find(b=>b.type==='text')?.text||'';
  return JSON.parse(raw.replace(/```json\n?|```\n?/g,'').trim());
}

export function useScreenshotAI() {
  const [imageStates, setImageStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  const setState = useCallback((id,s) => setImageStates(p=>({...p,[id]:s})), []);
  const setError = useCallback((id,e) => setImageErrors(p=>({...p,[id]:e})), []);

  const analyzeOne = useCallback(async (shot) => {
    setState(shot.id,'loading'); setError(shot.id,null);
    try {
      const [header, b64] = shot.url.split(',');
      const mime = header.match(/data:([^;]+)/)?.[1]||'image/png';
      const result = await analyzeImage(b64, mime);
      setState(shot.id,'done');
      return { id:shot.id, result };
    } catch(e) {
      setState(shot.id,'error'); setError(shot.id,e.message);
      return { id:shot.id, result:null, error:e.message };
    }
  }, [setState, setError]);

  const analyzeAll = useCallback(async (screenshots, onResult) => {
    if (!screenshots?.length) return;
    setImageStates(Object.fromEntries(screenshots.map(s=>[s.id,'idle'])));
    setImageErrors({});
    // Process with concurrency cap of 3
    const queue=[...screenshots];
    const run = async () => {
      if (!queue.length) return;
      const shot=queue.shift();
      const {id,result} = await analyzeOne(shot);
      if (result) onResult(id, result);
    };
    const workers = Array.from({length:Math.min(3,screenshots.length)}, run);
    // Continue draining queue
    const drain = async () => { while(queue.length) await run(); };
    await Promise.all([...workers, drain()]);
  }, [analyzeOne]);

  return {
    analyzeAll, analyzeOne,
    getState: useCallback(id=>imageStates[id]||'idle',[imageStates]),
    getError: useCallback(id=>imageErrors[id]||null,[imageErrors]),
    isAnyLoading: Object.values(imageStates).some(s=>s==='loading'),
    imageStates,
  };
}
