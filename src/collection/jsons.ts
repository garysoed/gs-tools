import {Maps} from 'src/collection/maps';
import {Validate} from 'src/valid/validate';


/**
 * Various utility methods to work with JSONs.
 *
 * @TODO Turn this into Fluent
 */
export class Jsons {
  /**
   * Recursively clones the given JSON.
   *
   * @param original The JSON to be cloned.
   * @return The cloned JSON.
   */
  static deepClone(original: gs.IJson): gs.IJson {
    return JSON.parse(JSON.stringify(original));
  }

  /**
   * Searchs for the value in the JSON at the given path.
   *
   * @param json The object to get the value of.
   * @param path `.` separatedpath to the location of the value to obtain.
   * @return The value at the given location, or undefined if none exists.
   */
  static getValue(json: gs.IJson, path: string): any {
    let parts = path.split('.');
    let object = json;
    for (let i = 0; i < parts.length && !!object; i++) {
      object = object[parts[i]];
    }
    return object;
  }

  /**
   * Sets the specified values in the given JSON, runs the given callback, and reverts the set
   * values.
   *
   * @param json The object to set the value of.
   * @param substitution A mapping of path to set to the value for each path. The path is a `.`
   *    separated path to the location of the value to set.
   * @param callback The callback to be called while the value is substituted.
   */
  static setTemporaryValue(
      json: gs.IJson,
      substitutions: {[path: string]: any},
      callback: () => void): void {
    let oldValues = Maps.fromRecord(substitutions)
        .mapValue((value: any, path: string) => {
          return Jsons.getValue(json, path);
        })
        .asRecord();

    // Substitutes the values.
    Maps.fromRecord(substitutions)
        .forEach((value: any, path: string) => {
          Jsons.setValue(json, path, value);
        });

    callback();

    // Puts the values back.
    Maps.fromRecord(oldValues)
        .forEach((value: any, path: string) => {
          Jsons.setValue(json, path, value);
        });
  }

  /**
   * Sets the value of the given object at the given path.
   *
   * For example:
   *
   * ```typescript
   * import Jsons from './jsons';
   *
   * Jsons.setValue(window, 'a.b.c', 123);
   * expect(window.a.b.c).toEqual(123);
   * ```
   *
   * @param json The object to set the value of.
   * @param path `.` separated path to the location of the value to set.
   * @param value The value to set.
   */
  static setValue(json: gs.IJson, path: string, value: any): void {
    Validate.string(path)
        .toNot.beEmpty()
        .orThrows(`Expected ${path} to not be empty`)
        .assertValid();

    let object = json;
    let parts = path.split('.');
    let propertyName: string = parts.pop()!;

    parts.forEach((part: string) => {
      if (object[part] === undefined) {
        object[part] = {};
      }
      object = object[part];
    });

    object[propertyName] = value;
  }

  /**
   * Mixins the two given JSONs.
   *
   * This will deep clone any objects in the fromObj. This will also overwrites any keys in the
   * toObj with the value in fromObj.
   *
   * @param fromObj The source object to do the mixin.
   * @param toObj The destination of the mixin.
   * @param {gs.IJson} fromObj [description]
   * @param {gs.IJson} toObj [description]
   */
  static mixin<A extends gs.IJson, B extends gs.IJson>(fromObj: A, toObj: B): A & B {
    for (let key in fromObj) {
      let value = fromObj[key];
      if (toObj[key] !== undefined) {
        if (typeof toObj[key] === 'object') {
          this.mixin(<any> value, <any> toObj[key]);
        }
      } else {
        toObj[key] = <any> this.deepClone(<any> value);
      }
    }
    return <A & B> toObj;
  }
};
