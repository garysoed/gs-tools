import { InstanceofType } from '../check';
import { Searcher } from '../datamodel';
import { Graph, staticId } from '../graph';
import { StaticId } from '../graph/static-id';
import { ImmutableList, ImmutableSet } from '../immutable';
import { Storage as GsStorage } from '../store';

export interface DataGraph<D> {
  generateId(): Promise<string>;

  get(id: string): Promise<D | null>;

  list(): Promise<ImmutableSet<D>>;

  search(token: string): Promise<ImmutableList<D>>;

  set(id: string, data: D): Promise<void>;
}

class DataGraphImpl<D> implements DataGraph<D> {
  constructor(
      protected readonly id_: StaticId<DataGraph<D>>,
      protected readonly searcher_: Searcher<D>,
      protected readonly storage_: GsStorage<D>) {
  }

  generateId(): Promise<string> {
    return this.storage_.generateId();
  }

  get(id: string): Promise<D | null> {
    return this.storage_.read(id);
  }

  list(): Promise<ImmutableSet<D>> {
    return this.storage_.list();
  }

  search(token: string): Promise<ImmutableList<D>> {
    return this.searcher_.search(token);
  }

  async set(id: string, data: D): Promise<void> {
    const existingItem = await this.storage_.read(id);
    if (existingItem === data) {
      return;
    }
    await this.storage_.update(id, data);
    this.searcher_.index(this.list());

    Graph.refresh(this.id_);
  }
}

export function registerDataGraph<D>(
    searcher: Searcher<D>, storage: GsStorage<D>): StaticId<DataGraph<D>> {
  const id = staticId(name, InstanceofType(DataGraphImpl));

  const graph = new DataGraphImpl(id, searcher, storage);
  Graph.registerProvider(id, () => graph);
  return id;
}