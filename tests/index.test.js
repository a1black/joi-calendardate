/** @type {import('joi')} */
const joi = require('joi').extend(require('../index'))

/** @type {(date: Date) => string} */
const isodate = date => date.toISOString().split('T')[0]

/** @type {() => string} */
const today = () => isodate(new Date())

describe('format argument testsuit', () => {
  describe('invalid format argument, throws Error', () => {
    test.each(['YY MM', 'YYY MM DD', 'YY MM MM', 'YY mm DD', 'YYYY MM DD HH'])(
      '%s',
      format => {
        expect(() => joi.calendardate().format(format)).toThrow(
          'format invalid formatting string'
        )
      }
    )
  })

  test('empty format string, throws Error', () => {
    expect(() => joi.calendardate().format('')).toThrow(
      'format invalid formatting string'
    )
  })
})

describe('base validation', () => {
  test('empty string value, throws ValidationError', () => {
    const schema = joi.calendardate()
    expect(() => joi.attempt('', schema)).toThrow('is not allowed to be empty')
  })

  test('value of invalid type, throws ValidationError', () => {
    const schema = joi.calendardate()
    expect(() => joi.attempt(1624924800000, schema)).toThrow('must be a string')
  })
})

describe('format rule testsuit', () => {
  test('default format, throws ValidationError', () => {
    expect(() => joi.attempt('21-06-28', joi.calendardate())).toThrow(
      'must be a valid date'
    )
  })

  test('default format, expect ISO formatted date', () => {
    const input = '2021-06-28'
    expect(joi.attempt(input, joi.calendardate())).toBe(input)
  })

  test('invalid format, throws ValidationError', () => {
    const format = 'DD-MM-YYYY'
    const schema = joi.calendardate().format(format)
    expect(() => joi.attempt('2021-06-28', schema)).toThrow(
      'must be a valid date'
    )
  })

  describe('callback format returns wrong type, throws ValidationError', () => {
    test.each([new Date(), Date.now(), [2021, 5], '2021-06-28'])(
      '%s',
      returnValue => {
        const input = '2021-06-28'
        const format = jest.fn().mockReturnValue(returnValue)
        expect(() =>
          joi.attempt(input, joi.calendardate().format(format))
        ).toThrow('fails to be parsed by a callback')
        expect(format).toHaveBeenCalledWith(input)
      }
    )
  })

  test('callback format, expect ISO formated string', () => {
    const expected = '2021-06-28'
    const format = jest.fn().mockReturnValue([2021, 5, 28, 15, 34, 30])
    const schema = joi.calendardate().format(format)
    expect(joi.attempt(expected, schema)).toBe(expected)
  })

  test.each([
    ['MM/DD/YYYY', '06/28/2021'],
    ['DD/MM/YYYY', '28/06/2021'],
    ['YYYY/MM/DD', '2021/06/28'],
    ['M/D/YY', '6/28/21'],
    ['D/M/YY', '28/6/21'],
    ['YY/M/D', '21/6/28'],
    ['MMDDYYYY', '06282021'],
    ['DDMMYYYY', '28062021'],
    ['YYYYMMDD', '20210628'],
    ['DD-MM-YYYY', '28-06-2021'],
    ['YYYY-MM-DD', '2021-06-28'],
    ['DD.MM.YYYY', '28.06.2021'],
    ['YYYY.MM.DD', '2021.06.28']
  ])("'%s' parse '%s', expect ISO formatted date string", (format, value) => {
    const expected = '2021-06-28'
    const schema = joi.calendardate().format(format)
    expect(joi.attempt(value, schema)).toEqual(expected)
  })
})

describe('trim rule testsuit', () => {
  test('convert option is on, expect trimmed string', () => {
    const expected = '2021-06-28'
    const schema = joi.calendardate().trim()
    expect(joi.attempt(` ${expected} `, schema, { convert: true })).toBe(
      expected
    )
  })

  test('convert options is off, throws ValidationError', () => {
    const schema = joi.calendardate().trim()
    expect(() =>
      joi.attempt(' 2021-06-28 ', schema, { convert: false })
    ).toThrow('must not have leading or trailing whitespace')
  })
})

describe('compare rule date argument', () => {
  test.each([1624924800000, [2021, 5, 28]])('%s, throws Error', value => {
    expect(() => joi.calendardate().eq(value)).toThrow(
      'date expected Date instance or valid ISO formatted calendar date'
    )
  })

  test.each(['2021-06-28', new Date()])('%s, expect nothing', value => {
    expect(() => joi.calendardate().eq(value)).not.toThrow()
  })

  test('change of Date instance does not effect validation rule, expect value eq date', () => {
    const expected = today()
    const date = new Date()
    const schema = joi.calendardate().eq(date)
    date.setFullYear(date.getFullYear() + 1)
    expect(joi.attempt(expected, schema)).toBe(expected)
  })
})

describe('compare rule options argument testsuit', () => {
  test.each([
    'd',
    'day',
    'days',
    'w',
    'week',
    'weeks',
    'M',
    'month',
    'months',
    'Q',
    'quarter',
    'quarters',
    'y',
    'year',
    'years'
  ])('unit %s, expect nothing', value => {
    expect(() =>
      joi.calendardate().future({
        exact: `1 ${value}`,
        less: `10 ${value}`,
        more: [20, value]
      })
    ).not.toThrow()
  })

  test('empty object as options argument, expect nothing', () => {
    expect(() => joi.calendardate().future()).not.toThrow()
    expect(() => joi.calendardate().future({})).not.toThrow()
  })
})

