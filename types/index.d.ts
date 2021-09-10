import * as Joi from 'joi';

export = CalendardateExtension;

declare function CalendardateExtension(joi: Joi.Root): Joi.Extension;

declare module 'joi' {
  type TimeUnit =  'day' | 'week' | 'month' | 'quarter' | 'year' | 'days' | 'weeks'| 'months' | 'quarters' | 'years' | 'd' | 'w' | 'M' | 'Q' | 'y';

  interface ComparisonOptions {
    /** Specifies exact difference between two dates. */
    exact?: string | [number, TimeUnit];

    /** Specifies that difference must be less than provided duration. */
    less?: string | [number, TimeUnit];

    /** Specifies that difference must be greater than provided duration. */
    more?: string | [number, TimeUnit];
  }

  interface CalendardateSchema extends AnySchema {
    /** Cast validated value to the specified type. */
    cast(to: 'number'): this;
    cast(to: 'date' | 'days' | 'format' | 'weeks' | 'months' | 'quarters' | 'years'): this;

    /** Specifies that the value must be equal to `date`. */
    eq(date: 'today' | 'tomorrow' | 'yesterday' | string | Date | Reference): this;

    /** Specifies format of parsed date string or callback that returns year, month and day components. */
    format(format: string | ((value: string) => [number, number, number] | Date)): this;

    /** Specifies that the value must be a date in the future. */
    future(options?: ComparisonOptions): this;

    /** Specifies that value must be greater or equal to `date`. */
    ge(date: 'today' | 'tomorrow' | 'yesterday' | string | Date | Reference): this;

    /** Specifies that the value must be greater than `date`. */
    gt(date: 'today' | 'tomorrow' | 'yesterday' | string | Date | Reference, options?: ComparisonOptions): this;

    /** Specifies that value must be less or equal to `date`. */
    le(date: 'today' | 'tomorrow' | 'yesterday' | string | Date | Reference): this;

    /** Specifies that the value must be less than `date`. */
    lt(date: 'today' | 'tomorrow' | 'yesterday' | string | Date | Reference, options?: ComparisonOptions): this;

    /** Specifies that value must be a date in the past. */
    past(options?: ComparisonOptions): this;

    /** Requires the string to contain no leading or trailing whitespaces. If the validation `convert` option is `true`, the string will be trimmed. */
    trim(enabled?: boolean): this;
  }

  interface Root {
    calendardate(): CalendardateSchema;
  }
}
