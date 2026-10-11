import test from 'node:test';
import assert from 'node:assert/strict';
import alerts from '../public/guardian/alerts.cjs';

const { parseAlertLine, parseAlertWindow } = alerts;

// Exactly what Windows OCR returned for a real Trade Terminal alert window.
const OCR = `Alert
META W{AP REJ SHORT TRIGGERED @ 719.60 | 09:55 ET
x
Clear history
Hide history
Date
Message
META WÆP REJ SHORT TRIGGERED @ 719.60 | 09:55 ET
MUU WÆP REJ SHORT TRIGGERED @ 36.64 | 09:50 ET
TSLA W/AP REJ SHORT TRIGGERED @ 372.62 | 09:50 ET
KORU BL LONG TRIGGERED @ 18.69 | 09:45 ET
SPCX BL LONG TRIGGERED @ 166.07 | 09:45 ET
SPCX REJ SHORT TRIGGERED @ 165.92 | 09:40 ET
META WÆP REJ SHORT TRIGGERED @ 718.48 | 09:40 ET
DRAM WÆP REJ SHORT TRIGGERED @ 58.63 | 09:40 ET
TSLA BL LONG TRIGGERED @ 374.99 1 09:35 ET`;

test('an alert line becomes a trigger, however the setup words were mangled', () => {
  assert.deepEqual(
    { ...parseAlertLine('META W{AP REJ SHORT TRIGGERED @ 719.60 | 09:55 ET'), raw: undefined },
    { symbol: 'META', setupText: 'WAP REJ', setupRaw: 'W{AP REJ', direction: 'short', price: 719.6, timeEt: '09:55', raw: undefined },
  );
  // A "|" read as "1" still finds the time.
  const last = parseAlertLine('TSLA BL LONG TRIGGERED @ 374.99 1 09:35 ET');
  assert.equal(last.price, 374.99);
  assert.equal(last.timeEt, '09:35');
  assert.equal(last.setupText, 'BL');
});

test('lines that are not alerts are skipped', () => {
  for (const line of ['Alert', 'Clear history', 'Date', 'x', '9:52:27 AM', '']) {
    assert.equal(parseAlertLine(line), null, line);
  }
});

test('the whole window: nine triggers, the headline counted once', () => {
  const triggers = parseAlertWindow(OCR, { dateKey: '2026-10-08', nowMinutes: 10 * 60 });
  assert.equal(triggers.length, 9);
  assert.deepEqual(triggers.map((t) => t.symbol), ['META', 'MUU', 'TSLA', 'KORU', 'SPCX', 'SPCX', 'META', 'DRAM', 'TSLA']);
  assert.equal(triggers[0].id, '2026-10-08_0955_META_short_719_6');
  assert.ok(triggers.every((t) => t.date === '2026-10-08'));
});

test('rows timed after now are from an earlier day and left out', () => {
  const triggers = parseAlertWindow(OCR, { dateKey: '2026-10-09', nowMinutes: 9 * 60 + 42 });
  assert.deepEqual(triggers.map((t) => t.timeEt), ['09:40', '09:40', '09:40', '09:35']);
});