describe('eq rule testsuit', () => {
  describe('vlaue is equal to date, expect validated date', () => {
    test.each([
      ['2021-06-28', new Date(2021, 5, 28)],
      ['2021-06-28', '2021-06-28'],
      [today(), 'today']
    ])('%s === %s', (expected, date) => {
      const schema = joi.calendardate().eq(date)
      expect(joi.attempt(expected, schema)).toBe(expected)
    })
  })

  describe('value is not equal to date, throws ValidationError', () => {
    test.each([
      ['2021-06-28', new Date(2021, 5, 27)],
      ['2021-06-28', '2021-06-29'],
      [today(), 'tomorrow'],
      [today(), 'yesterday']
    ])('%s !== %s', (expected, date) => {
      const schema = joi.calendardate().eq(date)
      expect(() => joi.attempt(expected, schema)).toThrow('must be equal to')
    })
  })
})

describe('gt rule testsuit', () => {
  describe('value is greater than date, expect ISO date string', () => {
    test.each([
      ['2021-06-28', new Date(2021, 5, 27)],
      ['2021-06-28', '2021-06-27'],
      [today(), 'yesterday']
    ])('%s > %s', (expected, date) => {
      const schema = joi.calendardate().gt(date)
      expect(joi.attempt(expected, schema)).toBe(expected)
    })
  })

  describe('value is less than date, throws ValidationError', () => {
    test.each([
      ['2021-06-28', new Date(2021, 5, 29)],
      ['2021-06-28', '2021-06-29'],
      [today(), 'tomorrow'],
      [today(), 'today']
    ])('%s <= %s', (expected, date) => {
      const schema = joi.calendardate().gt(date)
      expect(() => joi.attempt(expected, schema)).toThrow(
        'must be greater than'
      )
    })
  })
})

describe('lt rule testsuit', () => {
  describe('value is less than date, expect ISO date string', () => {
    test.each([
      ['2021-06-28', new Date(2021, 5, 29)],
      ['2021-06-28', '2021-06-29'],
      [today(), 'tomorrow']
    ])('%s < %s', (expected, date) => {
      const schema = joi.calendardate().lt(date)
      expect(joi.attempt(expected, schema)).toBe(expected)
    })
  })

  describe('value is greater than date, throws ValidationError', () => {
    test.each([
      ['2021-06-28', new Date(2021, 5, 27)],
      ['2021-06-28', '2021-06-27'],
      [today(), 'today'],
      [today(), 'yesterday']
    ])('%s >= %s', (expected, date) => {
      const schema = joi.calendardate().lt(date)
      expect(() => joi.attempt(expected, schema)).toThrow('must be less than')
    })
  })
})

test('value is in the future, expect ISO date string', () => {
  const expected = isodate(new Date(Date.now() + 24 * 3600 * 1000))
  const schema = joi.calendardate().future()
  expect(joi.attempt(expected, schema)).toBe(expected)
})

test('value is in the past, expect ISO date string', () => {
  const expected = isodate(new Date(Date.now() - 24 * 3600 * 1000))
  const schema = joi.calendardate().past()
  expect(joi.attempt(expected, schema)).toBe(expected)
})

describe('exact rule testsuit', () => {
  test('value differ from date by not exact duration, throws ValidationError', () => {
    const expected = '2021-06-28'
    const date = '2021-10-01'
    const schema = joi.calendardate().lt(date, { exact: '2 months' })
    expect(() => joi.attempt(expected, schema)).toThrow('by exactly')
  })

  test('value is differ by exact duration, expect ISO date string', () => {
    const expected = '2021-06-28'
    const date = '2021-09-01'
    const schema = joi.calendardate().lt(date, { exact: '2 months' })
    expect(joi.attempt(expected, schema)).toBe(expected)
  })
})

describe('less rule testsuit', () => {
  test('value differ from date by more than specified duration, throws ValidationError', () => {
    const expected = '2021-06-28'
    const date = '2017-06-28'
    const schema = joi.calendardate().gt(date, { less: '4 years' })
    expect(() => joi.attempt(expected, schema)).toThrow('by less than')
  })

  test('value is differ from date by less than specified duration, expect ISO date string', () => {
    const expected = '2021-06-28'
    const date = '2021-07-17'
    const schema = joi.calendardate().lt(date, { less: '20 days' })
    expect(joi.attempt(expected, schema)).toBe(expected)
  })
})

describe('more rule testsuit', () => {
  test('value differ from date by less than specified duration, throws ValidationError', () => {
    const expected = '2021-06-28'
    const date = '2021-05-01'
    const schema = joi.calendardate().gt(date, { more: '60 days' })
    expect(() => joi.attempt(expected, schema)).toThrow('by more than')
  })

  test('value is differ from date by more than specified duration, expect ISO date string', () => {
    const expected = '2021-06-28'
    const date = '2019-01-01'
    const schema = joi.calendardate().gt(date, { more: '500 days' })
    expect(joi.attempt(expected, schema)).toBe(expected)
  })
})

test('value fall in the range set by less and more options, expect ISO date string', () => {
  const expected = '2021-06-28'
  const date = '2021-02-28'
  const schema = joi
    .calendardate()
    .gt(date, { more: '100 days', less: '200 days' })
  expect(joi.attempt(expected, schema)).toBe(expected)
})

test('value does not fall in the range set by less and more options, throws ValidationError', () => {
  const expected = '2021-06-28'
  const date = '2021-02-28'
  const schema = joi
    .calendardate()
    .gt(date, { more: '100 days', less: '100 days' })
  expect(() => joi.attempt(expected, schema)).toThrow(joi.ValidationError)
})

test('exact and less/more are mutually exclusive options, throws ValidationError', () => {
  const expected = '2021-06-28'
  const date = '2021-02-28'
  const schema = joi
    .calendardate()
    .gt(date, { exact: '100 days', more: '100 days' })
  expect(() => joi.attempt(expected, schema)).toThrow(joi.ValidationError)
})
