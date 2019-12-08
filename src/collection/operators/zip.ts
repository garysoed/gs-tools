import { createGeneratorOperatorCopySize } from '../create-operator';
import { GeneratorOperator } from '../types/operator';
import { Stream } from '../types/stream';

export function zip<T, B0, K>(
    g0: Stream<B0, K>,
): GeneratorOperator<T, K, [T, B0], K>;
export function zip<T, B0, B1, K>(
    g0: Stream<B0, K>,
    g1: Stream<B1, K>,
): GeneratorOperator<T, K, [T, B0, B1], K>;
export function zip<T, B0, B1, B2, K>(
    g0: Stream<B0, K>,
    g1: Stream<B1, K>,
    g2: Stream<B2, K>,
): GeneratorOperator<T, K, [T, B0, B1, B2], K>;
export function zip<T, K>(...generators: Array<Stream<any, any>>):
    GeneratorOperator<T, K, any[], K> {
  return createGeneratorOperatorCopySize(from => function *(): IterableIterator<any[]> {
    const iterables = generators.map(generator => generator());
    for (const valueA of from()) {
      const result = [valueA];
      for (const iterable of iterables) {
        const {value, done} = iterable.next();
        if (done) {
          return;
        }

        result.push(value);
      }

      yield result;
    }
  });
}