import {FluentIndexable} from './indexables';


/**
 * Collection of methods to help manipulate arrays.
 *
 * The general flow is to input an array, do a bunch of transformations, and output the transformed
 * array at the end. Note that the input array should never be used again. This class does not make
 * any guarantee that it will / will not modify the input array.
 *
 * Example:
 *
 * ```typescript
 * Arrays
 *     .of(['a', 'b', 'c'])
 *     .map((value: string) => value + '1')
 *     .asArray();  // ['a1', 'b1', 'c1']
 * ```
 *
 * Note that every element in the array must be of the same type.
 */
export class Arrays {
  /**
   * Flattens an array of arrays into an array.
   *
   * @param items The array of arrays to flatten.
   * @return Array wrapper object to do operations on.
   */
  static flatten<T>(items: T[][]): FluentIndexable<T> {
    let array: T[] = [];
    Arrays
        .of(items)
        .forEach((values: T[]) => {
          Arrays
              .of(values)
              .forEach((value: T) => {
                array.push(value);
              });
        });
    return Arrays.of(array);
  }

  /**
   * Starts by using a DOM token list.
   *
   * @param tokenList The token list
   * @return Array wrapper object to do operations on.
   */
  static fromDomTokenList(tokenList: DOMTokenList): FluentIndexable<string> {
    let array: string[] = [];
    for (let i = 0; i < tokenList.length; i++) {
      array.push(tokenList.item(i));
    }
    return Arrays.of(array);
  }

  /**
   * Starts by using an HTML collection.
   *
   * @param collection The HTML collection object to start from.
   * @return Array wrapper object to do operations on.
   */
  static fromHtmlCollection(collection: HTMLCollection): FluentIndexable<Element> {
    let array: Element[] = [];
    for (let i = 0; i < collection.length; i++) {
      array.push(collection.item(i));
    }
    return Arrays.of(array);
  }
  /**
   * Starts by using a (finite) iterable.
   *
   * @param <T> Type of the array element.
   * @param iterable The iterable containing the elements.
   * @return Array wrapper object to do operations on.
   */
  static fromIterable<T>(iterable: Iterable<T>): FluentIndexable<T> {
    return Arrays.fromIterator<T>(iterable[Symbol.iterator]());
  }

  /**
   * Starts by using a (finite) iterator.
   *
   * @param <T> Type of the array element.
   * @param iterator The iterator containing the elements.
   * @return Array wrapper object to do operations on.
   */
  static fromIterator<T>(iterator: Iterator<T>): FluentIndexable<T> {
    let array: T[] = [];
    for (let entry = iterator.next(); !entry.done; entry = iterator.next()) {
      array.push(entry.value);
    }
    return Arrays.of(array);
  }

  /**
   * Starts by using a NodeList
   *
   * @param The nodelist to start from.
   * @return Array wrapper object to do operations on.
   */
  static fromNodeList<T extends Node>(nodeList: NodeListOf<T>): FluentIndexable<T> {
    let array: T[] = [];
    for (let i = 0; i < nodeList.length; i++) {
      array.push(nodeList.item(i));
    }
    return Arrays.of(array);
  }

  /**
   * Starts by using an array.
   *
   * @param <T> Type of the array element.
   * @param data The array object to start with.
   * @return Array wrapper object to do operations on.
   */
  static of<T>(data: T[]): FluentIndexable<T> {
    return new FluentIndexable<T>(data);
  }
};
