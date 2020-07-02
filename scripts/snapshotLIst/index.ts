import * as list from './snapshotList';
export * from './snapshotList';

export type SnapshotGenerator = (shoudUpdate?: boolean) => Promise<boolean>;

const generators = Object.values(list).filter(
  (value) => typeof value === 'function',
) as SnapshotGenerator[];

export default generators;
