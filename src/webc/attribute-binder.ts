import { DomBinder } from '../interfaces/dom-binder';
import { Monad } from '../interfaces/monad';
import { Parser } from '../interfaces/parser';


/**
 * Binds to an attribute in the DOM.
 */
export class AttributeBinder<T> implements DomBinder<T>, Monad<T | null> {
  private readonly attributeName_: string;
  private readonly element_: Element;
  private readonly parser_: Parser<T>;

  /**
   * @param element The element to bind to.
   * @param attributeName Name of the attribute on the element to bind to.
   * @param parser The attribute value parser.
   */
  constructor(element: Element, attributeName: string, parser: Parser<T>) {
    this.attributeName_ = attributeName;
    this.element_ = element;
    this.parser_ = parser;
  }

  /**
   * @override
   */
  delete(): void {
    const attributes = this.element_.attributes;
    if (attributes.getNamedItem(this.attributeName_) !== null) {
      attributes.removeNamedItem(this.attributeName_);
    }
  }

  /**
   * @override
   */
  get(): T | null {
    return this.parser_.parse(this.element_.getAttribute(this.attributeName_));
  }

  /**
   * @override
   */
  set(value: T | null): void {
    if (value) {
      const stringifiedValue = this.parser_.stringify(value) || '';
      this.element_.setAttribute(this.attributeName_, stringifiedValue);
    } else {
      this.delete();
    }
  }

  /**
   * @param element The element to bind to.
   * @param attributeName Name of the attribute on the element to bind to.
   * @return New instance of attribute binder.
   */
  static of<T>(
      element: Element,
      attributeName: string,
      parser: Parser<T>): AttributeBinder<T> {
    return new AttributeBinder<T>(element, attributeName, parser);
  }
}
// TODO: Mutable
