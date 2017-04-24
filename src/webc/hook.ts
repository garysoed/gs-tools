import { Annotations } from '../data/annotations';
import { Parser } from '../interfaces/parser';
import { AttributeBinder } from '../webc/attribute-binder';
import { ChildrenElementsBinder, IDataHelper } from '../webc/children-elements-binder';
import { ClassListBinder } from '../webc/class-list-binder';
import { ElementSwitchBinder } from '../webc/element-switch-binder';
import { IDomBinder } from '../webc/interfaces';
import { PropertyBinder } from '../webc/property-binder';
import { Util } from '../webc/util';


type BinderFactory = (element: HTMLElement, instance: any) => IDomBinder<any>;

export const ANNOTATIONS: Annotations<BinderFactory> =
    Annotations.of<BinderFactory>(Symbol('bind'));

export class Hook {
  private readonly selector_: string | null;

  /**
   * @param selector Selector query to find the element to bind to, or null if the root
   *    should be used.
   */
  constructor(selector: string | null) {
    this.selector_ = selector;
  }

  /**
   * Creates the decorator.
   *
   * @param binderFactory Factory that generates the binder.
   * @return The property decorator.
   */
  private createDecorator_(
      binderFactory: (element: Element, instance: any) => IDomBinder<any>): PropertyDecorator {
    const self = this;
    return function(target: Object, propertyKey: string | symbol): void {
      ANNOTATIONS.forCtor(target.constructor).attachValueToProperty(
          propertyKey,
          (parentEl: HTMLElement, instance: any): IDomBinder<any> => {
            const element = Util.resolveSelector(self.selector_, parentEl);
            if (element === null) {
              throw new Error(`Cannot resolve selector ${self.selector_}`);
            }
            return binderFactory(element, instance);
          });
    };
  }

  /**
   * Binds the annotated [IDomBinder] to an annotation in the DOM.
   *
   * @param attributeName Name of the attribute to bind to.
   * @param parser The attribute parser.
   * @return Property descriptor.
   */
  attribute<T>(attributeName: string, parser: Parser<T>): PropertyDecorator {
    return this.createDecorator_(
        (element: Element): IDomBinder<any> => {
          return AttributeBinder.of<T>(element, attributeName, parser);
        });
  }

  /**
   * Binds the annotated [IDomBinder] to control the children of DOM elements.
   * $annotates DOM Binders of type DomBinder<T[]>
   * @param dataHelper Helper to generate the child elements and bind the data to the element.
   * @return Property descriptor
   */
  childrenElements<T>(
      dataHelper: IDataHelper<T>,
      startPadCount: number = 0,
      endPadCount: number = 0): PropertyDecorator {
    return this.createDecorator_(
        (element: Element, instance: any): IDomBinder<any> => {
          return ChildrenElementsBinder.of<T>(
              element,
              dataHelper,
              startPadCount,
              endPadCount,
              instance);
        });
  }

  /**
   * Binds the annotated [IDomBinder] to control the class list of the DOM element.
   *
   * @return Property descriptor
   */
  classList(): PropertyDecorator {
    return this.createDecorator_(
        (element: Element): IDomBinder<any> => {
          return ClassListBinder.of(element);
        });
  }

  /**
   * Binds the annotated [IDomBinder] to control the visibility of children elements.
   *
   * @param mapping Mapping from enum value to ID of the element to associate it with.
   * @return Property decorator.
   */
  elementSwitch<T>(mapping: Map<T, string>): PropertyDecorator {
    return this.createDecorator_(
        (element: Element): IDomBinder<any> => {
          return ElementSwitchBinder.of(element, mapping);
        });
  }

  /**
   * @return Property descriptor
   */
  innerText(): PropertyDecorator {
    return this.property('innerText');
  }

  /**
   * Binds the annotated [IDomBinder] to a property of an element in the DOM.
   *
   * @param propertyName Name of the property to bind to.
   * @return Property descriptor
   */
  property(propertyName: string): PropertyDecorator {
    return this.createDecorator_(
        (element: HTMLElement): IDomBinder<any> => {
          return PropertyBinder.of<any>(element, propertyName);
        });
  }
}

/**
 * Annotation to bind classes to a location in the DOM.
 */
export function hook(selector: string | null): Hook {
  return new Hook(selector);
};