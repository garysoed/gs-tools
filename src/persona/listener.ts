import { DisposableFunction } from '../dispose';
import { Event } from '../interfaces';

export interface Listener<E> {
  start(
      root: ShadowRoot,
      handler: (event: Event<E>) => any,
      context: any,
      useCapture: boolean): DisposableFunction;
}
