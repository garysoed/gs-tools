import {External} from '../pipeline/external';
import {Graph} from '../pipeline/graph';
import {Maps} from '../collection/maps';
import {Pipe} from '../pipeline/pipe';
import {Validate} from '../valid/validate';


/**
 * Registers templates.
 *
 * Use this for making web components.
 */
export class Templates {
  private static templates_: Map<string, string> = new Map<string, string>();

  constructor(private replacementMap_: Map<RegExp, string>) {  }

  @Pipe()
  private pipeTemplate_(@External('key') key: string): string | null {
    if (!Templates.templates_.has(key)) {
      return null;
    }
    let result: string = Templates.templates_.get(key)!;
    Maps.of(this.replacementMap_)
        .forEach((replacement: string, regexp: RegExp) => {
          result = result.replace(regexp, replacement);
        });
    return result;
  }

  /**
   * Retrieves the registered template.
   * @param key The key of the registered template to retrieve.
   * @return The registered template, or null if there are none.
   */
  getTemplate(key: string): string | null {
    return Graph.run<string | null>(this, 'pipeTemplate_', {'key': key});
  }

  /**
   * Registers the given template string to the given key.
   * @param key The key to register to.
   * @param templateStr The template string to register.
   */
  static register(key: string, templateStr: string): void {
    Validate.map(Templates.templates_)
        .toNot.containKey(key)
        .orThrows(`Key ${key} is already registered`)
        .assertValid();
    Templates.templates_.set(key, templateStr);
  }

  static newInstance(replacementMap: Map<RegExp, string> = new Map()): Templates {
    return new Templates(replacementMap);
  }
}