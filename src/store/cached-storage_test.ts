import { TestBase } from 'gs-testing/export/main';
TestBase.setup();

import { assert } from 'gs-testing/export/main';
import { Fakes, mocks } from 'gs-testing/export/mock';
import { BaseDisposable } from '../dispose/base-disposable';
import { TestDispose } from '../dispose/testing/test-dispose';
import { ImmutableSet } from '../immutable/immutable-set';
import { CachedStorage } from '../store/cached-storage';


describe('store.CachedStorage', () => {
  let mockInnerStorage: any;
  let storage: CachedStorage<string>;

  beforeEach(() => {
    mockInnerStorage = createSpyObject('InnerStorage', [
      'delete',
      'generateId',
      'has',
      'listIds',
      'read',
      'update',
    ]);
    storage = new CachedStorage<string>(mockInnerStorage);
    TestDispose.add(storage);
  });

  describe('delete', () => {
    should('delete the item in the cache and in the inner storage', async () => {
      const mockItem = createSpyObject('Item', ['dispose']);
      Object.setPrototypeOf(mockItem, BaseDisposable.prototype);

      const id = 'id';
      storage['cache_'].set(id, mockItem);

      mockInnerStorage.delete.and.returnValue(Promise.resolve());

      await storage.delete(id);
      assert(mockInnerStorage.delete).to.haveBeenCalledWith(id);
      assert(storage['cache_']).to.haveEntries([]);
      assert(mockItem.dispose).to.haveBeenCalledWith();
    });

    should('not throw error if the deleted item is not disposable', async () => {
      const item = mocks.object('item');
      const id = 'id';
      storage['cache_'].set(id, item);

      mockInnerStorage.delete.and.returnValue(Promise.resolve());

      await storage.delete(id);
      assert(mockInnerStorage.delete).to.haveBeenCalledWith(id);
      assert(storage['cache_']).to.haveEntries([]);
    });

    should('not throw error if the item does not exist', async () => {
      const id = 'id';
      mockInnerStorage.delete.and.returnValue(Promise.resolve());

      await storage.delete('id');
      assert(mockInnerStorage.delete).to.haveBeenCalledWith(id);
      assert(storage['cache_']).to.haveEntries([]);
    });
  });

  describe('disposeInternal', () => {
    should('dispose all entries in the cache if they are disposable', () => {
      const mockDisposableItem1 = createSpyObject('DisposableItem1', ['dispose']);
      const mockDisposableItem2 = createSpyObject('DisposableItem2', ['dispose']);
      Object.setPrototypeOf(mockDisposableItem1, BaseDisposable.prototype);
      Object.setPrototypeOf(mockDisposableItem2, BaseDisposable.prototype);

      const nonDisposableItem = mocks.object('nonDisposableItem');
      const id1 = 'id1';
      const id2 = 'id2';
      const nonDisposableId = 'nonDisposableId';

      storage['cache_'].set(id1, mockDisposableItem1);
      storage['cache_'].set(id2, mockDisposableItem2);
      storage['cache_'].set(nonDisposableId, nonDisposableItem);

      storage.disposeInternal();

      assert(mockDisposableItem1.dispose).to.haveBeenCalledWith();
      assert(mockDisposableItem2.dispose).to.haveBeenCalledWith();
    });
  });

  describe('generateId', () => {
    should('return the correct ID from the inner storage', async () => {
      const newId = 'newId';
      mockInnerStorage.generateId.and.returnValue(Promise.resolve(newId));
      const id = await storage.generateId();
      assert(id).to.equal(newId);
    });
  });

  describe('has', () => {
    should('return the values from the inner storage and cache them', async () => {
      const id = 'id';
      mockInnerStorage.has.and.returnValue(Promise.resolve(true));
      const actualResult = await storage.has(id);
      assert(actualResult).to.beTrue();
      assert(mockInnerStorage.has).to.haveBeenCalledWith(id);
    });
  });

  describe('list', () => {
    should('return all the items and cache them', async () => {
      const id1 = 'id1';
      const id2 = 'id2';
      const id3 = 'id3';
      mockInnerStorage.listIds.and.returnValue(Promise.resolve(ImmutableSet.of([id1, id2, id3])));

      const item1 = mocks.object('item1');
      const item2 = mocks.object('item2');
      const item3 = mocks.object('item3');
      Fakes.build(mockInnerStorage.read)
          .when(id1).resolve(item1)
          .when(id2).resolve(item2)
          .when(id3).resolve(item3);

      const items = await storage.list();
      assert(items).to.haveElements([item1, item2, item3]);
      assert(storage['cache_']).to.haveEntries([
        [id1, item1],
        [id2, item2],
        [id3, item3],
      ]);
    });
  });

  describe('listIds', () => {
    should('return the correct list of IDs', async () => {
      const ids = mocks.object('ids');
      mockInnerStorage.listIds.and.returnValue(Promise.resolve(ids));

      const actualIds = await storage.listIds();
      assert(actualIds).to.equal(ids);
    });
  });

  describe('read', () => {
    should('get the item from the inner storage and cache them', async () => {
      const id = 'id';
      const item = mocks.object('item');
      mockInnerStorage.read.and.returnValue(Promise.resolve(item));
      const actualItem = await storage.read(id);
      assert(actualItem).to.equal(item);
      assert(storage['cache_']).to.haveEntries([[id, item]]);
      assert(mockInnerStorage.read).to.haveBeenCalledWith(id);
    });

    should('not cache the value if null', async () => {
      mockInnerStorage.read.and.returnValue(Promise.resolve(null));
      const actualItem = await storage.read('id');
      assert(actualItem).to.beNull();
      assert(storage['cache_']).to.haveEntries([]);
    });

    should('return the cached value if available', async () => {
      const id = 'id';
      const item = mocks.object('item');
      storage['cache_'].set(id, item);
      const actualItem = await storage.read(id);
      assert(actualItem).to.equal(item);
      assert(mockInnerStorage.read).toNot.haveBeenCalled();
    });
  });

  describe('update', () => {
    should('update the inner storage and the cache with the new value', async () => {
      const id = 'id';
      const oldItem = mocks.object('oldItem');
      storage['cache_'].set(id, oldItem);

      const newItem = mocks.object('newItem');
      mockInnerStorage.update.and.returnValue(Promise.resolve());
      await storage.update(id, newItem);
      assert(storage['cache_']).to.haveEntries([[id, newItem]]);
      assert(mockInnerStorage.update).to.haveBeenCalledWith(id, newItem);
    });
  });
});
