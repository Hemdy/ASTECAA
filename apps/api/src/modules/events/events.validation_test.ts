import assert from 'node:assert/strict';
import { validateEventInput } from '@astec/validation';

const validEvent = {
  title: 'Alumni Gathering',
  subtitle: '',
  description: '',
  longDescription: '',
  date: '2026-12-19',
  venue: 'ASTECAA Hall',
  category: 'Reunion',
  capacity: 250,
  status: 'draft',
  featured: false,
};

Deno.test('event validation applies safe defaults to optional content', () => {
  const result = validateEventInput(validEvent);

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.gallery, []);
    assert.deepEqual(result.data.schedule, []);
    assert.deepEqual(result.data.tags, []);
    assert.equal(result.data.endDate, undefined);
  }
});

Deno.test('event validation rejects invalid dates and impossible date ranges', () => {
  assert.equal(
    validateEventInput({ ...validEvent, date: '2026-02-30' }).success,
    false
  );
  assert.equal(
    validateEventInput({
      ...validEvent,
      date: '2026-12-20',
      endDate: '2026-12-19',
    }).success,
    false
  );
});

Deno.test('event validation rejects invalid capacity, state and schedule input', () => {
  assert.equal(validateEventInput({ ...validEvent, capacity: 0 }).success, false);
  assert.equal(validateEventInput({ ...validEvent, status: 'live' }).success, false);
  assert.equal(
    validateEventInput({
      ...validEvent,
      schedule: [{ time: '10:00', title: '', detail: '' }],
    }).success,
    false
  );
});
