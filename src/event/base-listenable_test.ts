import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from '../mock/mocks';
import { TestDispose } from '../testing/test-dispose';

import { BaseListenable } from './base-listenable';


describe('event.BaseListenable', () => {
  let listenable;

  beforeEach(() => {
    listenable = new BaseListenable<string>();
    TestDispose.add(listenable);
  });

  describe('dispose', () => {
    it('should clear the callback map', () => {
      const mockCallback = jasmine.createSpy('Callback');
      const event = 'event';
      TestDispose.add(listenable.on(event, mockCallback));
      listenable.dispose();

      listenable.dispatch(event, () => {});

      assert(mockCallback).toNot.haveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('should call all the registered callbacks', () => {
      const event = 'event';
      let i = 0;
      const mockBubbleHandler = jasmine.createSpy('BubbleHandler');
      TestDispose.add(listenable.on(
          event,
          (payload: any) => {
            mockBubbleHandler(i, payload);
          },
          this,
          false));

      const mockCaptureHandler = jasmine.createSpy('CaptureHandler');
      TestDispose.add(listenable.on(
          event,
          (payload: any) => {
            mockCaptureHandler(i, payload);
          },
          this,
          true));

      const payload = Mocks.object('payload');

      listenable.dispatch(
          event,
          () => {
            i = i + 1;
          },
          payload);

      assert(mockCaptureHandler).to.haveBeenCalledWith(0, payload);
      assert(mockBubbleHandler).to.haveBeenCalledWith(1, payload);
    });

    it('should handle case when no callbacks are registered', () => {
      assert(() => {
        listenable.dispatch('event', () => {}, 'payload');
      }).toNot.throw();
    });
  });

  describe('dispatchAsync', () => {
    it('should call all the registered callbacks', async (done: any) => {
      const event = 'event';
      let i = 0;
      const mockBubbleHandler = jasmine.createSpy('BubbleHandler');
      TestDispose.add(listenable.on(
          event,
          (payload: any) => {
            mockBubbleHandler(i, payload);
          },
          this,
          false));

      const mockCaptureHandler = jasmine.createSpy('CaptureHandler');
      TestDispose.add(listenable.on(
          event,
          (payload: any) => {
            mockCaptureHandler(i, payload);
          },
          this,
          true));

      const payload = Mocks.object('payload');

      const promise = listenable.dispatchAsync(
          event,
          async () => {
            i = i + 1;
          },
          payload);

      assert(mockCaptureHandler).to.haveBeenCalledWith(0, payload);
      assert(mockBubbleHandler).toNot.haveBeenCalled();

      await promise;

      assert(mockBubbleHandler).to.haveBeenCalledWith(1, payload);
    });

    it('should handle case when no callbacks are registered', () => {
      assert(() => {
        listenable.dispatch('event', () => {}, 'payload');
      }).toNot.throw();
    });
  });

  describe('on', () => {
    it('should return disposable function that stops listening to the event', () => {
      const mockCallback = jasmine.createSpy('Callback');
      const event = 'event';

      const disposableFunction = listenable.on(event, mockCallback);
      disposableFunction.dispose();

      listenable.dispatch(event, () => {});

      assert(mockCallback).toNot.haveBeenCalled();
    });
  });

  describe('once', () => {
    it('should listen to the event once', () => {
      const mockCallback = jasmine.createSpy('Callback');
      const event = 'event';

      const disposableFunction = listenable.once(event, mockCallback);
      listenable.dispatch(event, () => {});

      assert(mockCallback).to.haveBeenCalledWith(null);

      // Dispatch the event again.
      mockCallback.calls.reset();
      listenable.dispatch(event, () => {});
      assert(mockCallback).toNot.haveBeenCalled();
      assert(<boolean> disposableFunction.isDisposed()).to.beTrue();
    });

    it('should return disposable function that stops listening to the event', () => {
      const mockCallback = jasmine.createSpy('Callback');
      const event = 'event';

      const disposableFunction = listenable.once(event, mockCallback);
      disposableFunction.dispose();

      listenable.dispatch(event, () => {});

      assert(mockCallback).toNot.haveBeenCalled();
    });
  });
});
