import {
  SnapshotGenerator,
  getNodeTreeSnapshot,
  sortTestSnapshot,
  propListSnapshot,
  getCategoriesPathSnapshot,
} from './snapshotList';

const snapshotList: SnapshotGenerator[] = [
  getNodeTreeSnapshot,
  sortTestSnapshot,
  propListSnapshot,
  getCategoriesPathSnapshot,
];

export default snapshotList;

export {
  getNodeTreeSnapshot,
  sortTestSnapshot,
  propListSnapshot,
  getCategoriesPathSnapshot,
};
