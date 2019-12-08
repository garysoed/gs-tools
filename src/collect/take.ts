import { Operator } from './operator';

/**
 * Grabs the first `count` elements from the iterable.
 */
export function take<T>(count: number): Operator<Iterable<T>, Iterable<T>> {
  return (fromIterable: Iterable<T>) => {
    return (function*(): Generator<T> {
      let i = 0;
      for (const item of fromIterable) {
        if (i >= count) {
          break;
        }
        yield item;
        i++;
      }
    })();
  };
}
