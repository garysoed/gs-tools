import {TestBase} from 'src/test-base';
TestBase.setup();

import {Mocks} from 'src/mock/mocks';

import {AssertFactory} from './assert-factory';


describe('jasmine.AssertFactory', () => {
  let mockProvider;
  let factory;

  beforeEach(() => {
    mockProvider = jasmine.createSpy('Provider');
    factory = new AssertFactory(mockProvider);
  });

  describe('to', () => {
    it('should return the provided object without reversal', () => {
      let object = Mocks.object('object');
      mockProvider.and.returnValue(object);

      expect(factory.to).toEqual(object);
      expect(mockProvider).toHaveBeenCalledWith(false);
    });
  });

  describe('toNot', () => {
    it('should return the provided object with reversal', () => {
      let object = Mocks.object('object');
      mockProvider.and.returnValue(object);

      expect(factory.toNot).toEqual(object);
      expect(mockProvider).toHaveBeenCalledWith(true);
    });
  });
});
