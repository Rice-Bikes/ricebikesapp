import runNotesSmokeTest from './runSmokeTest';

// This test invokes the runtime smoke test that uses @lexical/headless to
// parse a sample Lexical JSON containing a youtube node and asserts the node
// is preserved through parse + read.

test('headless preserves youtube node', async () => {
  const result = await runNotesSmokeTest();
  expect(result).toBe(true);
}, 20000);
