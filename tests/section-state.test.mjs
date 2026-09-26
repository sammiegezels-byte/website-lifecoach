import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveSectionOrder,
  getTrashSectionUpdates,
  getRestoreSectionUpdates,
  getPermanentlyRemoveSectionUpdates,
} from '../src/sectionState.js';

const page = { id: 'custom_challenge' };
const original = {
  sectionOrder: ['home', page.id, 'contact'],
  customSections: [page],
  customTitle_custom_challenge: 'Challenge',
  trashedSections: [],
};

test('moving a page to trash hides it immediately while keeping it recoverable', () => {
  const removed = { ...original, ...getTrashSectionUpdates(original, page.id, 123) };
  assert.deepEqual(getActiveSectionOrder(removed), ['home', 'contact']);
  assert.deepEqual(removed.customSections, [page]);
  assert.equal(removed.customTitle_custom_challenge, 'Challenge');
  assert.deepEqual(removed.trashedSections, [{ id: page.id, deletedAt: 123 }]);
  assert.deepEqual(original.sectionOrder, ['home', page.id, 'contact']);
});

test('trash suppresses a page even if an older saved order still contains it', () => {
  const inconsistent = { ...original, trashedSections: [{ id: page.id, deletedAt: 123 }] };
  assert.deepEqual(getActiveSectionOrder(inconsistent), ['home', 'contact']);
  assert.deepEqual(getActiveSectionOrder({ ...inconsistent, sectionOrder: undefined }, ['home', page.id]), ['home']);
});

test('restoring a page puts it back exactly once and clears its trash entry', () => {
  const removed = { ...original, ...getTrashSectionUpdates(original, page.id, 123) };
  const restored = { ...removed, ...getRestoreSectionUpdates(removed, page.id) };
  const restoredAgain = { ...restored, ...getRestoreSectionUpdates(restored, page.id) };
  assert.deepEqual(getActiveSectionOrder(restoredAgain), ['home', 'contact', page.id]);
  assert.deepEqual(restoredAgain.trashedSections, []);
  assert.deepEqual(restoredAgain.customSections, [page]);
});

test('permanent removal clears both stale order and custom metadata', () => {
  const inconsistent = { ...original, trashedSections: [{ id: page.id, deletedAt: 123 }] };
  const removed = { ...inconsistent, ...getPermanentlyRemoveSectionUpdates(inconsistent, [page.id]) };
  assert.deepEqual(removed.sectionOrder, ['home', 'contact']);
  assert.deepEqual(removed.customSections, []);
  assert.deepEqual(removed.trashedSections, []);
});

test('an explicit empty order does not restore custom pages or standard sections', () => {
  assert.deepEqual(getActiveSectionOrder({ ...original, sectionOrder: [] }), []);
});

test('active section order removes duplicate pages', () => {
  assert.deepEqual(getActiveSectionOrder({ sectionOrder: ['home', 'home', 'contact'] }), ['home', 'contact']);
});
