import { Avatar } from '../avatar/avatar';
import { InnerTextSelector } from '../avatar/inner-text-selector';
import { BaseDisposable } from '../dispose';
import { NodeId } from '../graph/node-id';
import { ANNOTATIONS } from '../graph/node-in';
import { ImmutableSet } from '../immutable';

export function renderInnerText<T>(selector: InnerTextSelector<T>): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    if (!(target instanceof BaseDisposable)) {
      throw new Error(`${target} is not an instance of BaseDisposable`);
    }

    const nodeIns = ANNOTATIONS
        .forCtor(target.constructor)
        .getAttachedValues()
        .get(propertyKey);
    const nodeInSet = nodeIns || ImmutableSet.of([]);
    const parameters = nodeInSet
        .mapItem(({id}: {id: NodeId<any>, index: number}) => {
          return id;
        });

    Avatar.defineRenderer(
        target.constructor as (typeof BaseDisposable),
        propertyKey,
        selector,
        ...parameters);
  };
}
