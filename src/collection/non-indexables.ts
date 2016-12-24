import {ArrayIterable} from './array-iterable';
import {BaseFluent} from './base-fluent';
import {IFluentNonIndexable} from './interfaces';
import {FluentIterable, Iterables} from './iterables';


export class FluentNonIndexable<T> extends BaseFluent<T[]> implements IFluentNonIndexable<T> {
  constructor(data: T[]) {
    super(data);
  }

  addAll(other: Iterable<T>): FluentIterable<T> {
    return Iterables.of(this.asIterable()).addAll(other);
  }

  addAllArray(array: T[]): FluentNonIndexable<T> {
    array.forEach((value: T) => {
      this.getData().push(value);
    });

    return this;
  }

  /**
   * @override
   */
  anyValue(): T | null {
    let data = this.getData();
    if (data.length > 0) {
      return data[0];
    } else {
      return null;
    }
  }

  asArray(): T[] {
    return this.getData();
  }

  asIterable(): Iterable<T> {
    return new ArrayIterable(this.getData());
  }

  asIterator(): Iterator<T> {
    return this.asIterable()[Symbol.iterator]();
  }

  asSet(): Set<T> {
    return new Set(this.getData());
  }

  /**
   * @override
   */
  diff(other: Set<T>): {added: Set<T>, removed: Set<T>, same: Set<T>} {
    let addedSet = new Set();
    let removedSet = new Set();
    let sameSet = new Set();

    this.forEach((value: T) => {
      if (other.has(value)) {
        sameSet.add(value);
      } else {
        removedSet.add(value);
      }
    });

    let thisSet = new Set(this.getData());
    NonIndexables
        .fromIterable(other)
        .forEach((value: T) => {
          if (!thisSet.has(value)) {
            addedSet.add(value);
          }
        });
    return {
      added: addedSet,
      removed: removedSet,
      same: sameSet,
    };
  }

  filter(filterFn: (value: T) => boolean): FluentNonIndexable<T> {
    let filteredData: T[] = [];
    this.forEach((value: T) => {
      if (filterFn(value)) {
        filteredData.push(value);
      }
    });
    return new FluentNonIndexable<T>(filteredData);
  }

  find(fn: (value: T) => boolean): (T|null) {
    for (let i = 0; i < this.getData().length; i++) {
      if (fn(this.getData()[i])) {
        return this.getData()[i];
      }
    }

    return null;
  }

  forEach(fn: (value: T) => void): FluentNonIndexable<T> {
    this.getData().forEach((value: T) => {
      fn(value);
    });
    return this;
  }

  forOf(fn: (value: T, breakFn: () => void) => void): FluentNonIndexable<T> {
    return this.iterate(fn);
  }

  iterate(fn: (value: T, breakFn: () => void) => void): FluentNonIndexable<T> {
    Iterables.of(ArrayIterable.newInstance(this.getData()))
        .iterate(fn);
    return this;
  }

  map<T2>(fn: (value: T) => T2): FluentNonIndexable<T2> {
    let newArray: T2[] = [];
    this.forEach((value: T) => {
      newArray.push(fn(value));
    });
    return new FluentNonIndexable<T2>(newArray);
  }

  removeAll(toRemove: Set<T>): FluentNonIndexable<T> {
    let newData: T[] = [];
    this.forEach((value: T) => {
      if (!toRemove.has(value)) {
        newData.push(value);
      }
    });
    return new FluentNonIndexable<T>(newData);
  }
}

export class NonIndexables {
  static of<T>(data: T[]): FluentNonIndexable<T> {
    return new FluentNonIndexable<T>(data);
  }

  static fromIterable<T>(iterable: Iterable<T>): FluentNonIndexable<T> {
    let data: T[] = [];
    Iterables.of(iterable)
        .iterate((value: T) => {
          data.push(value);
        });

    return new FluentNonIndexable<T>(data);
  }
}
