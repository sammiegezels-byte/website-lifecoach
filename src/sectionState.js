const DEFAULT_SECTION_ORDER = ['home', 'over-mij', 'visie', 'werk-met-mij', 'aanbod', 'contact'];

// An explicit order (even an empty one) is authoritative. Custom page metadata
// also contains recoverable pages in the trash and must not restore them.
export function getActiveSectionOrder(content, fallbackOrder = DEFAULT_SECTION_ORDER) {
  const order = Array.isArray(content.sectionOrder) ? content.sectionOrder : fallbackOrder;
  const trashedIds = new Set((content.trashedSections || []).map(section => section.id));
  return [...new Set(order)].filter(id => typeof id === 'string' && !trashedIds.has(id));
}

export function getTrashSectionUpdates(content, id, deletedAt = Date.now()) {
  return {
    sectionOrder: getActiveSectionOrder(content).filter(sectionId => sectionId !== id),
    trashedSections: [
      ...(content.trashedSections || []).filter(section => section.id !== id),
      { id, deletedAt },
    ],
  };
}

export function getRestoreSectionUpdates(content, id) {
  return {
    sectionOrder: [...getActiveSectionOrder(content).filter(sectionId => sectionId !== id), id],
    trashedSections: (content.trashedSections || []).filter(section => section.id !== id),
  };
}

export function getPermanentlyRemoveSectionUpdates(content, ids) {
  const removedIds = new Set(ids);
  return {
    sectionOrder: getActiveSectionOrder(content).filter(id => !removedIds.has(id)),
    trashedSections: (content.trashedSections || []).filter(section => !removedIds.has(section.id)),
    customSections: (content.customSections || []).filter(section => !removedIds.has(section.id)),
  };
}
