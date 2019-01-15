import { assert, setup, should, test } from 'gs-testing/export/main';
import { ImmutableMap } from '../immutable-map';
import { hasKey } from './has-key';

test('collect.operators.hasKey', () => {
  let map: ImmutableMap<number, string>;

  setup(() => {
    map = ImmutableMap.of(new Map([[1, 'a'], [2, 'b'], [3, 'c']]));
  });

  should(`return true if the key is in the collection`, () => {
    assert(map.$(hasKey(2))).to.beTrue();
  });

  should(`return false if the key is not in the collection`, () => {
    assert(map.$(hasKey(5))).to.beFalse();
  });
});
