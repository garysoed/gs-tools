import { Serializable } from '@nabu';
import { Ctor } from './types';
import { ImmutableObject, ImmutableOf } from './immutable-object';

export class ImmutableFactory<O, S extends Serializable> {
  constructor(private readonly specCtor: Ctor<O, S>) { }

  $create(serializable: S): ImmutableOf<O, S> {
    const immutable = new ImmutableObject(
        this.specCtor,
        serializable,
        args => this.$create(args),
    );

    // Collect the ctor hierarchy.
    const ctors: Function[] = [];
    let currentCtor = this.specCtor;
    while (currentCtor !== null && currentCtor.prototype) {
      ctors.push(currentCtor);
      currentCtor = Object.getPrototypeOf(currentCtor);
    }

    // Get the getter keys.
    const innerInstance = new this.specCtor(serializable);
    for (const ctor of ctors) {
      for (const key of Object.getOwnPropertyNames(ctor.prototype)) {
        const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, key);
        if (!descriptor) {
          continue;
        }

        if (descriptor.get) {
          Object.defineProperty(
              immutable,
              key,
              {configurable: true, get: () => (innerInstance as any)[key]},
          );
        }
      }
    }

    return immutable as any;
  }
}

export function generateImmutable<S, A extends Serializable>(specCtor: Ctor<S, A>): ImmutableFactory<S, A> {
  return new ImmutableFactory<S, A>(specCtor);
}
