import { assert, TestBase } from '../test-base';
TestBase.setup();

import { SizeParser } from '../parse/size-parser';


describe('parse.SizeParser', () => {
  describe('parse', () => {
    it(`should return the correct object`, () => {
      assert(SizeParser.parse('123vh')).to.equal({size: 123, unit: 'vh'});
    });

    it(`should default unitless size to "pt"`, () => {
      assert(SizeParser.parse('123')).to.equal({size: 123, unit: 'pt'});
    });

    it(`should return null if the string is invalid`, () => {
      assert(SizeParser.parse('a123abc')).to.beNull();
    });

    it(`should return null if the input is null`, () => {
      assert(SizeParser.parse(null)).to.beNull();
    });
  });

  describe('stringify', () => {
    it(`should return the correct string`, () => {
      assert(SizeParser.stringify({size: 123, unit: 'px'})).to.equal('123px');
    });

    it(`should return empty string if the input is null`, () => {
      assert(SizeParser.stringify(null)).to.equal('');
    });
  });
});
