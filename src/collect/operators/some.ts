import { exec } from '../exec';
import { Stream } from '../types/stream';
import { asArray } from './as-array';

export function some<T, K>(checkFn: (item: T) => boolean): (from: Stream<T, K>) => boolean {
  return from => {
    for (const value of exec(from, asArray())) {
      if (checkFn(value)) {
        return true;
      }
    }

    return false;
  };
}
