import { testPath } from './lib/env';
import { getNodeTree } from '../src/utils/getNodeTree';
import { snapShotTest } from './lib/snapshotTest';

test('getNodeTree', async () => {
  const fileTree = await getNodeTree({
    nodePath: testPath,
  });

  const testResult = await snapShotTest(fileTree, 'fileTree');
  expect(testResult).toBe(true);
});
