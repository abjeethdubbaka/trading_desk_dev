import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_SAMPLES_PER_OPTION,
  createDefaultTemplate,
  filterJournalEntriesByAccount,
  filterTradesOnDate,
  getExecutionGradeFromTrade,
  ratingToGrade,
  getTradeDate,
  getEntryCompletion,
  getJournalableTrades,
  getJournaledTradeIds,
  mergeEntryWithTrade,
  tradeToJournalDefaults,
  getTemplateForEntry,
  groupJournalEntriesByStrategy,
  journalEntrySignature,
  selectJournalEntriesForStrategies,
  normalizeJournalEntry,
  normalizeTemplate,
  summarizeByField,
  summarizeJournalEntries,
  toFieldId,
} from '../src/lib/setupJournal/utils.js';

const TEMPLATE = normalizeTemplate({
  fields: [{ label: 'Second high', options: ['Lower', 'Higher'] }],
  questions: [{ prompt: 'What did the market prove before I entered?' }],
});

const entry = (secondHigh, r) => ({ answers: { second_high: secondHigh }, r_multiple: r });

test('toFieldId turns a prompt label into a stable key', () => {
  assert.equal(toFieldId('Second high'), 'second_high');
  assert.equal(toFieldId('  Setup grade!  '), 'setup_grade');
  assert.equal(toFieldId(''), '');
});

test('the starter template carries the prompts and the question to answer every time', () => {
  const template = createDefaultTemplate();
  assert.equal(template.fields.length, 10);
  assert.deepEqual(
    template.fields.find((f) => f.id === 'second_high').options,
    ['Lower', 'Equal', 'Higher']
  );
  assert.equal(template.questions[0].prompt, 'What did the market prove before I entered?');
});

test('normalizeTemplate drops prompts that cannot be answered', () => {
  const template = normalizeTemplate({
    fields: [
      { label: 'Volume', options: ['Lower', '', 'Higher'] },
      { label: 'No options', options: [] },
      { label: '', options: ['x'] },
    ],
    questions: ['', { prompt: '  Why?  ' }],
  });

  assert.deepEqual(template.fields.map((f) => f.id), ['volume']);
  assert.deepEqual(template.fields[0].options, ['Lower', 'Higher']);
  assert.deepEqual(template.questions.map((q) => q.prompt), ['Why?']);
});

test('a setup uses its own template once it has one, and the starter until then', () => {
  assert.equal(getTemplateForEntry(null).fields.length, 10);
  assert.equal(getTemplateForEntry({ journal_template: { fields: [], questions: [] } }).fields.length, 10);

  const custom = getTemplateForEntry({
    journal_template: { fields: [{ label: 'Gap', options: ['Yes', 'No'] }] },
  });
  assert.deepEqual(custom.fields.map((f) => f.label), ['Gap']);
});

test('normalizeJournalEntry keeps answered prompts and coerces the numbers', () => {
  const normalized = normalizeJournalEntry({
    strategy: '  Double Top Short  ',
    symbol: 'AAPL',
    answers: { second_high: 'Lower', volume: '   ' },
    responses: { q1: ' Sellers defended the high twice ' },
    r_multiple: '2.5',
    mfe_r: '3.1',
    mae_r: 'not-a-number',
  });

  assert.equal(normalized.strategy, 'Double Top Short');
  assert.deepEqual(normalized.answers, { second_high: 'Lower' });
  assert.equal(normalized.responses.q1, 'Sellers defended the high twice');
  assert.equal(normalized.r_multiple, 2.5);
  assert.equal(normalized.mfe_r, 3.1);
  assert.equal(normalized.mae_r, null);
});

