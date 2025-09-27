const {
  attachAttributionHelpers,
} = require("../src/components/Notes/plugins/attributionHelpers");

function simulate() {
  const mockEditor = {};
  const cleanup = attachAttributionHelpers(mockEditor);

  // Simulate nested edits marking dirty keys and a user set
  mockEditor.__markAttributionDirty("node-1");
  mockEditor.__markAttributionDirty(["node-2", "node-3"]);
  mockEditor.__setAttributionUser({ id: "u1", name: "Tester" });

  const meta = mockEditor.__getAttributionMeta();
  console.log("Meta:", meta);

  // Simulate building the JSON payload like AutoSavePlugin
  const jsonObj = {
    root: {
      /* ... */
    },
  };
  jsonObj.__meta = jsonObj.__meta || { attributions: {} };
  const now = new Date().toISOString();
  for (const k of meta.dirtyKeys) {
    jsonObj.__meta.attributions[k] = {
      lastEditedBy: meta.lastEditedBy || null,
      lastEditedAt: now,
    };
  }
  if (meta.lastEditedBy) {
    jsonObj.lastEditedBy = meta.lastEditedBy;
    jsonObj.lastEditedAt = meta.lastEditedAt || now;
  }

  console.log("Payload:", JSON.stringify(jsonObj, null, 2));
  cleanup();
  return { meta, payload: jsonObj };
}

if (require.main === module) {
  const result = simulate();
  const ok =
    result.meta &&
    result.meta.dirtyKeys &&
    result.meta.dirtyKeys.length === 3 &&
    result.meta.lastEditedBy &&
    result.payload.lastEditedBy &&
    Object.keys(result.payload.__meta.attributions).length === 3;
  console.log("Test", ok ? "PASSED" : "FAILED");
  if (!ok) process.exit(1);
}
