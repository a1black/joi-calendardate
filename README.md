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
const Joi = require('joi').extend(calendardate)

const userSchema = Joi.object({
  name: Joi.string().required(),
  birthday: Joi.calendardate().lt('today', { min: '18 year' }).required()
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
const { value } = Joi.calendardate().format('DD.MM.YYYY').validate('28.06.2021')
// => 2021-06-28
const { value } = Joi.calendardate().format('YYYYMM').validate('202106')
// => 2021-06-01
const { error } = Joi.calendardate().format('D/M/YY').validate('28/06/21')
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

## cast(to)

Casts validated value to the specified type.

Parameters:

- `to`: [`date` | `number` | `days` | `weeks` | `months` | `quarters` | `years`]

| Cast Type | Return value                            |
| --------- | --------------------------------------- |
| date      | `Date` instance.                        |
| number    | Number of milliseconds since the epoch. |
| days      | Number of days since current date.      |
| weeks     | Number of weeks since current date.     |
| months    | Number of months since current date.    |
| quarters  | Number of quarters since current date.  |
| years     | Number of years since current date.     |

## trim([enabled])

Requires input string to contain no leading or trailing whitespace. If the validation `convert` option is on (enabled by default), the string will be trimmed.

Parameters:

- `enabled`: {`boolean`} - optional parameter defaulting to `true`.

```js
const { value } = Joi.calendardate().trim().validate(' 2021-06-28 ')
// => 2021-06-28
```

Possible validation errors: `calendardate.trim`

## eq(date)

Specifies that the value must be equal to `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)

```js
const schema = joi.object({
  date1: Joi.calendardate().eq('today'),
  date2: Joi.calendardate().eq('2021-06-28'),
  date3: Joi.calendardate().eq(new Date())
})
```

Possible validation errors: `calendardate.eq`

## gt(date, [options])

Specifies that the value must be greater than `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)
- `options`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = Joi.calendardate().gt('2021-06-28', {
  max: '1 year',
  min: '6 months'
})
```

Possible validation errors: `calendardate.gt`, `calendardate.exact`, `calendardate.max`, `calendardate.min`

## ge(date, [options])

Specifies that the value must be greater or equal to `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)
- `options`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = joi.object({
  date1: Joi.calendardate().ge('tomorrow'),
  date2: Joi.calendardate().ge('2021-06-28'),
  date3: Joi.calendardate().ge(new Date())
})
```

Possible validation errors: `calendardate.ge`

## lt(date, [options])

Specifies that the value must be less than `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)
- `options`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = Joi.calendardate().lt('2021-06-28', {
  max: '1 year',
  min: '6 months'
})
```

Possible validation errors: `calendardate.lt`, `calendardate.exact`, `calendardate.max`, `calendardate.min`

## le(date, [options])

Specifies that the value must be less or equal to `date`.

Parameters:

- `date`: [CalendarDateType](#calendardatetype)
- `options`: [ComparisonOptionsType](#comparisonoptionstype)

```js
const schema = joi.object({
  date1: Joi.calendardate().le('yesterday'),
  date2: Joi.calendardate().le('2021-06-28'),
  date3: Joi.calendardate().le(new Date())
})
```

Possible validation errors: `calendardate.le`

## CalendarDateType

**Type:**

- 'today' | 'tomorrow' | 'yesterday' | `string` | `Date`

Date to compare with, can be a string in simplified extended ISO format (date component only) or `Date` instance.

```js
// examples
let value = '7/30'
// => 'M/D'
let value = '7/9/21'
// => 'M/D/YY
let value = '2021-06-21'
// => 'YYYY-MM-DD'
```

## ComparisonOptionsType

Options for date comparison provide limits on a difference between two dates in full time units.

**Type:**

- `Object`

**Template variables:**

- \#limit - Number of time units
- \#unit - Unit as provided (e.g. `{ max: '1 years' }` results in `unit = 'years'`)

**Properties:**

| Name  | Type                           | Description                                              |
| ----- | ------------------------------ | -------------------------------------------------------- |
| exact | `[number, string]` \| `string` | Distance must be equal to specified duration.            |
| max   | `[number, string]` \| `string` | Distance must be less or equal to specified duration.    |
| min   | `[number, string]` \| `string` | Distance must be greater or equal to specified duration. |

Unknown keys are not allowed in the option object and raise `Error`.

```js
const { value } = Joi.calendardate()
  .gt('2021-01-01', { max: '1 year' })
  .validate('2022-02-01')
// => valid, there is only one full year difference.
```

### Time units

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
