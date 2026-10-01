import { readFileSync, writeFileSync } from '@zos/fs';

const options = { encoding: 'utf8' };

export function readProbeFile(path) {
  return readFileSync({ path, options });
}

export function writeProbeFile(path, data) {
  writeFileSync({ path, data, options });
  return readProbeFile(path) === data;
}
