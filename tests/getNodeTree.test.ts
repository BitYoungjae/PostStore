import { sortTestSnapshot, getNodeTreeSnapshot } from '../scripts/snapshotList';

test('getNodeTree', async () => {
  const testResult = await getNodeTreeSnapshot();
  expect(testResult).toBe(true);
});

test('sort test', async () => {
  const testResult = await sortTestSnapshot();
  expect(testResult).toBe(true);
});