test('summarizeJournalEntries reports the result, and what was left on the table', () => {
  const summary = summarizeJournalEntries([
    { r_multiple: 2, mfe_r: 3, mae_r: 0.5 },
    { r_multiple: -1, mfe_r: 0.2, mae_r: 1 },
    { note: 'not scored yet' },
  ]);

  assert.equal(summary.count, 3);
  assert.equal(summary.scored, 2);
  assert.equal(summary.winRate, 50);
  assert.equal(summary.avgR, 0.5);
  assert.equal(summary.totalR, 1);
  assert.equal(summary.avgMfeR, 1.6);
  assert.equal(summary.avgMaeR, 0.75);
});

test('summarizeJournalEntries survives an empty journal', () => {
  const summary = summarizeJournalEntries([]);
  assert.equal(summary.count, 0);
  assert.equal(summary.avgR, null);
  assert.equal(summary.winRate, null);
});

test('summarizeByField scores every answer of a prompt separately', () => {
  const rows = summarizeByField(
    [entry('Lower', 2), entry('Lower', 3), entry('Higher', -1)],
    TEMPLATE
  );

  const secondHigh = rows.find((row) => row.id === 'second_high');
  const lower = secondHigh.options.find((o) => o.option === 'Lower');
  const higher = secondHigh.options.find((o) => o.option === 'Higher');

  assert.equal(lower.avgR, 2.5);
  assert.equal(lower.winRate, 100);
  assert.equal(higher.avgR, -1);
});

test('summarizeByField names the best and worst answer once each is used enough', () => {
  const rows = summarizeByField([
    ...Array.from({ length: MIN_SAMPLES_PER_OPTION }, () => entry('Lower', 2)),
    ...Array.from({ length: MIN_SAMPLES_PER_OPTION }, () => entry('Higher', -1)),
  ], TEMPLATE);

  assert.equal(rows[0].best.option, 'Lower');
  assert.equal(rows[0].worst.option, 'Higher');
});

test('summarizeByField withholds a call while an answer is barely used', () => {
  const rows = summarizeByField([entry('Lower', 2), entry('Higher', -1)], TEMPLATE);
  assert.equal(rows[0].best, null);
  assert.equal(rows[0].worst, null);
});

test('an answer nobody has picked reports no data rather than a zero', () => {
  const rows = summarizeByField([entry('Lower', 2)], TEMPLATE);
  const higher = rows[0].options.find((o) => o.option === 'Higher');
  assert.equal(higher.count, 0);
  assert.equal(higher.avgR, null);
});

test('groupJournalEntriesByStrategy keys case-insensitively and drops unnamed entries', () => {
  const grouped = groupJournalEntriesByStrategy([
    { strategy: 'Double Top Short' },
    { strategy: ' double top short ' },
    { strategy: '' },
  ]);

  assert.equal(grouped.size, 1);
  assert.equal(grouped.get('double top short').length, 2);
});

test('getEntryCompletion counts prompts and questions against the template', () => {
  assert.deepEqual(
    getEntryCompletion({ answers: { second_high: 'Lower' }, responses: {} }, TEMPLATE),
    { answered: 1, required: 2, isComplete: false }
  );

  const full = getEntryCompletion({
    answers: { second_high: 'Lower' },
    responses: { what_did_the_market_prove_before_i_entered: 'It held the high' },
  }, TEMPLATE);
  assert.equal(full.isComplete, true);
});

test('tradeToJournalDefaults takes from the trade everything it already knows', () => {
  const defaults = tradeToJournalDefaults({
    id: 't1',
    symbol: 'AAPL',
    entry_time: '2026-09-12T14:31:00.000Z',
    r_multiple: 2.4,
    mfe_r_multiple: 3.1,
  });

  assert.equal(defaults.trade_id, 't1');
  assert.equal(defaults.symbol, 'AAPL');
  assert.equal(defaults.traded_on, '2026-09-12');
  assert.equal(defaults.r_multiple, 2.4);
  assert.equal(defaults.mfe_r, 3.1);
});

