import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, ChevronRight, MessageSquareText, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  requestAssistantReply,
  requestTradeDecision,
  getDefaultChatModel,
} from '@/lib/ai/services/assistantChatService';
import { cn } from '@/lib/utils/general';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTradingContext } from '@/lib/context/TradingContext';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';

const CHAT_STORAGE_KEY = 'aiChat.session.v1';
const DECISION_STORAGE_KEY = 'aiChat.decision.v1';
const MODE_STORAGE_KEY = 'aiChat.mode.v1';
const CALCULATOR_DECISION_EVENT = 'calculator-decision-context';
const MAX_CONTEXT_MESSAGES = 18;
const MODEL_PRESETS = String(import.meta.env.VITE_OLLAMA_MODEL_PRESETS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const DEFAULT_DECISION_FORM = {
  symbol: '',
  setup: '',
  direction: 'long',
  entry: '',
  stop: '',
  target: '',
  account_balance: '',
  max_risk_dollars: '',
  today_pnl: '',
  max_daily_loss: '',
  trades_taken_today: '',
  max_daily_trades: '',
  notes: '',
};

const isBlank = (value) => String(value ?? '').trim() === '';

const toDisplayNumber = (value, decimals = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'n/a';
  return numericValue.toFixed(decimals);
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createAssistantIntro = () => ({
  id: makeId(),
  role: 'assistant',
  content:
    'TradeDesk AI is ready. Ask about setup quality, risk, discipline, or trade review.',
  createdAt: new Date().toISOString(),
});

const parseSavedChatState = () => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const safeMessages = Array.isArray(parsed.messages)
      ? parsed.messages
          .map((message) => ({
            id: String(message?.id || makeId()),
            role: message?.role === 'user' ? 'user' : 'assistant',
            content: String(message?.content || '').trim(),
            createdAt: message?.createdAt || new Date().toISOString(),
          }))
          .filter((message) => message.content)
      : [];

    return {
      messages: safeMessages,
      model: typeof parsed.model === 'string' ? parsed.model : null,
    };
  } catch {
    return null;
  }
};

const parseSavedDecisionForm = () => {
  try {
    const raw = localStorage.getItem(DECISION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...DEFAULT_DECISION_FORM,
      ...Object.fromEntries(
        Object.keys(DEFAULT_DECISION_FORM).map((key) => [
          key,
          String(parsed[key] ?? DEFAULT_DECISION_FORM[key]),
        ])
      ),
    };
  } catch {
    return null;
  }
};

function DecisionInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-white/12 bg-white/[0.03] px-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-emerald-300/45"
      />
    </label>
  );
}

function ChatMessages({ messages = [], isSending = false, scrollAnchorRef = null }) {
  return (
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={cn(
                'max-w-[92%] rounded-2xl border px-2.5 py-2 text-xs leading-relaxed',
                isUser
                  ? 'border-emerald-400/25 bg-emerald-500/15 text-emerald-50'
                  : 'border-white/12 bg-white/[0.04] text-white/90'
              )}
            >
              {!isUser && (
                <div className="mb-1 flex items-center gap-1 text-[10px] text-white/45">
                  <Bot className="h-3 w-3" />
                  TradeDesk AI
                </div>
              )}
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-white/90 prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isSending && (
        <div className="flex justify-start">
          <div className="rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-2 text-xs text-white/60">
            Thinking...
          </div>
        </div>
      )}

      <div ref={scrollAnchorRef} />
    </div>
  );
}

