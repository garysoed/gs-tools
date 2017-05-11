import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Serializer } from '../data/a-serializable';
import { ImmutableSet } from '../immutable/immutable-set';
import { Fakes } from '../mock/fakes';
import { Mocks } from '../mock/mocks';
import { WebStorage } from '../store/web-storage';


describe('store.WebStorage', () => {
  const PREFIX = 'prefix';
  let mockStorage;
  let storage: WebStorage<any>;

  beforeEach(() => {
    mockStorage = jasmine.createSpyObj('Storage', ['getItem', 'removeItem', 'setItem']);
    storage = new WebStorage<any>(mockStorage, PREFIX);
  });

  describe('getIndexes_', () => {
    it('should initialize the indexes first', () => {
      mockStorage.getItem.and.returnValues(null);

      spyOn(storage, 'updateIndexes_');

      const indexes = storage['getIndexes_']();

      assert(indexes).to.haveElements([]);
      assert(storage['updateIndexes_']).to.haveBeenCalledWith(Matchers.any(ImmutableSet));
      assert(storage['updateIndexes_']['calls'].argsFor(0)[0] as ImmutableSet<any>)
          .to.haveElements([]);
      assert(mockStorage.getItem).to.haveBeenCalledWith(PREFIX);
    });

    it('should not reinitialize the indexes if exists', () => {
      const index = 'index';
      const indexes = [index];
      mockStorage.getItem.and.returnValue(JSON.stringify(indexes));

      spyOn(storage, 'updateIndexes_');

      const indexSet = storage['getIndexes_']();

      assert(indexSet).to.haveElements(indexes);
      assert(storage['updateIndexes_']).toNot.haveBeenCalled();
    });
  });

  describe('getPath_', () => {
    it('should return the correct path', () => {
      const key = 'key';
      assert(storage['getPath_'](key)).to.equal(`${PREFIX}/${key}`);
    });
  });

  describe('updateIndexes_', () => {
    it('should update the storage correctly', () => {
      const indexes = ['index'];
      storage['updateIndexes_'](ImmutableSet.of(indexes));
      assert(mockStorage.setItem).to.haveBeenCalledWith(PREFIX, JSON.stringify(indexes));
    });
  });

  describe('delete', () => {
    it('should remove the correct object', async () => {
      const id = 'id';
      const path = 'path';
      spyOn(storage, 'getPath_').and.returnValue(path);
      spyOn(storage, 'getIndexes_').and.returnValue(ImmutableSet.of([id]));
      spyOn(storage, 'updateIndexes_');

      await storage.delete(id);

      assert(mockStorage.removeItem).to.haveBeenCalledWith(path);
      assert(storage['getPath_']).to.haveBeenCalledWith(id);
      assert(storage['updateIndexes_']).to.haveBeenCalledWith(Matchers.any(ImmutableSet));
      assert(storage['updateIndexes_']['calls'].argsFor(0)[0] as ImmutableSet<any>)
          .to.haveElements([]);
    });

    it('should reject if the ID does not exist', async () => {
      const id = 'id';
      const path = 'path';
      spyOn(storage, 'getPath_').and.returnValue(path);
      spyOn(storage, 'getIndexes_').and.returnValue(new Set());
      spyOn(storage, 'updateIndexes_');

      await assert(storage.delete(id)).to.rejectWithError(/does not exist/);
      assert(mockStorage.removeItem).toNot.haveBeenCalled();
      assert(storage['updateIndexes_']).toNot.haveBeenCalled();
    });
  });

  describe('has', () => {
    it('should resolve with true if the object is in the storage', async () => {
      const id = 'id';
      spyOn(storage, 'getIndexes_').and.returnValue(new Set([id]));

      const result = await storage.has(id);
      assert(result).to.beTrue();
    });

    it('should resolve with false if the object is in the storage', async () => {
      const id = 'id';

      spyOn(storage, 'getIndexes_').and.returnValue(new Set());

      const result = await storage.has(id);
      assert(result).to.beFalse();
    });
  });

  describe('list', () => {
    it('should return the correct indexes', async () => {
      const id1 = 'id1';
      const id2 = 'id2';
      const item1 = Mocks.object('item1');
      const item2 = Mocks.object('item2');
      spyOn(storage, 'listIds').and.returnValue(Promise.resolve(ImmutableSet.of([id1, id2])));
      Fakes.build(spyOn(storage, 'read'))
          .when(id1).resolve(item1)
          .when(id2).resolve(item2);

      const values = await storage.list();
      assert(values).to.haveElements([item1, item2]);
      assert(storage.read).to.haveBeenCalledWith(id1);
      assert(storage.read).to.haveBeenCalledWith(id2);
    });

    it('should filter out null items', async () => {
      const id = 'id';
      spyOn(storage, 'listIds').and.returnValue(Promise.resolve(ImmutableSet.of([id])));
      spyOn(storage, 'read').and.returnValue(Promise.resolve(null));
      const values = await storage.list();
      assert(values).to.haveElements([]);
    });
  });

  describe('listIds', () => {
    it('should return the indexes', async () => {
      const indexes = Mocks.object('indexes');
      spyOn(storage, 'getIndexes_').and.returnValue(indexes);
      const ids = await storage.listIds();
      assert(ids).to.equal(indexes);
    });
  });

  describe('read', () => {
    it('should resolve with the object', async () => {
      const id = 'id';
      const path = 'path';
      const stringValue = 'stringValue';
      const object = Mocks.object('object');
      const json = Mocks.object('json');

      mockStorage.getItem.and.returnValue(stringValue);
      spyOn(storage, 'getPath_').and.returnValue(path);
      spyOn(JSON, 'parse').and.returnValue(json);
      spyOn(Serializer, 'fromJSON').and.returnValue(object);

      const result = await storage.read(id);
      assert(result).to.equal(object);
      assert(Serializer.fromJSON).to.haveBeenCalledWith(json);
      assert(JSON.parse).to.haveBeenCalledWith(stringValue);
      assert(mockStorage.getItem).to.haveBeenCalledWith(path);
      assert(storage['getPath_']).to.haveBeenCalledWith(id);
    });

    it('should resolve with null if the object does not exist', async () => {
      mockStorage.getItem.and.returnValue(null);
      spyOn(storage, 'getPath_').and.returnValue('path');

      const result = await storage.read('id');
      assert(result).to.beNull();
    });

    it('should reject if there was an error', async () => {
      const errorMsg = 'errorMsg';
      mockStorage.getItem.and.throwError(errorMsg);
      spyOn(storage, 'getPath_').and.returnValue('path');

      await assert(storage.read('id')).to.rejectWithError(new RegExp(errorMsg));
    });
  });

  describe('reserve', () => {
    it('should reserve a new ID correctly', async () => {
      const initialId = 'initialId';
      const id1 = 'id1';
      const id2 = 'id2';
      const id3 = 'id3';
      spyOn(storage['idGenerator_'], 'generate').and.returnValue(id3);
      spyOn(storage, 'getIndexes_').and.returnValue(new Set([initialId, id1, id2]));

      const id = await storage.generateId();
      assert(id).to.equal(id3);
      assert(storage['idGenerator_'].generate).to.haveBeenCalledWith([initialId, id1, id2]);
    });
  });

  describe('update', () => {
    it('should store the correct object in the storage', async () => {
      const id = 'id';
      const path = 'path';
      const object = Mocks.object('object');
      const stringValue = 'stringValue';
      const json = Mocks.object('json');
      const oldId = 'oldId';
      const indexes = ImmutableSet.of([oldId]);

      spyOn(storage, 'getIndexes_').and.returnValue(indexes);
      spyOn(storage, 'updateIndexes_');
      spyOn(storage, 'getPath_').and.returnValue(path);
      spyOn(Serializer, 'toJSON').and.returnValue(json);
      spyOn(JSON, 'stringify').and.returnValue(stringValue);

      await storage.update(id, object);
      assert(mockStorage.setItem).to.haveBeenCalledWith(path, stringValue);
      assert(JSON.stringify).to.haveBeenCalledWith(json);
      assert(Serializer.toJSON).to.haveBeenCalledWith(object);
      assert(storage['updateIndexes_']).to.haveBeenCalledWith(Matchers.any(ImmutableSet));
      assert(storage['updateIndexes_']['calls'].argsFor(0)[0] as ImmutableSet<string>)
          .to.haveElements([oldId, id]);
    });

    it('should reject if there was an error', async () => {
      const errorMsg = 'errorMsg';

      spyOn(Serializer, 'toJSON').and.throwError(errorMsg);
      spyOn(storage, 'getIndexes_').and.returnValue(new Set());

      await assert(storage.update('id', Mocks.object('object'))).to
          .rejectWithError(new RegExp(errorMsg));
    });
  });
});
