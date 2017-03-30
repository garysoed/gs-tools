import { Color } from '../interfaces/color';
import { AnyAssert } from '../jasmine/any-assert';


export class ColorAssert extends AnyAssert<Color> {
  private readonly colorValue_: Color;

  constructor(color: Color, reversed: boolean, expect: (actual: any) => jasmine.Matchers) {
    super(color, reversed, expect);
    this.colorValue_ = color;
  }

  /**
   * Checks that the color has the given HSL components.
   * @param hue The expected hue component.
   * @param saturation The expected saturation component.
   * @param lightness The expected lightness component.
   */
  haveHsl(hue: number, saturation: number, lightness: number): void {
    const hslArray = [
      this.colorValue_.getHue(),
      this.colorValue_.getSaturation(),
      this.colorValue_.getLightness(),
    ];

    const matchers = this.reversed_ ? this.expect_(hslArray).not : this.expect_(hslArray);
    matchers.toEqual([hue, saturation, lightness]);
  }

  /**
   * Checks that the color has the given RGB components.
   * @param red The expected red component.
   * @param green The expected green component.
   * @param blue The expected blue component.
   */
  haveRgb(red: number, green: number, blue: number): void {
    const rgbArray = [
      this.colorValue_.getRed(),
      this.colorValue_.getGreen(),
      this.colorValue_.getBlue(),
    ];

    const matchers = this.reversed_ ? this.expect_(rgbArray).not : this.expect_(rgbArray);
    matchers.toEqual([red, green, blue]);
  }
}