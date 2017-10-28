import { assert, TestBase } from '../test-base';
TestBase.setup();

import { NumberType } from '../check';
import { BaseDisposable } from '../dispose';
import { Flags } from '../dispose/base-disposable';
import {
  Graph,
  instanceId,
  nodeIn,
  nodeOut,
  staticId } from '../graph';
import { StaticNodeProvider } from '../graph/node-provider';
import { TestDispose } from '../testing';

const $ = {
  a: staticId<number>('a', NumberType),
  b: staticId<number>('b', NumberType),
  c: staticId<number>('c', NumberType),
};

describe('graph functional test', () => {
  beforeEach(() => {
    Flags.enableTracking = false;
  });

  describe('with static functions', () => {
    let providesB: StaticNodeProvider<number>;
    let providesC: StaticNodeProvider<number>;

    async function providesA(b: number): Promise<number> {
      const c = await Graph.get($.c, Graph.getTimestamp());
      return b + c;
    }

    beforeEach(() => {
      Graph.clearNodesForTests([$.a, $.b, $.c]);
      Graph.registerProvider<number, number>($.a, providesA, $.b);
      providesB = Graph.createProvider($.b, 3);
      providesC = Graph.createProvider($.c, 4);
    });

    it(`should handle default values`, async () => {
      assert(await Graph.get($.a, Graph.getTimestamp())).to.equal(7);
    });

    it(`should handle values set by the provider`, async () => {
      const setPromises = Promise.all([providesB(2), providesC(3)]);

      // At this point, the value hasn't been set yet.
      assert(await Graph.get($.a, Graph.getTimestamp())).to.equal(7);

      await setPromises;
      assert(await Graph.get($.a, Graph.getTimestamp())).to.equal(5);
    });
  });

  describe('with instance functions without annotations', () => {
    const $a = instanceId('a', NumberType);
    const $b = instanceId('b', NumberType);

    class TestClass extends BaseDisposable {
      constructor(
          private readonly b_: number,
          private readonly providesASpy_: jasmine.Spy) {
        super();
      }

      providesA(b: number, c: number): number {
        this.providesASpy_(b, c);
        return b + c;
      }

      providesB(): number {
        return this.b_;
      }
    }
    let providesC: StaticNodeProvider<number>;

    beforeEach(() => {
      Graph.clearNodesForTests([$a, $b, $.c]);
      Graph.registerProvider($a, TestClass.prototype.providesA, $b, $.c);
      Graph.registerProvider($b, TestClass.prototype.providesB);
      providesC = Graph.createProvider($.c, 3);
    });

    it(`should handle default values`, async () => {
      const test1 = new TestClass(1, jasmine.createSpy('ProvidesA1'));
      const test2 = new TestClass(2, jasmine.createSpy('ProvidesA2'));

      assert(await Graph.get($a, Graph.getTimestamp(), test1)).to.equal(4);
      assert(await Graph.get($a, Graph.getTimestamp(), test2)).to.equal(5);
    });

    it(`should handle values set by the provider`, async () => {
      const test = new TestClass(2, jasmine.createSpy('ProvidesA'));
      const oldTimestamp = Graph.getTimestamp();
      const setPromise = providesC(5);

      // At this point, the value hasn't been set yet.
      assert(await Graph.get($a, Graph.getTimestamp(), test)).to.equal(5);

      await setPromise;
      assert(await Graph.get($a, Graph.getTimestamp(), test)).to.equal(7);
      assert(await Graph.get($a, oldTimestamp, test)).to.equal(5);
    });

    it(`should clear the cache if one of the providers have changed`, async () => {
      const test = new TestClass(2, jasmine.createSpy('ProvidesA'));
      TestDispose.add(test);

      const setPromise = providesC(5);
      const providesASpy = spyOn(TestClass.prototype, 'providesA').and.callThrough();

      // At this point, the value hasn't been set yet.
      assert(await Graph.get($a, Graph.getTimestamp(), test)).to.equal(5);
      providesASpy.calls.reset();
      assert(await Graph.get($a, Graph.getTimestamp(), test)).to.equal(5);
      assert(test.providesA).toNot.haveBeenCalled();

      await setPromise;
      assert(await Graph.get($a, Graph.getTimestamp(), test)).to.equal(7);
    });
  });

  describe('with instance functions with annotations', () => {
    const $a = instanceId('a', NumberType);
    const $b = instanceId('b', NumberType);

    class TestClass extends BaseDisposable {
      constructor(
          private readonly b_: number,
          private readonly providesASpy_: jasmine.Spy) {
        super();
      }

      @nodeOut($a)
      providesA(@nodeIn($b) b: number, @nodeIn($.c) c: number): number {
        this.providesASpy_(b, c);
        return b + c;
      }

      @nodeOut($b)
      providesB(): number {
        return this.b_;
      }
    }

    let providesC: StaticNodeProvider<number>;

    beforeEach(() => {
      Graph.clearNodesForTests([$.c]);
      providesC = Graph.createProvider($.c, 3);
    });

    it(`should handle default values`, async () => {
      const test1 = new TestClass(1, jasmine.createSpy('ProvidesA1'));
      const test2 = new TestClass(2, jasmine.createSpy('ProvidesA2'));

      assert(await Graph.get($a, Graph.getTimestamp(), test1)).to.equal(4);
      assert(await Graph.get($a, Graph.getTimestamp(), test2)).to.equal(5);
    });

    it(`should handle values set by the provider`, async () => {
      const test = new TestClass(2, jasmine.createSpy('ProvidesA'));
      const setPromise = providesC(5);

      // At this point, the value hasn't been set yet.
      assert(await Graph.get($a, Graph.getTimestamp(), test)).to.equal(5);

      await setPromise;
      assert(await Graph.get($a, Graph.getTimestamp(), test)).to.equal(7);
    });
  });
});
