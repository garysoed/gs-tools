import { Parser } from './parser';

/**
 * Attribute parser that handles boolean values.
 */
export const BooleanParser: Parser<boolean> = {
  /**
   * Parses the given input string.
   *
   * @param input The input string.
   * @return The parsed boolean value.
   */
  convertBackward(input: string|null): boolean|null {
    if (!input) {
      return false;
    }

    const lowerCase = input.toLowerCase();
    if (lowerCase === 'true') {
      return true;
    }

    if (lowerCase === 'false') {
      return false;
    }

    return null;
  },

  /**
   * Converts the given value to string.
   *
   * @param value The boolean value to be converted to string.
   * @return The string representation of the boolean value.
   */
  convertForward(value: boolean): string {
    return value ? 'true' : 'false';
  },
};
