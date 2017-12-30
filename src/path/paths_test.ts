import { AbsolutePath, PathParser, Paths, RelativePath } from '../path';
import { assert, TestBase } from '../test-base';
TestBase.setup();


describe('path.Paths', () => {
  describe('getDirPath', () => {
    it(`should return the correct directory for absolute paths`, () => {
      const dirPath = Paths.getDirPath(PathParser.parse('/a/b/c')!);

      assert(dirPath).to.beAnInstanceOf(AbsolutePath);
      assert(dirPath.toString()).to.equal('/a/b');
    });

    it(`should return the correct directory for relative paths`, () => {
      const dirPath = Paths.getDirPath(PathParser.parse('a/b/c')!);

      assert(dirPath).to.beAnInstanceOf(RelativePath);
      assert(dirPath.toString()).to.equal('a/b');
    });
  });

  describe('getItemName', () => {
    it(`should return the correct item name`, () => {
      assert(Paths.getItemName(PathParser.parse('a/b/c')!)).to.equal('c');
    });

    it(`should return null if path is root`, () => {
      assert(Paths.getItemName(PathParser.parse('/')!)).to.beNull();
    });
  });

  describe('getRelativePath', () => {
    it(`should return the correct relative path`, () => {
      const src = PathParser.parse('/a/b/c/d')!;
      const dest = PathParser.parse('/a/b/e')!;
      const relative = Paths.getRelativePath(src, dest);

      assert(relative.toString()).to.equal('../../e');
    });
  });

  describe('join', () => {
    it(`should handle absolute path correctly`, () => {
      const joined = Paths.join(
          PathParser.parse('/a/b')!,
          PathParser.parse('c/d')!,
          PathParser.parse('e')!);
      assert(joined).to.beAnInstanceOf(AbsolutePath);
      assert(joined.toString()).to.equal('/a/b/c/d/e');
    });

    it(`should handle relative path correctly`, () => {
      const joined = Paths.join(
          PathParser.parse('a/b')!,
          PathParser.parse('c/d')!,
          PathParser.parse('e')!);
      assert(joined).to.beAnInstanceOf(RelativePath);
      assert(joined.toString()).to.equal('a/b/c/d/e');
    });
  });

  describe('normalize', () => {
    it(`should remove all instances of empty parts for absolute paths`, () => {
      const normalized = Paths.normalize(PathParser.parse('/a//b/c//')!);

      assert(normalized).to.beAnInstanceOf(AbsolutePath);
      assert(normalized.toString()).to.equal('/a/b/c');
    });

    it(`should remove all instances of empty parts for relative paths`, () => {
      const normalized = Paths.normalize(PathParser.parse('a//b/c//')!);

      assert(normalized).to.beAnInstanceOf(RelativePath);
      assert(normalized.toString()).to.equal('a/b/c');
    });

    it(`should remove all instances of '.'`, () => {
      const normalized = Paths.normalize(PathParser.parse('/a/./b/c/./')!);

      assert(normalized).to.beAnInstanceOf(AbsolutePath);
      assert(normalized.toString()).to.equal('/a/b/c');
    });

    it(`should remove all instances of '.' except the beginning one`, () => {
      const normalized = Paths.normalize(PathParser.parse('./a/./b/c/./')!);

      assert(normalized).to.beAnInstanceOf(RelativePath);
      assert(normalized.toString()).to.equal('./a/b/c');
    });

    it(`should process '..' correctly for absolute paths`, () => {
      const normalized = Paths.normalize(PathParser.parse('/a/b/c/../../b/../c/d/..')!);

      assert(normalized).to.beAnInstanceOf(AbsolutePath);
      assert(normalized.toString()).to.equal('/a/c');
    });

    it(`should process '..' correctly for relative paths`, () => {
      const normalized1 = Paths.normalize(PathParser.parse('../../a/../../b/../c/d/..')!);

      assert(normalized1).to.beAnInstanceOf(RelativePath);
      assert(normalized1.toString()).to.equal('../../../c');

      const normalized2 = Paths.normalize(PathParser.parse('a/../../b/../c/d/..')!);

      assert(normalized2).to.beAnInstanceOf(RelativePath);
      assert(normalized2.toString()).to.equal('../c');
    });
  });
});
