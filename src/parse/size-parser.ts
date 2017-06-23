import { Parser } from '../interfaces/parser';
import { Size, UNITS } from '../interfaces/size';
import { FloatParser } from '../parse/float-parser';

export const SizeParser: Parser<Size> = {
  parse(input: string | null): Size | null {
    if (!input) {
      return null;
    }

    const unit = UNITS.find((unit) => input.endsWith(unit));
    const unitLength = unit ? unit.length : 0;
    const size = input.substr(0, input.length - unitLength);
    const parsedSize = FloatParser.parse(size);
    if (parsedSize === null) {
      return null;
    }

    return {
      unit: unit || 'pt',
      value: parsedSize,
    };
  },

  stringify(value: Size | null): string {
    if (!value) {
      return '';
    }
    return `${FloatParser.stringify(value.value)}${value.unit}`;
  },
};
