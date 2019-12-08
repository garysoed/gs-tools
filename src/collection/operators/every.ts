import { pipe } from '../pipe';
import { Stream } from '../types/stream';
import { asArray } from './as-array';

export function every<T, K>(
    checkFn: (item: T) => boolean,
): (from: Stream<T, K>) => boolean {
  return from => {
    for (const value of pipe(from, asArray())) {
      if (!checkFn(value)) {
        return false;
      }
    }

    return true;
  };
}