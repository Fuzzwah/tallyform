import { readFileSync, writeFileSync, statSync, rmSync } from '@zos/fs';
import { createRepository } from './repository.js';

const options = { encoding: 'utf8' };

// Foreground-only writes. The alarm service must never write these records
// while the watch display is lit.
export function openNativeRepository() {
  return createRepository({
    read(path) {
      const raw = readFileSync({ path, options });
      if (raw === undefined && statSync({ path })) throw new Error(`Unreadable repository file: ${path}`);
      return raw;
    },
    write: (path, data) => writeFileSync({ path, data, options }),
    remove(path) {
      if (rmSync({ path }) !== 0) throw new Error(`Cannot remove obsolete repository file: ${path}`);
    },
  });
}
