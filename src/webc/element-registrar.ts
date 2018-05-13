import { InstanceofType } from '../check';
import { BaseDisposable } from '../dispose';
import { MonadUtil } from '../event';
import { ImmutableSet } from '../immutable';
import { Injector } from '../inject';
import { Parser } from '../interfaces';
import { Cases } from '../string';
import { Log, LogLevel } from '../util';
import { BaseElement, DomHook, onDom, Templates, Util } from '../webc';
import { Handle } from '../webc/handle';
import { ANNOTATIONS as HookAnnotations } from '../webc/hook';
import { ANNOTATIONS as LIFECYCLE_ANNOTATIONS } from '../webc/on-lifecycle';

const LOG = new Log('gs-tools.webc.ElementRegistrar');


/**
 * Registers custom elements configured using [ElementConfig]
 */
export class ElementRegistrar extends BaseDisposable {
  private static __instance: symbol = Symbol('instance');

  private registeredCtors_: Set<gs.ICtor<BaseDisposable>> = new Set();

  /**
   * @hidden
   */
  constructor(
      private injector_: Injector,
      private templates_: Templates,
      private xtag_: xtag.IInstance) {
    super();
  }

  private configureLegacy_(instance: BaseElement, xtagContext: HTMLElement): void {
    const instancePrototype = instance.constructor;
    for (const [key, factories] of
        HookAnnotations.forCtor(instancePrototype).getAttachedValues()) {
      if (factories.size() > 1) {
        throw new Error(`Key ${key} can only have 1 Bind annotation`);
      }
      const factory = [...factories][0];
      if (factory === null) {
        return;
      }

      const hook = instance[key];
      if (!(hook instanceof DomHook)) {
        throw new Error(`Key ${key} should be an instance of DomHook`);
      }
      hook.open(factory(xtagContext, instance));
    }

    instance.onCreated(xtagContext);

    const origLogLevel = Log.getEnabledLevel();
    Log.setEnabledLevel(LogLevel.WARNING);
    Handle.configure(xtagContext, instance);
    Log.setEnabledLevel(origLogLevel);
  }

  getLifecycleConfig_(
      attributes: {[name: string]: Parser<any>},
      elementProvider: () => BaseDisposable,
      content: string): xtag.ILifecycleConfig {
    const registrar = this;
    // TODO: Log error for every one of these methods.
    return {
      attributeChanged: function(
          this: HTMLElement,
          attrName: string,
          oldValue: string,
          newValue: string): void {
        const propertyName = Cases.of(attrName).toCamelCase();
        if (attributes[propertyName]) {
          this[propertyName] = attributes[propertyName].parse(newValue);
        }
        ElementRegistrar.runOnInstance_(this, (element: BaseDisposable) => {
          if (element instanceof BaseElement) {
            element.onAttributeChanged(attrName, oldValue, newValue);
          }
        });
      },
      created: function(this: HTMLElement): void {
        const instance = elementProvider();
        registrar.addDisposable(instance);

        this[ElementRegistrar.__instance] = instance;
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = content;

        Util.setElement(instance, this);

        if (instance instanceof BaseElement) {
          Util.addAttributes(this, attributes);
          registrar.configureLegacy_(instance, this);
        } else {
          for (const key of registrar.getMethodsWithLifecycle_('create', instance)) {
            MonadUtil.callFunction({type: 'create'}, instance, key);
          }
          onDom.configure(this, instance);
        }
      },
      inserted: function(this: HTMLElement): void {
        ElementRegistrar.runOnInstance_(this, (instance: BaseDisposable) => {
          if (instance instanceof BaseElement) {
            instance.onInserted(this);
          } else {
            for (const key of registrar.getMethodsWithLifecycle_('insert', instance)) {
              MonadUtil.callFunction({type: 'insert'}, instance, key);
            }
          }
        });
      },
      removed: function(this: HTMLElement): void {
        ElementRegistrar.runOnInstance_(this, (instance: BaseDisposable) => {
          if (instance instanceof BaseElement) {
            instance.onRemoved(this);
          } else {
            for (const key of registrar.getMethodsWithLifecycle_('remove', instance)) {
              MonadUtil.callFunction({type: 'remove'}, instance, key);
            }
          }
        });
      },
    };
  }

  getMethodsWithLifecycle_(
      lifecycle: 'create' | 'insert' | 'remove',
      instance: Object): ImmutableSet<symbol | string> {
    return LIFECYCLE_ANNOTATIONS
        .forCtor(instance.constructor)
        .getAttachedValues()
        .filter((annotations: ImmutableSet<'create' | 'insert' | 'remove'>) => {
          return annotations.has(lifecycle);
        })
        .keys();
  }

  /**
   * Registers the given configuration.
   * @param config The configuration object to register.
   * @return Promise that will be resolved when the registration process is done.
   */
  async register(ctor: gs.ICtor<BaseDisposable>): Promise<void> {
    const config = Util.getConfig(ctor);
    if (!config) {
      return Promise.resolve();
    }

    const dependencies = config.dependencies || [];
    const promises = ImmutableSet.of([...dependencies])
        .mapItem((dependency: gs.ICtor<BaseElement>) => {
          return this.register(dependency);
        });

    try {
      await Promise.all(promises);
      if (!this.registeredCtors_.has(ctor)) {
        const template = this.templates_.getTemplate(config.templateKey);
        if (template === null) {
          throw new Error(`No templates found for key ${config.templateKey}`);
        }

        this.xtag_.register(
            config.tag,
            {
              lifecycle: this.getLifecycleConfig_(
                  config.attributes || {},
                  () => {
                    return this.injector_.instantiate(ctor);
                  },
                  template),
            });

        this.registeredCtors_.add(ctor);
        Log.info(LOG, `Registered: [${config.tag}]`);
      }
    } catch (error) {
      Log.error(LOG, `Failed to register ${config.tag}. Error: ${error}`);
      throw error;
    }
  }

  /**
   * @return A new instance of the registrar.
   */
  static newInstance(injector: Injector, templates: Templates): ElementRegistrar {
    const xtag = window['xtag'];
    if (xtag === undefined) {
      throw new Error(`Required x-tag library not found`);
    }
    return new ElementRegistrar(injector, templates, xtag);
  }

  /**
   * Runs the given function on an instance stored in the given element.
   *
   * @param el The element containing the instance to run the function on.
   * @param callback The function to run on the instance.
   */
  static runOnInstance_(el: any, callback: (component: BaseDisposable) => void): any {
    const instance = el[ElementRegistrar.__instance];
    if (InstanceofType(BaseDisposable).check(instance)) {
      return callback(instance);
    } else {
      throw Error(`Cannot find valid instance on element ${el.nodeName}`);
    }
  }
}
// TODO: Mutable
