import { assert, setup, should, test } from 'gs-testing/export/main';
import { generatorFrom } from '../generators';
import { InfiniteList } from '../infinite-list';
import { insertAt } from './insert-at';

test('collect.operators.insertAt', () => {
  let list: InfiniteList<number>;

  setup(() => {
    list = new InfiniteList(generatorFrom([1, 2, 3]));
  });

  should(`insert the new value correctly`, () => {
    assert(list.transform(insertAt(123, 0))()).to.startWith([123, 1, 2, 3]);
    assert(list.transform(insertAt(123, 1))()).to.startWith([1, 123, 2, 3]);
    assert(list.transform(insertAt(123, 3))()).to.startWith([1, 2, 3, 123]);
  });

  should(`handle out of bound indexes correctly`, () => {
    assert(list.transform(insertAt(123, -1))()).to.startWith([123, 1, 2, 3]);
    assert(list.transform(insertAt(123, 300))()).to.startWith([1, 2, 3, 123]);
  });
});