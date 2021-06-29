import * as Joi from 'joi';

declare module 'joi' {
  interface CalendardateSchema extends AnySchema {
    /** Specifies format of parsed date string or callback that returns year, month and day components. */
    format(format: string | ((value: string) => [number, number, number])): this;

    /** Requires the string to contain no leading or trailing whitespaces. If the validation `convert` option is `true`, the string will be trimmed. */
    trim(enabled?: boolean): this;

    /** Specifies that the value must be equal to `date`. */
    eq(date: string): this;

    /** Specifies that value must be greater or equal to `date`. */
    ge(date: string): this;

    /** Specifies that the value must be greater than `date`. */
    gt(date: string): this;

    /** Specifies that value must be less or equal to `date`. */
    le(date: string): this;

    /** Specifies that the value must be less than `date`. */
    lt(date: string): this;

    /** Specifies that the value must be a date in the future. */
    future(): this;

    /** Specifies that value must be a date in the past. */
    past(): this;
  }

  interface Root {
    calendardate(): CalendardateSchema;
  }
}
