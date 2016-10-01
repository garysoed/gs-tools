import {ArgMetaData} from './arg-meta-data';
import {GraphNode} from './graph-node';
import {Validate} from '../valid/validate';


/**
 * Used for building [GraphNode]s.
 */
export class GraphNodeBuilder<T> {
  argMetaData: ArgMetaData[];
  fn: (((...args: any[]) => T)|null);

  constructor() {
    this.argMetaData = [];
    this.fn = null;
  }

  /**
   * Builds the graph node.
   *
   * @return The graph node.
   */
  build(): GraphNode<T> {
    Validate.any(this.fn).to.exist().assertValid();
    return GraphNode.newInstance(this.fn!, this.argMetaData);
  }
}