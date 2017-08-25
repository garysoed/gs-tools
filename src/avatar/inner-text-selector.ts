import { IType } from 'src/check';
import { instanceId } from 'src/graph';
import {
  ElementSelector,
  ElementSelectorImpl,
  ElementSelectorStub } from '../avatar/element-selector';
import { SelectorImpl, SelectorStub } from '../avatar/selector';
import { InstanceId } from '../graph/instance-id';
import { Parser } from '../interfaces';

export interface InnerTextSelector<T> {
  getElementSelector(): ElementSelector<any>;

  getId(): InstanceId<T>;

  getParser(): Parser<T>;

  getValue(root: ShadowRoot): T | null;

  setValue(value: T | null, root: ShadowRoot): void;
}

export class InnerTextSelectorStub<T> extends SelectorStub<T> implements InnerTextSelector<T> {
  constructor(
      private readonly elementSelector_: ElementSelectorStub<HTMLElement>,
      private readonly parser_: Parser<T>,
      private readonly type_: IType<T>) {
    super();
  }

  getElementSelector(): ElementSelector<HTMLElement> {
    return this.throwStub();
  }

  getParser(): Parser<T> {
    return this.throwStub();
  }

  resolve(allSelectors: {}): InnerTextSelectorImpl<T> {
    return new InnerTextSelectorImpl(
        this.elementSelector_.resolve(allSelectors),
        this.parser_,
        this.type_);
  }
}

export class InnerTextSelectorImpl<T> extends SelectorImpl<T> implements InnerTextSelector<T> {
  constructor(
      private elementSelector_: ElementSelectorImpl<HTMLElement>,
      private parser_: Parser<T>,
      type: IType<T>) {
    super(instanceId(`${elementSelector_.getSelector()}@innerText`, type));
  }

  getElementSelector(): ElementSelector<HTMLElement> {
    return this.elementSelector_;
  }

  getParser(): Parser<T> {
    return this.parser_;
  }

  getValue(root: ShadowRoot): T | null {
    const element = this.elementSelector_.getValue(root);
    return this.parser_.parse(element.innerText);
  }

  setValue(value: T, root: ShadowRoot): void {
    const element = this.elementSelector_.getValue(root);
    element.innerText = this.parser_.stringify(value);
  }
}

export function innerTextSelector<T>(
    elementSelector: ElementSelector<HTMLElement>,
    parser: Parser<T>,
    type: IType<T>): InnerTextSelector<T> {
  if (elementSelector instanceof ElementSelectorStub) {
    return new InnerTextSelectorStub(elementSelector, parser, type);
  } else if (elementSelector instanceof ElementSelectorImpl) {
    return new InnerTextSelectorImpl(elementSelector, parser, type);
  } else {
    throw new Error(`Unhandled ElementSelector type ${elementSelector}`);
  }
}
