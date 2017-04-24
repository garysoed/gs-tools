import { assert, TestBase } from '../test-base';
TestBase.setup();

import { FloatParser } from '../parse/float-parser';


describe('parse.FloatParser', () => {
  describe('parse', () => {
    it('should return the parsed value correctly', () => {
      assert(FloatParser.parse('1.23')).to.equal(1.23);
    });

    it('should return null if the input is null', () => {
      assert(FloatParser.parse(null)).to.beNull();
    });
  });

  describe('stringify', () => {
    it('should return the string representation of the number', () => {
      assert(FloatParser.stringify(1.23)).to.equal('1.23');
    });

    it('should return empty string if the input is null', () => {
      assert(FloatParser.stringify(null)).to.equal('');
    });
  });
});