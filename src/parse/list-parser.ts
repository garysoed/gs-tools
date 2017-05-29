import { ImmutableList } from '../immutable/immutable-list';
import { Parser } from '../interfaces/parser';
import { Log } from '../util/log';

const LOGGER = Log.of('parse.ArrayParser');

export const DELIMITER_: string = ',';

export class ListParserImpl<T> implements Parser<ImmutableList<T | null>> {
  private readonly elementParser_: Parser<T>;

  constructor(elementParser: Parser<T>) {
    this.elementParser_ = elementParser;
  }

  parse(input: string | null): ImmutableList<T | null> | null {
    if (input === null) {
      return null;
    }

    return ImmutableList
        .of(input.split(DELIMITER_))
        .map((element: string) => {
          return this.elementParser_.parse(element);
        });
  }

  stringify(value: ImmutableList<T | null> | null): string {
    if (value === null) {
      return '';
    }

    return value
        .map((element: T | null) => {
          return this.elementParser_.stringify(element);
        })
        .toArray()
        .join(DELIMITER_);
  }
}

export function ListParser<T>(elementParser: Parser<T>): ListParserImpl<T> {
  return new ListParserImpl(elementParser);
}