import {assert, TestBase, verify} from '../test-base';
TestBase.setup();

import {NonIndexables} from './non-indexables';
import {Sets} from './sets';


describe('collection.Sets', () => {
  describe('fromArray', () => {
    it('should return the correct FluentNonIndexable', () => {
      let data = [1, 1, 2, 2, 3];
      spyOn(NonIndexables, 'fromIterable').and.callThrough();

      assert(Sets.fromArray(data).asArray()).to.equal([1, 2, 3]);
      verify(NonIndexables.fromIterable)(new Set(data));
    });
  });

  describe('of', () => {
    it('should return the correct FluentNonIndexable', () => {
      let data = new Set([1, 2, 3]);
      spyOn(NonIndexables, 'fromIterable').and.callThrough();

      assert(Sets.of(data).asArray()).to.equal([1, 2, 3]);
      verify(NonIndexables.fromIterable)(data);
    });
  });
});