function DecisionPanel({
  decisionForm,
  decisionResult,
  onDecisionFieldChange,
  onApplyLiveContext,
  liveContext,
}) {
  const entry = Number(decisionForm.entry);
  const stop = Number(decisionForm.stop);
  const maxRisk = Number(decisionForm.max_risk_dollars);
  const riskPerShare = Number.isFinite(entry) && Number.isFinite(stop) ? Math.abs(entry - stop) : 0;
  const roughShares = riskPerShare > 0 && Number.isFinite(maxRisk) && maxRisk > 0
    ? Math.floor(maxRisk / riskPerShare)
    : 0;

  return (
    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
      <div className="space-y-2 rounded-xl border border-cyan-400/20 bg-cyan-500/8 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-100/80">Live Trading Context</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-cyan-100 hover:text-cyan-50"
            onClick={onApplyLiveContext}
          >
            Fill From Live Data
          </Button>
        </div>
        <p className="text-[11px] text-cyan-100/90">
          Today P&L: {liveContext.today_pnl_display} | Trades: {liveContext.trades_taken_today_display}/{liveContext.max_daily_trades_display}
        </p>
        <p className="text-[11px] text-cyan-100/90">
          Account: {liveContext.account_balance_display} | Risk/trade: {liveContext.max_risk_dollars_display} | Daily max loss: {liveContext.max_daily_loss_display}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DecisionInput
          label="Symbol"
          value={decisionForm.symbol}
          onChange={(value) => onDecisionFieldChange('symbol', value.toUpperCase())}
          placeholder="AAPL"
        />
        <DecisionInput
          label="Setup"
          value={decisionForm.setup}
          onChange={(value) => onDecisionFieldChange('setup', value)}
          placeholder="Breakout"
        />
        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">Direction</span>
          <select
            value={decisionForm.direction}
            onChange={(event) => onDecisionFieldChange('direction', event.target.value)}
            className="h-8 w-full rounded-lg border border-white/12 bg-white/[0.03] px-2 text-xs text-white outline-none focus:border-emerald-300/45"
          >
            <option value="long" className="bg-[#10151f]">Long</option>
            <option value="short" className="bg-[#10151f]">Short</option>
          </select>
        </label>
        <DecisionInput
          label="Today P&L"
          type="number"
          value={decisionForm.today_pnl}
          onChange={(value) => onDecisionFieldChange('today_pnl', value)}
          placeholder="-120"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <DecisionInput
          label="Entry"
          type="number"
          value={decisionForm.entry}
          onChange={(value) => onDecisionFieldChange('entry', value)}
          placeholder="12.45"
        />
        <DecisionInput
          label="Stop"
          type="number"
          value={decisionForm.stop}
          onChange={(value) => onDecisionFieldChange('stop', value)}
          placeholder="11.98"
        />
        <DecisionInput
          label="Target"
          type="number"
          value={decisionForm.target}
          onChange={(value) => onDecisionFieldChange('target', value)}
          placeholder="13.50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DecisionInput
          label="Account Balance"
          type="number"
          value={decisionForm.account_balance}
          onChange={(value) => onDecisionFieldChange('account_balance', value)}
          placeholder="25000"
        />
        <DecisionInput
          label="Max Risk $"
          type="number"
          value={decisionForm.max_risk_dollars}
          onChange={(value) => onDecisionFieldChange('max_risk_dollars', value)}
          placeholder="150"
        />
        <DecisionInput
          label="Max Daily Loss"
          type="number"
          value={decisionForm.max_daily_loss}
          onChange={(value) => onDecisionFieldChange('max_daily_loss', value)}
          placeholder="500"
        />
        <div className="grid grid-cols-2 gap-2">
          <DecisionInput
            label="Trades Today"
            type="number"
            value={decisionForm.trades_taken_today}
            onChange={(value) => onDecisionFieldChange('trades_taken_today', value)}
            placeholder="2"
          />
          <DecisionInput
            label="Daily Max"
            type="number"
            value={decisionForm.max_daily_trades}
            onChange={(value) => onDecisionFieldChange('max_daily_trades', value)}
            placeholder="5"
          />
        </div>
      </div>

      <label className="space-y-1">
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">Notes</span>
        <textarea
          value={decisionForm.notes}
          onChange={(event) => onDecisionFieldChange('notes', event.target.value)}
          placeholder="Catalyst, volume quality, market context, plan details..."
          className="min-h-[70px] w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-emerald-300/45"
        />
      </label>

      <div className="rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2 text-[11px] text-white/65">
        Rough risk-per-share: <span className="text-white/90">{riskPerShare > 0 ? riskPerShare.toFixed(3) : 'n/a'}</span>
        {' | '}
        Rough max shares: <span className="text-white/90">{roughShares > 0 ? roughShares : 'n/a'}</span>
      </div>

      {decisionResult && (
        <div className="space-y-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-emerald-200">Decision: {decisionResult.decision}</span>
            <span className="text-[11px] text-emerald-100/85">Confidence {Math.round(decisionResult.confidence)}%</span>
          </div>
          <p className="text-[11px] text-white/85">
            Size: {decisionResult.position_size_shares} shares | Risk: ${Number(decisionResult.risk_dollars || 0).toFixed(2)}
          </p>

          {decisionResult.reasons?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Reasons</p>
              <ul className="mt-1 space-y-1 text-[11px] text-white/85">
                {decisionResult.reasons.map((item) => (
                  <li key={`reason-${item}`}>- {item}</li>
                ))}
              </ul>
            </div>
          )}

          {decisionResult.invalidations?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Invalidations</p>
              <ul className="mt-1 space-y-1 text-[11px] text-white/85">
                {decisionResult.invalidations.map((item) => (
                  <li key={`invalid-${item}`}>- {item}</li>
                ))}
              </ul>
            </div>
          )}

          {decisionResult.next_best_action && (
            <p className="text-[11px] text-cyan-100/90">Next action: {decisionResult.next_best_action}</p>
          )}

          {decisionResult.cautions?.length > 0 && (
            <p className="text-[11px] text-amber-200/85">Caution: {decisionResult.cautions.join(' | ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ModeToggle({ mode, onModeChange }) {
  return (
    <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg border border-white/12 bg-white/[0.03] p-1">
      <button
        type="button"
        onClick={() => onModeChange('chat')}
        className={cn(
          'h-7 rounded-md text-xs font-semibold transition-colors',
          mode === 'chat' ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/65 hover:text-white'
        )}
      >
        Chat
      </button>
      <button
        type="button"
        onClick={() => onModeChange('decision')}
        className={cn(
          'h-7 rounded-md text-xs font-semibold transition-colors',
          mode === 'decision' ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/65 hover:text-white'
        )}
      >
        Decision
      </button>
    </div>
  );
}

function ChatDockPanel({
  isMobile,
  onToggle,
  model,
  modelOptions,
  onModelChange,
  mode,
  onModeChange,
  messages,
  input,
  onInputChange,
  onInputKeyDown,
  onSendMessage,
  isSending,
  error,
  onReset,
  decisionForm,
  decisionResult,
  onDecisionFieldChange,
  onApplyLiveContext,
  liveContext,
  onEvaluateDecision,
  isEvaluating,
  decisionError,
  evaluationBlocked,
  scrollAnchorRef,
}) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">AI Assistant</p>
            <p className="truncate text-[10px] text-white/45">{model}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/65"
            onClick={onReset}
            disabled={isSending || isEvaluating}
            title={mode === 'chat' ? 'New chat' : 'Reset decision form'}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/65"
            onClick={onToggle}
            title="Minimize chat"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2">
        <select
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          className="h-8 w-full rounded-lg border border-white/12 bg-white/[0.04] px-2 text-xs text-white outline-none focus:border-emerald-300/45"
          disabled={isSending || isEvaluating}
        >
          {modelOptions.map((option) => (
            <option key={option} value={option} className="bg-[#10151f] text-white">
              {option}
            </option>
          ))}
        </select>
      </div>

      <ModeToggle mode={mode} onModeChange={onModeChange} />

      {mode === 'chat' ? (
        <>
          <ChatMessages
            messages={messages}
            isSending={isSending}
            scrollAnchorRef={scrollAnchorRef}
          />

          <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
            <textarea
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Ask about setups, risk, or review..."
              className={cn(
                'w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-emerald-300/45',
                isMobile ? 'min-h-[70px]' : 'min-h-[78px]'
              )}
              disabled={isSending}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-white/40">Enter to send</p>
              <Button
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={onSendMessage}
                disabled={isSending || !input.trim()}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-300">
                {error}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <DecisionPanel
            decisionForm={decisionForm}
            decisionResult={decisionResult}
            onDecisionFieldChange={onDecisionFieldChange}
            onApplyLiveContext={onApplyLiveContext}
            liveContext={liveContext}
          />

          <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-white/40">Risk-first GO/WAIT/SKIP</p>
              <Button
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={onEvaluateDecision}
                disabled={evaluationBlocked || isEvaluating}
              >
                {isEvaluating ? 'Evaluating...' : 'Evaluate Trade'}
              </Button>
            </div>
            {decisionError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-300">
                {decisionError}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function ChatDock({ isOpen = true, onToggle }) {
  const savedChat = useMemo(() => parseSavedChatState(), []);
  const savedDecisionForm = useMemo(() => parseSavedDecisionForm(), []);

  const defaultModel = getDefaultChatModel();
  const configuredChatModel = import.meta.env.VITE_OLLAMA_CHAT_MODEL || '';
  const startingModel = configuredChatModel || savedChat?.model || defaultModel;

  const [mode, setMode] = useState(() => {
    try {
      const savedMode = JSON.parse(localStorage.getItem(MODE_STORAGE_KEY) || '"chat"');
      return savedMode === 'decision' ? 'decision' : 'chat';
    } catch {
      return 'chat';
    }
  });
  const [model, setModel] = useState(startingModel);
  const [messages, setMessages] = useState(
    savedChat?.messages?.length ? savedChat.messages : [createAssistantIntro()]
  );
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const [decisionForm, setDecisionForm] = useState(savedDecisionForm || DEFAULT_DECISION_FORM);
  const [decisionResult, setDecisionResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const scrollAnchorRef = useRef(null);
  const { settings } = useSettings();
  const { selectedSymbol, selectedEntryPrice, selectedTradeId } = useTradingContext();

  const currentTier = settings?.account_tier || 'custom';
  const { data: liveTrades = [] } = useTrades({
    filters: {
      account_tier: currentTier,
      sortBy: 'entry_time',
      sortDir: 'desc',
    },
  });

  const modelOptions = useMemo(() => {
    const set = new Set([startingModel, ...MODEL_PRESETS]);
    return [...set].filter(Boolean);
  }, [startingModel]);

  const selectedTrade = useMemo(() => {
    if (!selectedTradeId) return null;
    return liveTrades.find((trade) => String(trade?.id) === String(selectedTradeId)) || null;
  }, [liveTrades, selectedTradeId]);

  const liveDisciplineSnapshot = useMemo(
    () => buildDisciplineSnapshot(liveTrades, settings),
    [liveTrades, settings]
  );

  const liveDecisionDefaults = useMemo(() => {
    const directionRaw = String(selectedTrade?.direction || '').toLowerCase();
    const resolvedDirection = directionRaw === 'short' ? 'short' : 'long';

    return {
      symbol: selectedTrade?.symbol || selectedSymbol || '',
      setup: selectedTrade?.setup_type || '',
      direction: resolvedDirection,
      entry: selectedTrade?.entry_price ?? selectedEntryPrice ?? '',
      stop: selectedTrade?.stop_loss ?? '',
      target: selectedTrade?.target_price ?? '',
      account_balance: settings?.account_size ?? '',
      max_risk_dollars: settings?.risk_amount ?? '',
      today_pnl: liveDisciplineSnapshot?.metrics?.todayPnL ?? '',
      max_daily_loss: liveDisciplineSnapshot?.metrics?.maxDailyLoss ?? settings?.max_dollars ?? '',
      trades_taken_today: liveDisciplineSnapshot?.metrics?.todayTrades ?? '',
      max_daily_trades: liveDisciplineSnapshot?.metrics?.maxDailyTrades ?? settings?.max_daily_trades ?? '',
      notes: '',
    };
  }, [
    liveDisciplineSnapshot,
    selectedTrade,
    selectedSymbol,
    selectedEntryPrice,
    settings,
  ]);

  const liveContext = useMemo(() => ({
    today_pnl_display: toDisplayNumber(liveDecisionDefaults.today_pnl, 2),
    trades_taken_today_display: toDisplayNumber(liveDecisionDefaults.trades_taken_today, 0),
    max_daily_trades_display: toDisplayNumber(liveDecisionDefaults.max_daily_trades, 0),
    account_balance_display: toDisplayNumber(liveDecisionDefaults.account_balance, 0),
    max_risk_dollars_display: toDisplayNumber(liveDecisionDefaults.max_risk_dollars, 0),
    max_daily_loss_display: toDisplayNumber(liveDecisionDefaults.max_daily_loss, 0),
  }), [liveDecisionDefaults]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          model,
          messages: messages.slice(-80),
        })
      );
    } catch {
      // Best effort persistence only.
    }
  }, [messages, model]);

  useEffect(() => {
    try {
      localStorage.setItem(DECISION_STORAGE_KEY, JSON.stringify(decisionForm));
    } catch {
      // Best effort persistence only.
    }
  }, [decisionForm]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(mode));
    } catch {
      // Best effort persistence only.
    }
  }, [mode]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending, isOpen, mode]);

  const clearConversation = useCallback(() => {
    setMessages([createAssistantIntro()]);
    setError('');
  }, []);

  const resetDecisionForm = useCallback(() => {
    setDecisionForm(DEFAULT_DECISION_FORM);
    setDecisionResult(null);
    setDecisionError('');
  }, []);

  const onDecisionFieldChange = useCallback((field, value) => {
    setDecisionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const applyCalculatorContext = useCallback((payload = {}) => {
    setDecisionForm((prev) => {
      const nextNotes = String(payload.notes || '').trim();
      const mergedNotes = nextNotes
        ? isBlank(prev.notes)
          ? nextNotes
          : prev.notes.includes(nextNotes)
            ? prev.notes
            : `${prev.notes}\n${nextNotes}`
        : prev.notes;

      return {
        ...prev,
        symbol: String(payload.symbol || prev.symbol || '').toUpperCase(),
        direction: payload.direction ? String(payload.direction) : prev.direction,
        entry: payload.entry != null ? String(payload.entry) : prev.entry,
        stop: payload.stop != null ? String(payload.stop) : prev.stop,
        target: payload.target != null ? String(payload.target) : prev.target,
        max_risk_dollars:
          payload.max_risk_dollars != null
            ? String(payload.max_risk_dollars)
            : prev.max_risk_dollars,
        notes: mergedNotes,
      };
    });
  }, []);

  const applyLiveContext = useCallback(() => {
    setDecisionForm((prev) => {
      const nextSymbol = isBlank(prev.symbol) ? String(liveDecisionDefaults.symbol || '').toUpperCase() : prev.symbol;
      const nextSetup = isBlank(prev.setup) ? String(liveDecisionDefaults.setup || '') : prev.setup;
      const nextDirection = isBlank(prev.direction) ? String(liveDecisionDefaults.direction || 'long') : prev.direction;
      const nextEntry = isBlank(prev.entry) ? String(liveDecisionDefaults.entry ?? '') : prev.entry;
      const nextStop = isBlank(prev.stop) ? String(liveDecisionDefaults.stop ?? '') : prev.stop;
      const nextTarget = isBlank(prev.target) ? String(liveDecisionDefaults.target ?? '') : prev.target;
      const nextAccountBalance = isBlank(prev.account_balance) ? String(liveDecisionDefaults.account_balance ?? '') : prev.account_balance;
      const nextMaxRiskDollars = isBlank(prev.max_risk_dollars) ? String(liveDecisionDefaults.max_risk_dollars ?? '') : prev.max_risk_dollars;
      const nextTodayPnl = isBlank(prev.today_pnl) ? String(liveDecisionDefaults.today_pnl ?? '') : prev.today_pnl;
      const nextMaxDailyLoss = isBlank(prev.max_daily_loss) ? String(liveDecisionDefaults.max_daily_loss ?? '') : prev.max_daily_loss;
      const nextTradesTakenToday = isBlank(prev.trades_taken_today) ? String(liveDecisionDefaults.trades_taken_today ?? '') : prev.trades_taken_today;
      const nextMaxDailyTrades = isBlank(prev.max_daily_trades) ? String(liveDecisionDefaults.max_daily_trades ?? '') : prev.max_daily_trades;

      const hasChanges =
        nextSymbol !== prev.symbol ||
        nextSetup !== prev.setup ||
        nextDirection !== prev.direction ||
        nextEntry !== prev.entry ||
        nextStop !== prev.stop ||
        nextTarget !== prev.target ||
        nextAccountBalance !== prev.account_balance ||
        nextMaxRiskDollars !== prev.max_risk_dollars ||
        nextTodayPnl !== prev.today_pnl ||
        nextMaxDailyLoss !== prev.max_daily_loss ||
        nextTradesTakenToday !== prev.trades_taken_today ||
        nextMaxDailyTrades !== prev.max_daily_trades;

      if (!hasChanges) {
        return prev;
      }

      return {
        ...prev,
        symbol: nextSymbol,
        setup: nextSetup,
        direction: nextDirection,
        entry: nextEntry,
        stop: nextStop,
        target: nextTarget,
        account_balance: nextAccountBalance,
        max_risk_dollars: nextMaxRiskDollars,
        today_pnl: nextTodayPnl,
        max_daily_loss: nextMaxDailyLoss,
        trades_taken_today: nextTradesTakenToday,
        max_daily_trades: nextMaxDailyTrades,
      };
    });
  }, [liveDecisionDefaults]);

  useEffect(() => {
    if (mode === 'decision') {
      applyLiveContext();
    }
  }, [mode, applyLiveContext]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleCalculatorDecisionContext = (event) => {
      const payload = event?.detail || {};
      applyCalculatorContext(payload);
      setMode('decision');
      setDecisionResult(null);
      setDecisionError('');
    };

    window.addEventListener(CALCULATOR_DECISION_EVENT, handleCalculatorDecisionContext);
    return () => {
      window.removeEventListener(CALCULATOR_DECISION_EVENT, handleCalculatorDecisionContext);
    };
  }, [applyCalculatorContext]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || isSending) return;

    setError('');
    const userMessage = {
      id: makeId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const contextMessages = nextMessages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .slice(-MAX_CONTEXT_MESSAGES)
        .map((message) => ({ role: message.role, content: message.content }));

      const reply = await requestAssistantReply({
        model,
        messages: contextMessages,
      });

      const assistantMessage = {
        id: makeId(),
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err?.message || 'Chat request failed');
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages, model]);

  const evaluateDecision = useCallback(async () => {
    if (isEvaluating) return;

    setDecisionError('');
    setDecisionResult(null);
    setIsEvaluating(true);

    try {
      const result = await requestTradeDecision({
        model,
        tradeContext: decisionForm,
      });

      setDecisionResult(result);
    } catch (err) {
      setDecisionError(err?.message || 'Decision request failed');
    } finally {
      setIsEvaluating(false);
    }
  }, [decisionForm, isEvaluating, model]);

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError('');
    setDecisionError('');
  };

  const evaluationBlocked =
    !decisionForm.entry.trim() ||
    !decisionForm.stop.trim() ||
    !decisionForm.max_risk_dollars.trim();

  return (
    <>
      {!isOpen && (
        <>
          <button
            type="button"
            onClick={onToggle}
            className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-[#0f1726] px-3 py-2 text-xs font-semibold text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-colors hover:bg-[#132033] lg:inline-flex"
          >
            <MessageSquareText className="h-4 w-4" />
            AI Assistant
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="fixed bottom-4 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/35 bg-[#0f1726] text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.25)] lg:hidden"
            aria-label="Open AI Assistant"
          >
            <MessageSquareText className="h-5 w-5" />
          </button>
        </>
      )}

      {isOpen && (
        <>
          <aside className="fixed bottom-4 right-4 top-4 z-30 hidden w-[370px] rounded-2xl border border-white/10 bg-[#0f1420]/96 p-3 shadow-[0_14px_42px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:flex lg:flex-col">
            <ChatDockPanel
              isMobile={false}
              onToggle={onToggle}
              model={model}
              modelOptions={modelOptions}
              onModelChange={setModel}
              mode={mode}
              onModeChange={handleModeChange}
              messages={messages}
              input={input}
              onInputChange={setInput}
              onInputKeyDown={handleComposerKeyDown}
              onSendMessage={sendMessage}
              isSending={isSending}
              error={error}
              onReset={mode === 'chat' ? clearConversation : resetDecisionForm}
              decisionForm={decisionForm}
              decisionResult={decisionResult}
              onDecisionFieldChange={onDecisionFieldChange}
              onApplyLiveContext={applyLiveContext}
              liveContext={liveContext}
              onEvaluateDecision={evaluateDecision}
              isEvaluating={isEvaluating}
              decisionError={decisionError}
              evaluationBlocked={evaluationBlocked}
              scrollAnchorRef={scrollAnchorRef}
            />
          </aside>

          <div className="fixed inset-x-3 bottom-3 top-[78px] z-50 flex flex-col rounded-2xl border border-white/10 bg-[#0f1420]/96 p-3 shadow-[0_18px_46px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden">
            <ChatDockPanel
              isMobile
              onToggle={onToggle}
              model={model}
              modelOptions={modelOptions}
              onModelChange={setModel}
              mode={mode}
              onModeChange={handleModeChange}
              messages={messages}
              input={input}
              onInputChange={setInput}
              onInputKeyDown={handleComposerKeyDown}
              onSendMessage={sendMessage}
              isSending={isSending}
              error={error}
              onReset={mode === 'chat' ? clearConversation : resetDecisionForm}
              decisionForm={decisionForm}
              decisionResult={decisionResult}
              onDecisionFieldChange={onDecisionFieldChange}
              onApplyLiveContext={applyLiveContext}
              liveContext={liveContext}
              onEvaluateDecision={evaluateDecision}
              isEvaluating={isEvaluating}
              decisionError={decisionError}
              evaluationBlocked={evaluationBlocked}
              scrollAnchorRef={scrollAnchorRef}
            />
          </div>
        </>
      )}
    </>
  );
}
