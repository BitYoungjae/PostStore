import {
  SnapshotGenerator,
  getNodeTreeSnapshot,
  sortTestSnapshot,
  propListSnapshot,
  getCategoriesPathSnapshot,
  getMainPageHandlerSnapshot,
} from './snapshotList';

export {
  getNodeTreeSnapshot,
  sortTestSnapshot,
  propListSnapshot,
  getCategoriesPathSnapshot,
  getMainPageHandlerSnapshot,
};

const snapshotList: SnapshotGenerator[] = [
  getNodeTreeSnapshot,
  sortTestSnapshot,
  propListSnapshot,
  getCategoriesPathSnapshot,
  getMainPageHandlerSnapshot,
];

export default snapshotList;
