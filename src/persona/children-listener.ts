import { DisposableFunction } from '../dispose';
import { Errors } from '../error';
import { Event } from '../interfaces';
import { ChildrenSelectorImpl } from '../persona/children-selector';
import { Listener } from '../persona/listener';
import { ChildrenSelector } from '../persona/selectors';

export class ChildrenListener<E extends Element, T> implements Listener<'childrenchange'> {
  constructor(private readonly childrenSelector_: ChildrenSelectorImpl<E, T>) { }

  createMutationObserver_(callback: (records: Iterable<MutationRecord>) => void):
      MutationObserver {
    return new MutationObserver(callback);
  }

  onMutation_(
      handler: (event: Event<'childrenchange'>) => any,
      context: any,
      records: Iterable<MutationRecord>): void {
    for (const record of records) {
      handler.call(
          context,
          {added: record.addedNodes, type: 'childrenchange', removed: record.removedNodes});
    }
  }

  start(
      root: ShadowRoot,
      handler: (event: Event<'childrenchange'>) => any,
      context: any): DisposableFunction {
    const observer = this.createMutationObserver_((records: Iterable<MutationRecord>) => {
      this.onMutation_(handler, context, records);
    });
    const elementSelector = this.childrenSelector_.getParentSelector();
    const element = elementSelector.getValue(root);
    if (!element) {
      throw Errors.assert(`element for ${elementSelector}`).shouldExist().butWas(element);
    }
    observer.observe(
        element,
        {
          childList: true,
        });
    return DisposableFunction.of(() => {
      observer.disconnect();
    });
  }
}

export function childrenListener<E extends Element, T>(
    selector: ChildrenSelector<T>): ChildrenListener<E, T> {
  if (!(selector instanceof ChildrenSelectorImpl)) {
    throw Errors.assert('selector').shouldBeAnInstanceOf(ChildrenSelectorImpl).butWas(selector);
  }

  return new ChildrenListener(selector);
}
