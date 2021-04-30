import {assert, should, test} from 'gs-testing';

import {$find} from './find';
import {$pipe} from './pipe';


test('@tools/collect/operators/find', () => {
  should('return the first element that matches the predicate', () => {
    assert($pipe([1, 2, 3], $find(v => v % 2 === 0))).to.equal(2);
  });

  should('return undefined if no elements match the predicate', () => {
    assert($pipe([1, 2, 3], $find(v => v > 3))).to.equal(undefined);
  });
});
