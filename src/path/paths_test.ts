// tslint:disable:no-non-null-assertion
import { assert, should } from 'gs-testing/export/main';
import { AbsolutePath, PathParser, Paths, RelativePath } from '../path';

describe('path.Paths', () => {
  describe('absolutePath', () => {
    should(`return the correct path`, () => {
      const path = Paths.absolutePath('/a/b/c');
      assert(path).to.beAnInstanceOf(AbsolutePath);
      assert(path.toString()).to.equal('/a/b/c');
    });

    should(`throw error if the path is not an absolute path`, () => {
      assert(() => {
        Paths.absolutePath('a/b/c');
      }).to.throwErrorWithMessage(/valid absolute path/);
    });
  });

  describe('getDirPath', () => {
    should(`return the correct directory for absolute paths`, () => {
      // tslint:disable-next-line:no-non-null-assertion
      const dirPath = Paths.getDirPath(PathParser.convertBackward('/a/b/c')!);

      assert(dirPath).to.beAnInstanceOf(AbsolutePath);
      assert(dirPath.toString()).to.equal('/a/b');
    });

    should(`return the correct directory for relative paths`, () => {
      // tslint:disable-next-line:no-non-null-assertion
      const dirPath = Paths.getDirPath(PathParser.convertBackward('a/b/c')!);

      assert(dirPath).to.beAnInstanceOf(RelativePath);
      assert(dirPath).to.equal('a/b');
    });
  });

  describe('getFilenameParts', () => {
    should(`handle simple file names`, () => {
      assert(Paths.getFilenameParts('test.ext')).to.equal({extension: 'ext', name: 'test'});
    });

    should(`handle file names with .`, () => {
      assert(Paths.getFilenameParts('file.test.js')).to.equal({extension: 'js', name: 'file.test'});
    });

    should(`handle file names with no extensions`, () => {
      assert(Paths.getFilenameParts('BUILD')).to.equal({extension: '', name: 'BUILD'});
    });
  });

  describe('getItemName', () => {
    should(`return the correct item name`, () => {
      // tslint:disable-next-line:no-non-null-assertion
      assert(Paths.getItemName(PathParser.convertBackward('a/b/c')!)).to.equal('c');
    });

    should(`return null if path is root`, () => {
      // tslint:disable-next-line:no-non-null-assertion
      assert(Paths.getItemName(PathParser.convertBackward('/')!)).to.beNull();
    });
  });

  describe('getRelativePath', () => {
    should(`return the correct relative path`, () => {
      // tslint:disable-next-line:no-non-null-assertion
      const src = PathParser.convertBackward('/a/b/c/d')!;
      // tslint:disable-next-line:no-non-null-assertion
      const dest = PathParser.convertBackward('/a/b/e')!;
      const relative = Paths.getRelativePath(src, dest);

      assert(relative).to.equal('../../e');
    });
  });

  describe('join', () => {
    should(`handle absolute path correctly`, () => {
      const joined = Paths.join(
          PathParser.convertBackward('/a/b')!,
          PathParser.convertBackward('c/d')!,
          PathParser.convertBackward('e')!);
      assert(joined).to.beAnInstanceOf(AbsolutePath);
      assert(joined).to.equal('/a/b/c/d/e');
    });

    should(`handle relative path correctly`, () => {
      const joined = Paths.join(
          PathParser.convertBackward('a/b')!,
          PathParser.convertBackward('c/d')!,
          PathParser.convertBackward('e')!);
      assert(joined).to.beAnInstanceOf(RelativePath);
      assert(joined).to.equal('a/b/c/d/e');
    });
  });

  describe('normalize', () => {
    should(`remove all instances of empty parts for absolute paths`, () => {
      const normalized = Paths.normalize(PathParser.convertBackward('/a//b/c//')!);

      assert(normalized).to.beAnInstanceOf(AbsolutePath);
      assert(normalized).to.equal('/a/b/c');
    });

    should(`remove all instances of empty parts for relative paths`, () => {
      const normalized = Paths.normalize(PathParser.convertBackward('a//b/c//')!);

      assert(normalized).to.beAnInstanceOf(RelativePath);
      assert(normalized).to.equal('a/b/c');
    });

    should(`remove all instances of '.'`, () => {
      const normalized = Paths.normalize(PathParser.convertBackward('/a/./b/c/./')!);

      assert(normalized).to.beAnInstanceOf(AbsolutePath);
      assert(normalized).to.equal('/a/b/c');
    });

    should(`remove all instances of '.' except the beginning one`, () => {
      const normalized = Paths.normalize(PathParser.convertBackward('./a/./b/c/./')!);

      assert(normalized).to.beAnInstanceOf(RelativePath);
      assert(normalized).to.equal('./a/b/c');
    });

    should(`process '..' correctly for absolute paths`, () => {
      const normalized = Paths.normalize(PathParser.convertBackward('/a/b/c/../../b/../c/d/..')!);

      assert(normalized).to.beAnInstanceOf(AbsolutePath);
      assert(normalized).to.equal('/a/c');
    });

    should(`process '..' correctly for relative paths`, () => {
      const normalized1 = Paths.normalize(PathParser.convertBackward('../../a/../../b/../c/d/..')!);

      assert(normalized1).to.beAnInstanceOf(RelativePath);
      assert(normalized1).to.equal('c');

      const normalized2 = Paths.normalize(PathParser.convertBackward('a/../../b/../c/d/..')!);

      assert(normalized2).to.beAnInstanceOf(RelativePath);
      assert(normalized2).to.equal('../c');
    });
  });

  describe('relativePath', () => {
    should(`return the correct path`, () => {
      const path = Paths.relativePath('a/b/c');
      assert(path).to.beAnInstanceOf(RelativePath);
      assert(path).to.equal('a/b/c');
    });

    should(`throw error if the path is not an relative path`, () => {
      assert(() => {
        Paths.relativePath('/a/b/c');
      }).to.throwErrorWithMessage(/valid relative path/);
    });
  });

  describe('setFilenameExt', () => {
    should(`handle simple file names`, () => {
      assert(Paths.setFilenameExt('test.ext', 'ext2')).to.equal('test.ext2');
      assert(Paths.setFilenameExt('test.ext', '')).to.equal('test');
    });

    should(`handle file names with .`, () => {
      assert(Paths.setFilenameExt('file.test.js', 'ext2')).to.equal('file.test.ext2');
      assert(Paths.setFilenameExt('file.test.js', '')).to.equal('file.test');
    });

    should(`handle file names with no extensions`, () => {
      assert(Paths.setFilenameExt('BUILD', 'ext2')).to.equal('BUILD.ext2');
      assert(Paths.setFilenameExt('BUILD', '')).to.equal('BUILD');
    });
  });
});
