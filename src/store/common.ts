import { PostStore } from '../typings';
import { FSWatcher } from 'fs';

export const storeMap: Map<string, PostStore> = new Map();
export const watcherMap: Map<string, FSWatcher> = new Map();
