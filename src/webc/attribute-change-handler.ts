import { Arrays } from '../collection/arrays';
import { Maps } from '../collection/maps';
import { Annotations } from '../data/annotations';
import { BaseDisposable } from '../dispose/base-disposable';
import { DisposableFunction } from '../dispose/disposable-function';
import { ImmutableMap } from '../immutable/immutable-map';
import { ImmutableSet } from '../immutable/immutable-set';
import { Parser } from '../interfaces/parser';
import { IHandler } from '../webc/interfaces';


export type AttributeChangeHandlerConfig = {
  attributeName: string,
  handlerKey: string | symbol,
  parser: Parser<any> | null,
  selector: string | null,
};

export const ATTR_CHANGE_ANNOTATIONS: Annotations<AttributeChangeHandlerConfig> =
    Annotations.of<AttributeChangeHandlerConfig>(Symbol('attributeChangeHandler'));


/**
 * Handles attribute changes.
 */
export class AttributeChangeHandler implements IHandler<AttributeChangeHandlerConfig> {
  /**
   * @override
   */
  configure(
      targetEl: Element,
      instance: BaseDisposable,
      configs: AttributeChangeHandlerConfig[]): void {
    // Group the configs together.
    const configEntries: [string, AttributeChangeHandlerConfig][] = Arrays
        .of(configs)
        .map((config: AttributeChangeHandlerConfig):
            [string, AttributeChangeHandlerConfig] => {
          return [config.attributeName, config];
        })
        .asArray();
    const groupedConfig: Map<string, AttributeChangeHandlerConfig[]> =
        Maps.group(configEntries).asMap();
    const observer = this.createMutationObserver_(instance, groupedConfig);

    const attributeFilter = Arrays
        .of(configs)
        .map((config: AttributeChangeHandlerConfig) => {
          return config.attributeName;
        })
        .asArray();
    observer.observe(
        targetEl,
        {attributeFilter: attributeFilter, attributeOldValue: true, attributes: true});

    // Calls the initial "change".
    Maps
        .of(groupedConfig)
        .keys()
        .forEach((attributeName: string) => {
          this.onMutation_(
              instance,
              groupedConfig,
              [{
                addedNodes: {length: 0} as any as NodeList,
                attributeName: attributeName,
                attributeNamespace: null,
                nextSibling: null,
                oldValue: null,
                previousSibling: null,
                removedNodes: {length: 0} as any as NodeList,
                target: targetEl,
                type: 'attributes',
              }]);
        });
    instance.addDisposable(DisposableFunction.of(() => {
      observer.disconnect();
    }));
  }

  /**
   * Creates a new decorator.
   *
   * @param attributeName The name of attribute to watch for changes.
   * @param parser The parser to parse the value of the attribute.
   * @param selector The selector for the element whose attribute changes should be listened to.
   * @return The method decorator. The method take in 2 arguments: the new parsed value of the
   *    attribute and the old parsed value of the attribute.
   */
  createDecorator(
      attributeName: string,
      parser: Parser<any> | null,
      selector: string | null): MethodDecorator {
    return function(
        target: Object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor): PropertyDescriptor {
      ATTR_CHANGE_ANNOTATIONS.forCtor(target.constructor).attachValueToProperty(
          propertyKey,
          {
            attributeName: attributeName,
            handlerKey: propertyKey,
            parser: parser,
            selector: selector,
          });
      return descriptor;
    };
  }

  /**
   * @param callback
   * @return New instance of mutation observer.
   */
  createMutationObserver_(
      instance: BaseDisposable,
      groupedConfig: Map<string, AttributeChangeHandlerConfig[]>): MutationObserver {
    return new MutationObserver(this.onMutation_.bind(this, instance, groupedConfig));
  }

  /**
   * @override
   */
  getConfigs(instance: BaseDisposable):
      ImmutableMap<string | symbol, ImmutableSet<AttributeChangeHandlerConfig>> {
    return ATTR_CHANGE_ANNOTATIONS
        .forCtor(instance.constructor)
        .getAttachedValues();
  }

  /**
   * Handles event when there is a mutation on the mutation observer.
   *
   * @param instance Instance to call the handler on.
   * @param configs Array of attribute change configurations.
   * @param records Records collected by the mutation observer.
   */
  onMutation_(
      instance: any,
      configs: Map<string, AttributeChangeHandlerConfig[]>,
      records: MutationRecord[]): void {
    Arrays.of(records)
        .forEach((record: MutationRecord) => {
          const attributeName = record.attributeName;
          if (attributeName === null) {
            return;
          }

          if (configs.has(attributeName)) {
            Arrays
                .of(configs.get(attributeName)!)
                .forEach(((attributeName: string, config: AttributeChangeHandlerConfig) => {
                  const {handlerKey, parser} = config;
                  const handler = instance[handlerKey];
                  if (!!handler) {
                    if (parser !== null) {
                      const targetNode = record.target;
                      if (targetNode instanceof Element) {
                        const oldValue = parser.parse(record.oldValue);
                        const newValue = parser.parse(targetNode.getAttribute(attributeName));
                        handler.call(instance, newValue, oldValue);
                      }
                    } else {
                      handler.call(instance);
                    }
                  }
                }).bind(this, attributeName));
          }
        });
  }
}
// TODO: Mutable
