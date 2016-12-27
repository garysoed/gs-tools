import {Annotations} from '../data/annotations';

import {AttributeBinder} from './attribute-binder';
import {ChildrenElementsBinder} from './children-elements-binder';
import {ClassListBinder} from './class-list-binder';
import {ElementSwitchBinder} from './element-switch-binder';
import {IAttributeParser, IDomBinder} from './interfaces';
import {PropertyBinder} from './property-binder';
import {Util} from './util';


type BinderFactory = (element: HTMLElement, instance: any) => IDomBinder<any>;

export const ANNOTATIONS: Annotations<BinderFactory> =
    Annotations.of<BinderFactory>(Symbol('bind'));

export class Bind {
  private selector_: string | null;

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
    let self = this;
    return function(target: Object, propertyKey: string | symbol): void {
      // TODO: Warn that targetEl is null.
      ANNOTATIONS.forCtor(target.constructor).attachValueToProperty(
          propertyKey,
          (parentEl: HTMLElement, instance: any): IDomBinder<any> => {
            return binderFactory(Util.resolveSelector(self.selector_, parentEl)!, instance);
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
  attribute<T>(attributeName: string, parser: IAttributeParser<T>): PropertyDecorator {
    return this.createDecorator_(
        (element: Element): IDomBinder<any> => {
          return AttributeBinder.of<T>(element, attributeName, parser);
        });
  }

  /**
   * Binds the annotated [IDomBinder] to control the children of DOM elements.
   * $annotates DOM Binders of type DomBinder<T[]>
   * @param elementGenerator Function to generate new elements to use for the children.
   * @param dataSetter Function to add data to the generated element.
   * @return Property descriptor
   */
  childrenElements<T>(
      elementGenerator: (document: Document, instance: any) => Element,
      dataSetter: (data: T, element: Element, instance: any) => void): PropertyDecorator {
    return this.createDecorator_(
        (element: Element, instance: any): IDomBinder<any> => {
          return ChildrenElementsBinder.of<T>(
              element,
              dataSetter,
              elementGenerator,
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
export function bind(selector: string | null): Bind {
  return new Bind(selector);
};
