import { Converter, Result } from '@nabu';
import { createImmutableList } from '../collection/types/immutable-list';
import { AbsolutePath } from '../path/absolute-path';
import { Path } from '../path/path';

class AbsolutePathParser implements Converter<AbsolutePath, string> {
  convertBackward(value: string): Result<AbsolutePath> {
    if (!value) {
      return {success: false};
    }

    const parts = value.split(Path.SEPARATOR);

    if (parts[0] !== '') {
      // This is not an absolute path.
      return {success: false};
    }

    return {result: new AbsolutePath(createImmutableList(parts.slice(1))()), success: true};
  }

  convertForward(input: AbsolutePath): Result<string> {
    return {result: input.toString(), success: true};
  }
}

export function absolutePathParser(): Converter<AbsolutePath, string> {
  return new AbsolutePathParser();
}
