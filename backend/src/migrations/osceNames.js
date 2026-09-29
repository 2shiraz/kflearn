// One-time, idempotent rename of the old interactive-history persistence names.
// This does not alter ObjectIds, so existing attempts, scores and credit links
// continue to point at the same records.
const COLLECTIONS = [
  ["historymodules", "oscestations"],
  ["historyattempts", "osceattempts"],
  ["historyguides", "osceframeworks"],
];

const FIELDS = [
  ["oscestations", "historyGuideId", "osceFrameworkId"],
  ["osceattempts", "historyModuleId", "stationId"],
  ["osceattempts", "moduleVersion", "stationVersion"],
  ["unansweredquestions", "historyModuleId", "stationId"],
];

export async function migrateOsceNames(db, { apply = false } = {}) {
  const names = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name));
  const emptyTargets = new Set();
  for (const [oldName, newName] of COLLECTIONS) {
    if (names.has(oldName) && names.has(newName)) {
      const destinationCount = await db.collection(newName).countDocuments();
      if (destinationCount) throw new Error(`Both ${oldName} and ${newName} contain data. Resolve this conflict from a backup before migrating.`);
      emptyTargets.add(newName);
    }
  }

  // Check both old and new collection locations before the first write, so
  // $rename cannot overwrite an already-populated destination field.
  for (const [collectionName, oldField, newField] of FIELDS) {
    const oldName = COLLECTIONS.find(([, target]) => target === collectionName)?.[0];
    const existing = oldName && names.has(oldName) ? oldName : names.has(collectionName) ? collectionName : null;
    if (!existing) continue;
    const conflictCount = await db.collection(existing).countDocuments({ [oldField]: { $exists: true }, [newField]: { $exists: true } });
    if (conflictCount) throw new Error(`${existing} has ${conflictCount} documents with both ${oldField} and ${newField}; resolve them before migrating.`);
  }

  const actions = [];
  for (const [oldName, newName] of COLLECTIONS) {
    if (!names.has(oldName)) continue;
    actions.push(`Rename collection ${oldName} -> ${newName}${emptyTargets.has(newName) ? " (replace empty placeholder)" : ""}`);
    if (apply) {
      await db.collection(oldName).rename(newName, { dropTarget: emptyTargets.has(newName) });
      names.delete(oldName);
      names.add(newName);
    }
  }
  for (const [collectionName, oldField, newField] of FIELDS) {
    const oldName = COLLECTIONS.find(([, target]) => target === collectionName)?.[0];
    const existing = oldName && names.has(oldName) ? oldName : names.has(collectionName) ? collectionName : null;
    if (!existing) continue;
    const count = await db.collection(existing).countDocuments({ [oldField]: { $exists: true } });
    if (!count) continue;
    actions.push(`Rename ${count} ${existing}.${oldField} -> ${newField}`);
    if (apply) await db.collection(existing).updateMany({ [oldField]: { $exists: true } }, { $rename: { [oldField]: newField } });
  }
  if (names.has("contentauditlogs")) {
    const count = await db.collection("contentauditlogs").countDocuments({ contentType: "HistoryModule" });
    if (count) {
      actions.push(`Relabel ${count} OSCE audit entries`);
      if (apply) await db.collection("contentauditlogs").updateMany({ contentType: "HistoryModule" }, { $set: { contentType: "OsceStation" } });
    }
  }
  return actions;
}
