import { ImmutableList } from '../immutable/immutable-list';
import { ImmutableSet } from '../immutable/immutable-set';

export interface Searcher<D> {
  index(data: Promise<ImmutableSet<D>>): void;

  search(token: string): Promise<ImmutableList<D>>;
}