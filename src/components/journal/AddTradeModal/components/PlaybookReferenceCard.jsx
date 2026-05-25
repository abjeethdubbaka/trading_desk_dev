import React from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Search,
  ShieldAlert,
  Target,
} from 'lucide-react';

function formatExpectedR(profile) {
  const min = Number(profile?.min);
  const target = Number(profile?.target);
  const stretch = Number(profile?.stretch);
  const hasMin = Number.isFinite(min);
  const hasTarget = Number.isFinite(target);
  const hasStretch = Number.isFinite(stretch);

  if (!hasMin && !hasTarget && !hasStretch) {
    return 'n/a';
  }

  return `${hasMin ? min.toFixed(1) : '-'}R -> ${hasTarget ? target.toFixed(1) : '-'}R -> ${hasStretch ? stretch.toFixed(1) : '-'}R`;
}

function CriteriaBlock({ icon: Icon, title, items, toneClassName }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
      <p className={`mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] ${toneClassName}`}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <p key={`${title}-${item}`} className="text-xs text-white/80">
            - {item}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function PlaybookReferenceCard({ entry }) {
  if (!entry) return null;

  const examples = Array.isArray(entry.examples)
    ? entry.examples.filter((example) => example?.title || example?.url || example?.note).slice(0, 2)
    : [];

  return (
    <div className="rounded-xl border border-emerald-300/25 bg-gradient-to-br from-emerald-500/10 to-cyan-500/8 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-emerald-100/75">
            <BookOpenCheck className="h-3.5 w-3.5" />
            Setup Playbook
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{entry.name}</p>
          <p className="text-xs text-white/65">
            {entry.timeframe || 'Timeframe n/a'} | {entry.market_context || 'Context n/a'}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/15 px-2.5 py-1.5">
          <p className="text-[10px] uppercase tracking-[0.13em] text-emerald-100/80">Expected R</p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-50">
            {formatExpectedR(entry.expected_r_profile)}
          </p>
        </div>
      </div>

      {entry.description ? (
        <p className="mt-2.5 text-xs text-white/80">{entry.description}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <CriteriaBlock
          icon={Search}
          title="Stock Filters"
          items={entry.stock_filter_criteria}
          toneClassName="text-amber-200/90"
        />
        <CriteriaBlock
          icon={Target}
          title="Entry"
          items={entry.entry_criteria}
          toneClassName="text-emerald-200/90"
        />
        <CriteriaBlock
          icon={CheckCircle2}
          title="Exit"
          items={entry.exit_criteria}
          toneClassName="text-cyan-200/90"
        />
        <CriteriaBlock
          icon={ShieldAlert}
          title="Invalidations"
          items={entry.invalidations}
          toneClassName="text-rose-200/90"
        />
      </div>

      {examples.length > 0 ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2.5">
          <p className="text-[10px] uppercase tracking-[0.13em] text-white/45">Examples</p>
          <div className="mt-1.5 space-y-1.5">
            {examples.map((example, index) => (
              <div key={`${entry.id}-example-${index}`} className="text-xs text-white/80">
                <p className="font-semibold text-white/90">
                  {example.title || `Example ${index + 1}`}
                </p>
                {example.note ? <p className="text-white/70">{example.note}</p> : null}
                {example.url ? (
                  <a
                    href={example.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                  >
                    Open example
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