test('a linked entry reads its result from the trade, not from its own copy', () => {
  const merged = mergeEntryWithTrade(
    { trade_id: 't1', symbol: 'OLD', r_multiple: 1, mfe_r: 1, mae_r: 0.6 },
    { id: 't1', symbol: 'AAPL', entry_time: '2026-09-12T14:31:00.000Z', r_multiple: 2.4, mfe_r_multiple: 3.1 }
  );

  assert.equal(merged.symbol, 'AAPL');
  assert.equal(merged.traded_on, '2026-09-12');
  assert.equal(merged.r_multiple, 2.4);
  assert.equal(merged.mfe_r, 3.1);
  // Trades do not record MAE, so the debrief keeps what was typed.
  assert.equal(merged.mae_r, 0.6);
});

test('an entry keeps its own numbers when it is not linked, or the trade is gone', () => {
  const standalone = mergeEntryWithTrade({ symbol: 'TSLA', r_multiple: 1.5 }, null);
  assert.equal(standalone.r_multiple, 1.5);

  const orphaned = mergeEntryWithTrade({ trade_id: 'deleted', symbol: 'TSLA', r_multiple: 1.5 }, null);
  assert.equal(orphaned.symbol, 'TSLA');
  assert.equal(orphaned.r_multiple, 1.5);
});

test('getJournalableTrades offers this setup\'s trades that are not debriefed yet', () => {
  const trades = [
    { id: 't1', setup_type: 'Double Top Short' },
    { id: 't2', setup_type: 'double top short' },
    { id: 't3', setup_type: 'ORB' },
  ];
  const entries = [{ trade_id: 't1', strategy: 'Double Top Short' }];

  const offered = getJournalableTrades(trades, entries, 'Double Top Short');
  assert.deepEqual(offered.map((t) => t.id), ['t2']);
});

test('getJournalableTrades offers every un-journaled trade when no setup is named', () => {
  const trades = [
    { id: 't1', setup_type: 'Double Top Short' },
    { id: 't2', setup_type: 'ORB' },
    { id: 't3' },
  ];

  // A trade with no setup has no template, so it is never offered.
  assert.deepEqual(
    getJournalableTrades(trades, [{ trade_id: 't1' }]).map((t) => t.id),
    ['t2']
  );
});

test('getJournaledTradeIds ignores entries that were never linked', () => {
  const ids = getJournaledTradeIds([{ trade_id: 't1' }, { trade_id: '' }, {}]);
  assert.equal(ids.size, 1);
  assert.ok(ids.has('t1'));
});

test('the picker narrows to the trades taken on one day', () => {
  const trades = [
    { id: 't1', entry_time: '2026-09-12T14:31:00.000Z' },
    { id: 't2', entry_time: '2026-09-11T18:02:00.000Z' },
    { id: 't3', created_date: '2026-09-12T09:00:00.000Z' },
    { id: 't4' },
  ];

  assert.deepEqual(
    filterTradesOnDate(trades, '2026-09-12').map((t) => t.id),
    ['t1', 't3']
  );
  // No date asked for means no narrowing.
  assert.equal(filterTradesOnDate(trades, '').length, 4);
});

test('getTradeDate reads the calendar day a trade was taken', () => {
  assert.equal(getTradeDate({ entry_time: '2026-09-12T14:31:00.000Z' }), '2026-09-12');
  assert.equal(getTradeDate({}), '');
});

test('ratingToGrade turns the trade\'s score out of 10 into a letter', () => {
  assert.equal(ratingToGrade(10), 'A+');
  assert.equal(ratingToGrade(8.5), 'A');
  assert.equal(ratingToGrade(7), 'B');
  assert.equal(ratingToGrade(5), 'C');
  assert.equal(ratingToGrade(4), 'D');
  assert.equal(ratingToGrade(1), 'F');
  assert.equal(ratingToGrade(null), '');
});

