import { TypedGenerator } from './typed-generator';
import { Operator } from './operator';

export function take<T>(count: number): Operator<TypedGenerator<T>, TypedGenerator<T>> {
  return (from: TypedGenerator<T>) => {
    return function *(): IterableIterator<T> {
      let i = 0;
      for (const value of from()) {
        if (i >= count) {
          break;
        }

        yield value;
        i++;
      }
    };
  };
}
