import { BaseDisposable } from '../dispose/base-disposable';
import { listener } from '../event/listener';
import { IElementConfig } from '../webc/interfaces';
import { Util } from '../webc/util';


/**
 * Annotates a class as a custom element.
 *
 * To create a new element class, you need to do the following:
 *
 * 1.  Create a new class extending [[BaseElement]].
 * 1.  Create an html file containing the element's template. This will be used as the content
 *     of the element.
 * 1.  Annotate the class with this annotation. Set the tag name and template URL of the file
 *     created in the previous step.
 * 1.  In the [[GameConfig]] object, return the configName as part of the elementConfigList.
 *
 * For example:
 *
 * ```typescript
 * import bootstrap from './game/bootstrap';
 * import Element from './util/a-element';
 *
 * \@customElement({
 *   tag: 'custom-element',
 *   templateUrl: 'custom-element.html'
 * })
 * class CustomElement {
 *   // ...
 * }
 *
 * bootstrap({
 *   elementConfigList: [
 *     Element.getConfigName(CustomElement)
 *   ]
 * });
 * ```
 *
 * In your main html file, you can do:
 *
 * ```html
 * <body>
 *   <custom-element></custom-element>
 * </body>
 * ```
 *
 * @param config The configuration object.
 */
export function customElement(config: IElementConfig): ClassDecorator {
  return function<C extends gs.ICtor<any>>(ctor: C): void {
    if (!(ctor.prototype instanceof BaseDisposable)) {
      throw new Error(`${ctor} needs to extend BaseDisposable`);
    }

    if (config.tag === '') {
      throw new Error(`Configuration for ${ctor.name} should have a non empty tag name`);
    }

    if (config.templateKey === '') {
      throw new Error(`Configuration for ${ctor.name} should have a non empty template key`);
    }
    Util.setConfig(ctor, config);
    listener()(ctor);
  };
}
