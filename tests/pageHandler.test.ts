import { getMainPageHandlerSnapshot } from '../scripts/snapshotList';

test('getMainPageHandler', async () => {
  const testResult = await getMainPageHandlerSnapshot();
  expect(testResult).toBe(true);
});
