import { AssertionError } from '../error';

type ValueSpec<T> = {context: {}, id: any, value: T};

let fakeGraph: any = null;
let valueSpecs: ValueSpec<any>[] = [];

function buildGraph(): void {
  if (!fakeGraph) {
    throw AssertionError.generic(`TestGraph#setup hasn't been called yet!`);
  }

  fakeGraph.get.and.callFake((nodeId: any, context: {} | null = null) => {
    const spec = valueSpecs.find((value: ValueSpec<any>) => {
      return value.id === nodeId && value.context === context;
    });

    return Promise.resolve(spec ? spec.value : undefined);
  });
}

export const TestGraph = {
  afterEach(): void {
    fakeGraph = null;
    valueSpecs = [];
  },

  setup(graph: any): void {
    fakeGraph = graph;
    spyOn(graph, 'get');
  },

  set<T>(nodeId: any, context: {}, value: T): void {
    valueSpecs.push({context, id: nodeId, value});
    buildGraph();
  },
};