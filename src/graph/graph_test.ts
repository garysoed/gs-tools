import { assert, Fakes, Matchers, Mocks, TestBase } from '../test-base';
TestBase.setup();

import { NumberType } from '../check';
import { BaseDisposable } from '../dispose';
import { GraphTime, instanceId, staticId } from '../graph';
import { GLOBALS } from '../graph/g-node';
import { GraphImpl } from '../graph/graph';
import { InnerNode } from '../graph/inner-node';
import { InputNode } from '../graph/input-node';
import { ImmutableList, ImmutableSet } from '../immutable';
import { TestDispose } from '../testing';
import { Log } from '../util';


describe('graph.Graph', () => {
  let graph: GraphImpl;

  beforeEach(() => {
    graph = new GraphImpl(Log.of('test'));
    TestDispose.add(graph);
  });

  describe('createProvider', () => {
    it(`should create the correct provider for staticId`, () => {
      const $ = staticId('id', NumberType);
      const value = 123;
      const promise = Mocks.object('promise');
      spyOn(graph, 'set_').and.returnValue(promise);

      const provider = graph.createProvider($, value);
      assert(graph['nodes_'].get($)!.execute(null, [], graph.getTimestamp())).to.equal(value);

      const newValue = 456;
      assert(provider(newValue)).to.equal(promise);
      assert(graph['set_']).to.haveBeenCalledWith($, GLOBALS, newValue);
    });

    it(`should create the correct provider for instanceId`, () => {
      const $ = instanceId('id', NumberType);
      const value = 123;
      const promise = Mocks.object('promise');
      spyOn(graph, 'set_').and.returnValue(promise);

      const context = Mocks.object('context');

      const provider = graph.createProvider($, value, context);
      assert(graph['nodes_'].get($)!.execute(context, [], graph.getTimestamp())).to.equal(value);

      const newValue = 456;
      assert(provider(newValue)).to.equal(promise);
      assert(graph['set_']).to.haveBeenCalledWith($, context, newValue);
    });

    it(`should throw error if the node is already registered`, () => {
      const $ = staticId('id', NumberType);
      const value = 123;
      graph['nodes_'].set($, Mocks.object('node'));

      assert(() => {
        graph.createProvider($, value);
      }).to.throwError(/already registered/);
    });
  });

  describe('dependsOn_', () => {
    it(`should return true if the nodeId depends on the given nodeId`, () => {
      const node1 = Mocks.object('node1');
      const node2 = Mocks.object('node2');
      spyOn(graph, 'getTransitiveDependencies_').and.returnValue(ImmutableSet.of([node2]));

      assert(graph['dependsOn_'](node1, node2)).to.beTrue();
    });

    it(`should return false if the first nodeId doesn't depend on the second one`, () => {
      const node1 = Mocks.object('node1');
      const node2 = Mocks.object('node2');
      spyOn(graph, 'getTransitiveDependencies_').and.returnValue(ImmutableSet.of([]));

      assert(graph['dependsOn_'](node1, node2)).to.beFalse();
    });
  });

  describe('get', () => {
    it(`should return the correct value`, async () => {
      const $ = {
        param1: staticId('param1', NumberType),
        param2: staticId('param2', NumberType),
        test: staticId('test', NumberType),
      };
      const value = 123;

      const param1 = 456;
      const param2 = 789;
      const origGet = graph.get;
      Fakes.build(spyOn(graph, 'get'))
          .when($.param1).resolve(param1)
          .when($.param2).resolve(param2)
          .else().call(origGet.bind(graph));
      const mockNode = jasmine.createSpyObj(
        'Node',
        ['execute', 'getLatestCacheValue', 'getParameterIds']);
      mockNode.execute.and.returnValue(Promise.resolve(value));
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([$.param1, $.param2]));
      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($.test, mockNode);

      spyOn(GLOBALS, 'addDisposable').and
          .callFake((disposable: any) => TestDispose.add(disposable));

      const timestamp = Mocks.object('timestamp');
      const idealExecutionTime = Mocks.object('idealExecutionTime');

      spyOn(graph, 'dispatch');
      spyOn(graph, 'getIdealExecutionTime_').and.returnValue(idealExecutionTime);

      await assert(graph.get($.test, timestamp)).to.resolveWith(value);
      assert(mockNode.execute).to.haveBeenCalledWith(GLOBALS, [param1, param2], idealExecutionTime);
      assert(graph.dispatch).to.haveBeenCalledWith({context: GLOBALS, id: $.test, type: 'change'});
      assert(graph.get).to.haveBeenCalledWith($.param1, idealExecutionTime);
      assert(graph.get).to.haveBeenCalledWith($.param2, idealExecutionTime);
      assert(mockNode.getLatestCacheValue).to.haveBeenCalledWith(GLOBALS, idealExecutionTime);
      assert(graph['getIdealExecutionTime_']).to.haveBeenCalledWith($.test, timestamp);
    });

    it(`should handle instance IDs`, async () => {
      class TestClass extends BaseDisposable {
        constructor() {
          super();
        }
      }

      const instance = new TestClass();
      TestDispose.add(instance);

      const $ = {
        param1: instanceId('param1', NumberType),
        param2: instanceId('param2', NumberType),
        test: instanceId('test', NumberType),
      };
      const value = 123;

      const param1 = 456;
      const param2 = 789;
      const origGet = graph.get;
      Fakes.build(spyOn(graph, 'get'))
          .when($.param1).resolve(param1)
          .when($.param2).resolve(param2)
          .else().call(origGet.bind(graph));
      const mockNode = jasmine.createSpyObj(
          'Node',
          ['execute', 'getLatestCacheValue', 'getParameterIds']);
      mockNode.execute.and.returnValue(Promise.resolve(value));
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([$.param1, $.param2]));

      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($.test, mockNode);

      const timestamp = Mocks.object('timestamp');
      const idealExecutionTime = Mocks.object('idealExecutionTime');

      const graphOnSpy = spyOn(graph, 'on')
          .and.returnValue(jasmine.createSpyObj('disposable', ['dispose']));
      spyOn(graph, 'onReady_');
      spyOn(graph, 'getIdealExecutionTime_').and.returnValue(idealExecutionTime);

      await assert(graph.get($.test, timestamp, instance)).to.resolveWith(value);
      assert(mockNode.execute).to
          .haveBeenCalledWith(instance, [param1, param2], idealExecutionTime);
      assert(graph['monitoredNodes_'].get(instance)!).to.haveElements([$.test]);
      assert(graph.on).to.haveBeenCalledWith('ready', Matchers.anyFunction(), graph);

      const event = Mocks.object('event');
      graphOnSpy.calls.argsFor(0)[1](event);
      assert(graph['onReady_']).to.haveBeenCalledWith($.test, instance, event);

      assert(graph.get).to.haveBeenCalledWith($.param1, idealExecutionTime, instance);
      assert(graph.get).to.haveBeenCalledWith($.param2, idealExecutionTime, instance);
      assert(mockNode.getLatestCacheValue).to.haveBeenCalledWith(instance, idealExecutionTime);
      assert(graph['getIdealExecutionTime_']).to.haveBeenCalledWith($.test, timestamp, instance);
    });

    it(`should reject if the value has the wrong type`, async () => {
      const $ = {
        param: staticId('param', NumberType),
        test: staticId('test', NumberType),
      };
      const value = 'abc';

      const param = 456;
      const origGet = graph.get;
      Fakes.build(spyOn(graph, 'get'))
          .when($.param).resolve(param)
          .else().call(origGet.bind(graph));

      const timestamp = Mocks.object('timestamp');
      const mockNode = jasmine.createSpyObj(
          'Node',
          ['execute', 'getLatestCacheValue', 'getParameterIds']);
      mockNode.execute.and.returnValue(Promise.resolve(value));
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([$.param]));
      graph['nodes_'].set($.test, mockNode);

      const idealExecutionTime = Mocks.object('idealExecutionTime');
      spyOn(graph, 'getIdealExecutionTime_').and.returnValue(idealExecutionTime);

      await assert(graph.get($.test, timestamp)).to.rejectWithError(/incorrect type/);
      assert(mockNode.execute).to.haveBeenCalledWith(GLOBALS, [param], idealExecutionTime);
      assert(graph['getIdealExecutionTime_']).to.haveBeenCalledWith($.test, timestamp);
    });

    it(`should reject if the node corresponding to the ID cannot be found`, async () => {
      const $ = {
        test: staticId('test', NumberType),
      };
      const timestamp = Mocks.object('timestamp');

      await assert(graph.get($.test, timestamp)).to.rejectWithError(/cannot be found/);
    });

    it(`should not monitor if already monitored`, async () => {
      class TestClass extends BaseDisposable {
        constructor() {
          super();
        }
      }

      const instance = new TestClass();
      TestDispose.add(instance);

      const $test = instanceId('test', NumberType);
      const value = 123;

      const mockNode = jasmine.createSpyObj(
          'Node',
          ['execute', 'getLatestCacheValue', 'getParameterIds']);
      mockNode.execute.and.returnValue(value);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([]));
      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($test, mockNode);

      spyOn(graph, 'on');
      spyOn(graph, 'onReady_');
      spyOn(graph, 'isMonitored_').and.returnValue(true);
      const timestamp = Mocks.object('timestamp');

      await assert(graph.get($test, timestamp, instance)).to.resolveWith(value);
      assert(graph.on).toNot.haveBeenCalled();
      assert(graph['isMonitored_']).to.haveBeenCalledWith(instance, $test);
    });

    it(`should not monitor if node is not InnerNode`, async () => {
      class TestClass extends BaseDisposable {
        constructor() {
          super();
        }
      }

      const instance = new TestClass();
      TestDispose.add(instance);

      const $test = instanceId('test', NumberType);
      const value = 123;

      const mockNode = jasmine.createSpyObj(
          'Node',
          ['execute', 'getLatestCacheValue', 'getParameterIds']);
      mockNode.execute.and.returnValue(value);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([]));
      graph['nodes_'].set($test, mockNode);

      spyOn(graph, 'on');
      spyOn(graph, 'onReady_');
      const timestamp = Mocks.object('timestamp');

      await assert(graph.get($test, timestamp, instance)).to.resolveWith(value);
      assert(graph.on).toNot.haveBeenCalled();
    });

    it(`should not dispatch any events if the new value is the same as the cached one`,
        async () => {
      const $ = {
        test: staticId('test', NumberType),
      };
      const value = 123;

      const mockNode = jasmine.createSpyObj(
          'Node',
          ['execute', 'getLatestCacheValue', 'getParameterIds']);
      mockNode.execute.and.returnValue(value);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([]));
      mockNode.getLatestCacheValue.and.returnValue([Mocks.object('cacheTimestamp'), value]);
      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($.test, mockNode);

      spyOn(graph, 'isMonitored_').and.returnValue(true);
      spyOn(graph, 'dispatch');

      const idealExecutionTime = Mocks.object('idealExecutionTime');
      spyOn(graph, 'getIdealExecutionTime_').and.returnValue(idealExecutionTime);
      const timestamp = Mocks.object('timestamp');

      await assert(graph.get($.test, timestamp)).to.resolveWith(value);
      assert(mockNode.execute).to.haveBeenCalledWith(GLOBALS, [], idealExecutionTime);
      assert(graph.dispatch).toNot.haveBeenCalled();
    });
  });

  describe('getIdealExecutionTime_', () => {
    it(`should return the maximum ideal execution time of the parameters`, () => {
      const $ = {
        a: staticId('a', NumberType),
        ab: staticId('ab', NumberType),
        abc: instanceId('abc', NumberType),
        b: staticId('b', NumberType),
        c: instanceId('c', NumberType),
      };
      const instance = new BaseDisposable();
      TestDispose.add(instance);

      let timestamp = GraphTime.new();
      timestamp = timestamp.increment();
      const nodeA = new InputNode();
      nodeA.set(null, timestamp, 1);

      timestamp = timestamp.increment();
      const nodeB = new InputNode();
      nodeB.set(null, timestamp, 2);

      timestamp = timestamp.increment();
      const nodeC = new InputNode();
      nodeC.set(instance, timestamp, 3);

      timestamp = timestamp.increment();

      const nodeAB = new InnerNode(() => 1, ImmutableList.of([$.a, $.b]));
      const nodeABC = new InnerNode(() => 2, ImmutableList.of([$.ab, $.c]));
      graph['nodes_'].set($.a, nodeA);
      graph['nodes_'].set($.b, nodeB);
      graph['nodes_'].set($.c, nodeC);
      graph['nodes_'].set($.ab, nodeAB);
      graph['nodes_'].set($.abc, nodeABC);

      assert(graph['getIdealExecutionTime_']($.a, timestamp)['timestamp_']).to.equal(1);
      assert(graph['getIdealExecutionTime_']($.b, timestamp)['timestamp_']).to.equal(2);
      assert(graph['getIdealExecutionTime_']($.c, timestamp, instance)['timestamp_']).to.equal(3);
      assert(graph['getIdealExecutionTime_']($.ab, timestamp)['timestamp_']).to.equal(2);
      assert(graph['getIdealExecutionTime_']($.abc, timestamp, instance)['timestamp_']).to.equal(3);
    });
  });

  describe('isMonitored_', () => {
    it(`should return true if the ID is monitored`, () => {
      const context = Mocks.object('context');
      const nodeId = instanceId('test', NumberType);
      graph['monitoredNodes_'].set(context, ImmutableSet.of([nodeId]));

      assert(graph['isMonitored_'](context, nodeId)).to.beTrue();
    });

    it(`should return false if the ID is not monitored for the context`, () => {
      const context = Mocks.object('context');
      const nodeId = instanceId('test', NumberType);
      graph['monitoredNodes_'].set(context, ImmutableSet.of([instanceId('other', NumberType)]));

      assert(graph['isMonitored_'](context, nodeId)).to.beFalse();
    });

    it(`should return false if the context is not monitored`, () => {
      const context = Mocks.object('context');
      const nodeId = instanceId('test', NumberType);

      assert(graph['isMonitored_'](context, nodeId)).to.beFalse();
    });
  });

  describe('onReady_', () => {
    it(`should refresh the node`, () => {
      const nodeId = instanceId('test', NumberType);
      const paramId = staticId('param', NumberType);

      const context = Mocks.object('context');
      const graphEvent = Mocks.object('graphEvent');
      graphEvent.id = paramId;

      spyOn(graph, 'refresh');
      spyOn(graph, 'dependsOn_').and.returnValue(true);

      graph['onReady_'](nodeId, context, graphEvent);
      assert(graph.refresh).to.haveBeenCalledWith(nodeId, context);
      assert(graph['dependsOn_']).to.haveBeenCalledWith(nodeId, paramId);
    });

    it(`should refresh the node for staticId`, () => {
      const nodeId = staticId('test', NumberType);
      const paramId = staticId('param', NumberType);

      const graphEvent = Mocks.object('graphEvent');
      graphEvent.id = paramId;

      spyOn(graph, 'refresh');
      spyOn(graph, 'dependsOn_').and.returnValue(true);

      graph['onReady_'](nodeId, GLOBALS, graphEvent);
      assert(graph.refresh).to.haveBeenCalledWith(nodeId);
      assert(graph['dependsOn_']).to.haveBeenCalledWith(nodeId, paramId);
    });

    it(`should do nothing if the changed ID is not a dependency`, () => {
      const nodeId = instanceId('test', NumberType);
      const paramId = staticId('param', NumberType);

      const context = Mocks.object('context');
      const graphEvent = Mocks.object('graphEvent');
      graphEvent.id = paramId;

      spyOn(graph, 'refresh');
      spyOn(graph, 'dependsOn_').and.returnValue(false);

      graph['onReady_'](nodeId, context, graphEvent);
      assert(graph.refresh).toNot.haveBeenCalled();
      assert(graph['dependsOn_']).to.haveBeenCalledWith(nodeId, paramId);
    });
  });

  describe('processSetQueue_', () => {
    it(`should process all the items in the queue and clear it`, () => {
      const mockSetFn1 = jasmine.createSpy('SetFn1');
      const mockSetFn2 = jasmine.createSpy('SetFn2');
      graph['setQueue_'].push(mockSetFn1, mockSetFn2);

      graph['processSetQueue_']();
      assert(graph['setQueue_']).to.equal([]);
      assert(mockSetFn1).to.haveBeenCalledWith();
      assert(mockSetFn2).to.haveBeenCalledWith();
    });
  });

  describe('registerProvider', () => {
    it(`should register the correct node`, () => {
      const $ = staticId('test', NumberType);
      const value = 123;
      const mockProvider = jasmine.createSpy('Provider');
      mockProvider.and.returnValue(value);

      graph.registerProvider($, mockProvider);
      const node = graph['nodes_'].get($)! as InnerNode<number>;
      assert(node.execute(null, [], graph.getTimestamp())).to.equal(value);
      assert(mockProvider).to.haveBeenCalledWith();
    });

    it(`should do nothing if reregistered node is the same as registered one`, () => {
      const $ = staticId('test', NumberType);
      const param1 = Mocks.object('param1');
      const param2 = Mocks.object('param2');
      const provider = Mocks.object('provider');
      const mockNode = jasmine.createSpyObj('Node', ['getParameterIds', 'getProvider']);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([param1, param2]));
      mockNode.getProvider.and.returnValue(provider);
      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($, mockNode);

      spyOn(graph['nodes_'], 'set').and.callThrough();

      graph.registerProvider($, provider, param1, param2);
      assert(graph['nodes_'].set).toNot.haveBeenCalled();
    });

    it(`should throw error if reregistered node params has a different element`, () => {
      const $ = staticId('test', NumberType);
      const param1 = Mocks.object('param1');
      const param2 = Mocks.object('param2');
      const param3 = Mocks.object('param3');
      const provider = Mocks.object('provider');
      const mockNode = jasmine.createSpyObj('Node', ['getParameterIds', 'getProvider']);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([param1, param2]));
      mockNode.getProvider.and.returnValue(provider);
      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($, mockNode);

      assert(() => {
        graph.registerProvider($, provider, param1, param3);
      }).to.throwError(/reregistered node parameter/);
    });

    it(`should throw error if reregistered node params has different lengths`, () => {
      const $ = staticId('test', NumberType);
      const param1 = Mocks.object('param1');
      const param2 = Mocks.object('param2');
      const provider = Mocks.object('provider');
      const mockNode = jasmine.createSpyObj('Node', ['getParameterIds', 'getProvider']);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([param1]));
      mockNode.getProvider.and.returnValue(provider);
      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($, mockNode);

      assert(() => {
        graph.registerProvider($, provider, param1, param2);
      }).to.throwError(/reregistered node parameter/);
    });

    it(`should throw error if registered node has different provider`, () => {
      const $ = staticId('test', NumberType);
      const provider1 = () => 1;
      const provider2 = () => 2;
      const mockNode = jasmine.createSpyObj('Node', ['getParameterIds', 'getProvider']);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([]));
      mockNode.getProvider.and.returnValue(provider1);
      Object.setPrototypeOf(mockNode, InnerNode.prototype);
      graph['nodes_'].set($, mockNode);

      assert(() => {
        graph.registerProvider($, provider2);
      }).to.throwError(/reregistered node provider/);
    });

    it(`should throw error if registered node is not an InnerNode`, () => {
      const $ = staticId('test', NumberType);
      const provider = Mocks.object('provider');
      const mockNode = jasmine.createSpyObj('Node', ['getParameterIds', 'getProvider']);
      mockNode.getParameterIds.and.returnValue(ImmutableList.of([]));
      mockNode.getProvider.and.returnValue(provider);
      graph['nodes_'].set($, mockNode);

      assert(() => {
        graph.registerProvider($, provider);
      }).to.throwError(/already registered/);
    });
  });

  describe('set_', () => {
    it(`should return promise that is resolved after the set functions are called`, async () => {
      const $ = staticId('test', NumberType);
      const value = 123;
      const mockNode = jasmine.createSpyObj('Node', ['set']);
      Object.setPrototypeOf(mockNode, InputNode.prototype);
      graph['nodes_'].set($, mockNode);

      spyOn(graph, 'refresh');

      const context = Mocks.object('context');

      await graph['set_']($, context, value);
      assert(mockNode.set).to.haveBeenCalledWith(context, Matchers.any(GraphTime), value);
      assert(mockNode.set.calls.argsFor(0)[1]['timestamp_']).to.equal(1);
      assert(graph.refresh).to.haveBeenCalledWith($);
      assert(graph.getTimestamp()['timestamp_']).to.equal(1);
    });

    it(`should throw error if the corresponding node is not an InputNode`, () => {
      const $ = staticId('test', NumberType);
      const mockNode = jasmine.createSpyObj('Node', ['set']);
      graph['nodes_'].set($, mockNode);

      const context = Mocks.object('context');

      assert(() => {
        graph['set_']($, context, 123);
      }).to.throwError(/not an instance of InputNode/);
    });
  });
});
