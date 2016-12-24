import {assert, TestBase} from 'src/test-base';
TestBase.setup();

import {Validate} from './validate';


describe('valid.SetValidations', () => {
  describe('to.beEmpty', () => {
    it('should pass if the set is empty', () => {
      let result = Validate.set(new Set<number>()).to.beEmpty();
      assert(result.isValid()).to.beTrue();
    });

    it('should not pass if the set is not empty', () => {
      let result = Validate.set(new Set<number>([1, 2, 3])).to.beEmpty();
      assert(result.isValid()).to.beFalse();
      assert(result.getErrorMessage()).to.match(/to be empty/);
    });
  });

  describe('toNot.beEmpty', () => {
    it('should not pass if the set is empty', () => {
      let result = Validate.set(new Set<number>([])).toNot.beEmpty();
      assert(result.isValid()).to.beFalse();
      assert(result.getErrorMessage()).to.match(/to not be empty/);
    });

    it('should pass if the set is not empty', () => {
      let result = Validate.set(new Set<number>([1, 2, 3])).toNot.beEmpty();
      assert(result.isValid()).to.beTrue();
    });
  });

  describe('to.contain', () => {
    it('should pass if the element is in the set', () => {
      let result = Validate.set(new Set<number>([1, 2, 3])).to.contain(2);
      assert(result.isValid()).to.beTrue();
    });

    it('should not pass if the element is not in the set', () => {
      let result = Validate.set(new Set<number>([])).to.contain(5);
      assert(result.isValid()).to.beFalse();
      assert(result.getErrorMessage()).to.match(/to contain 5/);
    });
  });

  describe('toNot.contain', () => {
    it('should not pass if the element is in the array', () => {
      let result = Validate.set(new Set<number>([1, 2, 3])).toNot.contain(2);
      assert(result.isValid()).to.beFalse();
      assert(result.getErrorMessage()).to.match(/to not contain 2/);
    });

    it('should pass if the element is not in the array', () => {
      let result = Validate.set(new Set<number>([1, 2, 3])).toNot.contain(5);
      assert(result.isValid()).to.beTrue();
    });
  });
});
