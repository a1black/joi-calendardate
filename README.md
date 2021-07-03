# joi-calendardate

[Joi][] extension to validate date that described as a string without time component.

[joi]: https://www.npmjs.com/package/joi 'The most powerful schema description language and data validator for JavaScript'

## Installation

```bash
npm install --save a1black/joi-calendardate
```

## Usage

```js
const calendardate = require('joi-calendardate')
const joi = require('joi').extend(calendardate)

const userSchema = joi.object({
  name: joi.string().required(),
  birthday: joi.calendardate().past({ more: '17 year' }).required()
})
// => Verify that user provided name and is 18 years or older.
```

## API

## calendardate()

Generates a schema object that requires input string to match `YYYY-MM-DD` format (unless dfferent format is set, see [format()](#format)), if the validation `convert` option is on (enabled by default), input `Date` instance will be converted to a string. On validation schema returns a date component in simplified extended ISO format.

Possible validation errors: `calendardate.base`, `calendardate.empty`

## format(format)

Overwrites default format for parsing date string. `calendardate` schema uses strict matching, i.e. format must match input string exactly, including delimiters.

Parameters:

- `format`: {`string` | `Function`} - format for parsing date string or custom parser function.

```js
const { value } = joi.calendardate().format('DD.MM.YYYY').validate('28.06.2021')
// => 2021-06-28
const { error } = joi.calendardate().format('D/M/YY').validate('28/06/21')
// => Error: calendardate.format
```

### List of available parsing tokens and delimiters

| Token | Example | Description                     |
| ----- | ------- | ------------------------------- |
| YY    | 21      | Year, 2-digit                   |
| YYYY  | 2021    | Year, 4-digit                   |
| M     | 1-12    | Month, 1 corresponds to January |
| MM    | 01-12   | Month, 2-digit                  |
| D     | 1-31    | Day of month                    |
| DD    | 01-31   | Day of month, 2-digit           |

Allowed delimiter characters are `,` (comma), `.` (dot), `-` (minus sign), `/` (forward slash) and space.

### Custom date parser

If input date can't be described using available tokens and delimiter characters, format should be set to a function that receives date string as argument and returns an array `[year, month, day]` (see [Date constructor][date]) or `Date` instance.

[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#parameters 'Date() constructor. Individual date and time component values'

```js
const parser = value => {
  const date = new Date(value)
  return [date.getFullYear(), date.getMonth(), date.getDate()]
}
const { value } = joi.calendardate().format(parser).validate('Jun 28, 2021')
// => 2021-06-28
```

Possible validation errors: `calendardate.format`, `calendardate.parse`

## trim([enabled])

Requires input string to contain no leading or trailing whitespace. If the validation `convert` option is on (enabled by default), the string will be trimmed.

Parameters:

- `enabled`: {`boolean`} - optional parameter defaulting to `true`.

```js
const { value } = joi.calendardate().trim().validate(' 2021-06-28 ')
// => 2021-06-28
```

Possible validation errors: `calendardate.trim`

## eq(date)

Specifies that the value must be equal to `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)

```js
const schema = joi.object({
  date1: joi.calendardate().eq('today'),
  date2: joi.calendardate().eq('2021-06-28'),
  date3: joi.calendardate().eq(new Date())
})
```

Possible validation errors: `calendardate.eq`

## gt(date, [options])

Specifies that the value must be greater than `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)
- `option`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = joi
  .calendardate()
  .gt('2021-06-28', { less: '1 year', more: '6 months' })
```

Possible validation errors: `calendardate.gt`, `calendardate.exact`, `calendardate.less`, `calendardate.more`

## ge(date)

Specifies that the value must be greater or equal to `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)

```js
const schema = joi.object({
  date1: joi.calendardate().ge('tomorrow'),
  date2: joi.calendardate().ge('2021-06-28'),
  date3: joi.calendardate().ge(new Date())
})
```

Possible validation errors: `calendardate.ge`

## lt(date, [options])

Specifies that the value must be greater than `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)
- `option`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = joi
  .calendardate()
  .lt('2021-06-28', { less: '1 year', more: '6 months' })
```

Possible validation errors: `calendardate.lt`, `calendardate.exact`, `calendardate.less`, `calendardate.more`

## le(date)

Specifies that the value must be less or equal to `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)

```js
const schema = joi.object({
  date1: joi.calendardate().le('yesterday'),
  date2: joi.calendardate().le('2021-06-28'),
  date3: joi.calendardate().le(new Date())
})
```

Possible validation errors: `calendardate.le`

## future([options])

Alias for `gt('today', options)` rule.

Parameters:

- `option`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = joi.calendardate().future({ less: '1 year' })
```

Possible validation errors: `calendardate.future`

## past([options])

Alias for `lt('today', options)` rule.

Parameters:

- `option`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = joi.calendardate().past({ more: '17 year' })
```

Possible validation errors: `calendardate.past`

## CalendarDateType

Date to compare with, can be a string in simplified extended ISO format (date component only) or `Date` instance.

**Type:**

- `today` | `tomorrow` | `yesterday` | `string` | `Date`

## ComparisonOptionsType

Options for validating distance between two dates.

**Type:**

- `Object`

**Properties:**

| Name  | Type                           | Description                                       |
| ----- | ------------------------------ | ------------------------------------------------- |
| exact | `[number, string]` \| `string` | Distance must be equal to specified duration.     |
| less  | `[number, string]` \| `string` | Distance must be less than specified duration.    |
| more  | `[number, string]` \| `string` | Distance must be greater than specified duration. |

Duration can be described with tuple or space-delimited string that contains natural number and time unit.

### List of all available units

Units are case-sensitive and support plural and short forms.

| Unit    | Shorthand |
| ------- | --------- |
| day     | d         |
| week    | w         |
| month   | M         |
| quarter | Q         |
| year    | y         |

## License

This project is licensed under the BSD-3-Clause license. See the [LICENSE](LICENSE.txt) file for more info.
