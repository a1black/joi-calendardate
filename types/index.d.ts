import * as Joi from 'joi';

export = CalendardateExtension;

declare function CalendardateExtension(joi: Joi.Root): Joi.Extension;

declare module 'joi' {
  type TimeUnit =  'day' | 'week' | 'month' | 'quarter' | 'year' | 'days' | 'weeks'| 'months' | 'quarters' | 'years' | 'd' | 'w' | 'M' | 'Q' | 'y';

  interface ComparisonOptions {
    /** Specifies exact difference between two dates. */
    exact?: string | [number, TimeUnit];

    /** Specifies max difference between validated date and compared date. */
    max?: string | [number, TimeUnit];

    /** Specifies min difference between validated date and compared date. */
    min?: string | [number, TimeUnit];
  }

  interface CalendardateSchema extends AnySchema {
    /** Cast validated value to the specified type. */
    cast(to: 'number'): this;
    cast(to: 'date' | 'days' | 'weeks' | 'months' | 'quarters' | 'years'): this;

    /** Specifies that the value must be equal to `date`. */
    eq(date: string | Date | Reference): this;

    /** Specifies format of parsed date string or callback that returns year, month and day components. */
    format(format: string): this;

    /** Specifies that value must be greater or equal to `date`. */
    ge(date: string | Date | Reference, options?: ComparisonOptions): this;

    /** Specifies that the value must be greater than `date`. */
    gt(date: string | Date | Reference, options?: ComparisonOptions): this;

    /** Specifies that value must be less or equal to `date`. */
    le(date: string | Date | Reference, options?: ComparisonOptions): this;

    /** Specifies that the value must be less than `date`. */
    lt(date: string | Date | Reference, options?: ComparisonOptions): this;

    /** Requires the string to contain no leading or trailing whitespaces. If the validation `convert` option is `true`, the string will be trimmed. */
    trim(enabled?: boolean): this;
  }

  interface Root {
    calendardate(): CalendardateSchema;
  }
}