test('the execution grade is expressed in the letters the template offers', () => {
  const trade = { overall_rating: 2 };
  assert.equal(getExecutionGradeFromTrade(trade), 'F');
  // A template that stops at C calls a badly executed trade a C, not nothing.
  assert.equal(getExecutionGradeFromTrade(trade, ['A+', 'A', 'B', 'C']), 'C');
  assert.equal(getExecutionGradeFromTrade({ overall_rating: 9.5 }, ['A+', 'A']), 'A+');
  assert.equal(getExecutionGradeFromTrade({}), '');
});

test('a linked entry answers the execution prompt from the trade it is attached to', () => {
  const template = normalizeTemplate({
    fields: [{ label: 'Execution grade', options: ['A+', 'A', 'B', 'C', 'D', 'F'] }],
  });

  const merged = mergeEntryWithTrade(
    { trade_id: 't1', answers: { execution_grade: 'A+' } },
    { id: 't1', overall_rating: 5 },
    template
  );

  // What the trader typed is overruled by what the trade actually scored.
  assert.equal(merged.answers.execution_grade, 'C');
});

test('an unrated trade leaves the execution prompt as the entry recorded it', () => {
  const merged = mergeEntryWithTrade(
    { trade_id: 't1', answers: { execution_grade: 'B' } },
    { id: 't1' },
    null
  );
  assert.equal(merged.answers.execution_grade, 'B');
});

test('every setup keeps its own template, edits to one leaving the others alone', () => {
  const doubleTop = { name: 'Double Top Short', journal_template: { fields: [{ label: 'Second high', options: ['Lower', 'Higher'] }] } };
  const orb = { name: 'ORB' };

  assert.deepEqual(getTemplateForEntry(doubleTop).fields.map((f) => f.label), ['Second high']);
  // A setup that has not customised its prompts still starts from the starter.
  assert.equal(getTemplateForEntry(orb).fields.length, 10);
});

test('journalEntrySignature ignores id and date so a re-import is not a duplicate', () => {
  const a = { id: 'a', created_date: '2026-01-01', strategy: 'ORB', trade_id: 't1', traded_on: '2026-09-12', symbol: 'AAPL', answers: { volume: 'Higher' } };
  const b = { id: 'b', created_date: '2026-05-05', strategy: 'orb', trade_id: 't1', traded_on: '2026-09-12', symbol: 'aapl', answers: { volume: 'Higher' } };
  assert.equal(journalEntrySignature(a), journalEntrySignature(b));
});

test('journalEntrySignature separates entries that answered differently', () => {
  const base = { strategy: 'ORB', traded_on: '2026-09-12', answers: { volume: 'Higher' } };
  assert.notEqual(journalEntrySignature(base), journalEntrySignature({ ...base, answers: { volume: 'Lower' } }));
  assert.notEqual(journalEntrySignature(base), journalEntrySignature({ ...base, note: 'chased it' }));
});

test('selectJournalEntriesForStrategies exports only the setups being backed up', () => {
  const entries = [
    { strategy: 'ORB' },
    { strategy: ' orb ' },
    { strategy: 'Retired Setup' },
  ];

  assert.equal(selectJournalEntriesForStrategies(entries, ['ORB']).length, 2);
  assert.deepEqual(selectJournalEntriesForStrategies(entries, []), []);
});

test('a debrief records the account tier it was traded on', () => {
  assert.equal(normalizeJournalEntry({ account_type: 'live' }).account_type, 'live');
  assert.equal(normalizeJournalEntry({}).account_type, '');
});

test('each tier sees its own journal, and entries written before tiers stay visible', () => {
  const entries = [
    { id: 'a', account_type: 'live' },
    { id: 'b', account_type: 'demo' },
    { id: 'c' },
  ];

  assert.deepEqual(filterJournalEntriesByAccount(entries, 'live').map((e) => e.id), ['a', 'c']);
  assert.deepEqual(filterJournalEntriesByAccount(entries, 'demo').map((e) => e.id), ['b', 'c']);
  // No tier asked for means no narrowing.
  assert.equal(filterJournalEntriesByAccount(entries, '').length, 3);
});
