import {Arrays} from 'src/collection/arrays';

import {IDomBinder} from './interfaces';


export class ClassListBinder implements IDomBinder<Set<string>> {
  private readonly classList_: DOMTokenList;

  /**
   * @param element The element to bind to.
   */
  constructor(element: Element) {
    this.classList_ = element.classList;
  }

  /**
   * @override
   */
  delete(): void {
    Arrays
        .fromDomTokenList(this.classList_)
        .forEach((className: string) => {
          this.classList_.remove(className);
        });
  }

  /**
   * @override
   */
  get(): Set<string> {
    let classNames = Arrays
        .fromDomTokenList(this.classList_)
        .asArray();
    return new Set(classNames);
  }

  /**
   * @override
   */
  set(value: Set<string> | null): void {
    let classNames = value || new Set();

    // Remove the ones that are removed.
    Arrays
        .fromDomTokenList(this.classList_)
        .forEach((className: string) => {
          if (!classNames.has(className)) {
            this.classList_.remove(className);
          }
        });

    // Add new ones.
    classNames.forEach((className: string) => {
      this.classList_.add(className);
    });
  }

  /**
   * Creates a new instance of the binder.
   *
   * @param element The element to bind to.
   * @return New instance of the binder.
   */
  static of(element: Element): ClassListBinder {
    return new ClassListBinder(element);
  }
}
