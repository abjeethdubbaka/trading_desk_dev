const CALCULATOR_NOTE_PREFIX = 'Created from calculator at ';
const CALCULATOR_NOTE_SOURCE = 'Source: Float Position Sizer Calculator';

export function isCalculatorAutoNote(value) {
  const text = String(value ?? '').trim();
  if (!text) return false;

  return text.startsWith(CALCULATOR_NOTE_PREFIX) && text.includes(CALCULATOR_NOTE_SOURCE);
}

export function stripCalculatorAutoNote(value) {
  if (!value) return '';
  const text = String(value).trim();
  return isCalculatorAutoNote(text) ? '' : text;
}

const toCleanText = (value) => String(value ?? '').trim();
const firstNonEmptyText = (...values) => {
  for (const value of values) {
    const cleaned = toCleanText(value);
    if (cleaned) return cleaned;
  }
  return '';
};

export function buildReflectionSummary(reflectionAnswers) {
  const mistakes = firstNonEmptyText(
    reflectionAnswers?.what_went_wrong,
    reflectionAnswers?.whatWentWrong,
    reflectionAnswers?.what_wrong
  );
  const learning = firstNonEmptyText(
    reflectionAnswers?.what_learned,
    reflectionAnswers?.whatLearned,
    reflectionAnswers?.what_we_learn,
    reflectionAnswers?.what_did_you_learn
  );
  const improvements = firstNonEmptyText(reflectionAnswers?.improvements);
  const execution = firstNonEmptyText(reflectionAnswers?.execution);

  const lines = [];
  if (mistakes) {
    lines.push(`Mistakes: ${mistakes}`);
  }
  if (learning) {
    lines.push(`Learning: ${learning}`);
  }
  if (improvements) {
    lines.push(`Improvements: ${improvements}`);
  }
  if (execution) {
    lines.push(`Execution: ${execution}`);
  }

  return lines.join('\n');
}

export function buildTradeNotes({ reflectionAnswers, notes } = {}) {
  const reflectionSummary = buildReflectionSummary(reflectionAnswers);
  if (reflectionSummary) return reflectionSummary;
  return stripCalculatorAutoNote(notes);
}

export function getTradeNotesText(trade) {
  return buildTradeNotes({
    reflectionAnswers: trade?.reflection_answers,
    notes: trade?.notes,
  });
}
