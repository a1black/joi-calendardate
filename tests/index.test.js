const dayjs = require('dayjs')
/** @type {import('joi')} */
const joi = require('joi').extend(require('../index'))

describe('calendardate.format(arg)', () => {
  test('arg is undefined, throws Error', () => {
    expect(() => joi.calendardate().format()).toThrow(
      'format expected non-empty string'
    )
  })

  test('arg is blank string, throws Error', () => {
    const expected = 'format expected non-empty string'

    expect(() => joi.calendardate().format('')).toThrow(expected)
    expect(() => joi.calendardate().format('  ')).toThrow(expected)
  })

  test.each([
    'YYY MM DD',
    'YY MM MM',
    'YY mm DD',
    'YYYY MM DD HH',
    'YYYY\\MM\\DD'
  ])('arg not valid formatting string: %s, throws Error', arg => {
    const expected = `Invalid formatting string: '${arg}'`

    expect(() => joi.calendardate().format(arg)).toThrow(expected)
  })

  test.each([
    'YYYY-MM-DD',
    'DD.MM.YYYY',
    'MM/YY, D',
    'YY/M, D',
    'MMDDYY',
    'YYYYMMDD'
  ])('validate correctly formated date, expect success', arg => {
    const date = dayjs().format(arg)
    const expected = dayjs().format('YYYY-MM-DD')
    expect(joi.calendardate().format(arg).validate(date)).toEqual({
      value: expected
    })
  })

  test.each(['YYYY MM', 'MM D', 'DD M', 'YY DD'])(
    'validate partially formatted date, expect success',
    arg => {
      const date = dayjs().format(arg)
      const expected = dayjs(date, arg).format('YYYY-MM-DD')
      expect(joi.calendardate().format(arg).validate(date)).toEqual({
        value: expected
      })
    }
  )

  test('input is Date instance, expect format flag reset to default', () => {
    expect(
      joi.calendardate().format('MM DD').validate(new Date('1990-10-10'))
    ).toEqual({
      value: '1990-10-10'
    })
  })

  test('validate incorrectly formated date, expect `calendardate.format` error', () => {
    const format = 'DD.MM.YYYY'
    const value = '2021-06-21'
    expect(joi.calendardate().format(format).validate(value)).toMatchObject({
      error: {
        details: expect.arrayContaining([
          expect.objectContaining({
            type: 'calendardate.format',
            message: `"value" must be a valid date in "${format}" format`
          })
        ])
      }
    })
  })
})

describe('calendardate.trim(arg)', () => {
  test('arg not boolean, throws Error', () => {
    expect(() => joi.calendardate().trim(1)).toThrow(
      `enabled expected boolean, got '1'`
    )
  })

  test('coerce there trim=true, expect trimmed output', () => {
    expect(
      joi.calendardate().trim().validate(' 2021-06-21 ', { convert: true })
    ).toEqual({ value: '2021-06-21' })
  })

  test('validate there trim=true, expect `calendardate.trim` error', () => {
    expect(
      joi.calendardate().trim().validate(' 2021-06-21', { convert: false })
    ).toMatchObject({
      error: {
        details: expect.arrayContaining([
          expect.objectContaining({
            type: 'calendardate.trim',
            message: '"value" must not have leading or trailing whitespace'
          })
        ])
      }
    })
  })
})

describe('calendardate.validate(input)', () => {
  test('input not string, expect `calendardate.base` error', () => {
    expect(
      joi.calendardate().validate(new Date(), { convert: false })
    ).toMatchObject({
      error: {
        details: expect.arrayContaining([
          expect.objectContaining({
            type: 'calendardate.base',
            message: '"value" must be a string'
          })
        ])
      }
    })
  })

  test('input is empty string, expect `calendardate.empty` error', () => {
    expect(joi.calendardate().validate('')).toMatchObject({
      error: {
        details: expect.arrayContaining([
          expect.objectContaining({
            type: 'calendardate.empty',
            message: '"value" is not allowed to be empty'
          })
        ])
      }
    })
  })
})

describe('calendardate.compare(arg, options', () => {
  test('arg not string or Date, throw Error', () => {
    expect(() => joi.calendardate().eq(Date.now())).toThrow(
      'expected Date instance or valid ISO formatted calendar date'
    )
  })

  test('arg not ISO formatted calendar date, throw Error', () => {
    expect(() => joi.calendardate().eq(new Date().toUTCString())).toThrow(
      /^date expected Date instance or valid ISO formatted calendar date/
    )
  })

  test('unknown option keys, throws Error', () => {
    expect(() => joi.calendardate().gt(new Date(), { value: '1 y' })).toThrow(
      /^options expected object that contain date comparison options/
    )
  })

  test.each([3600 * 24, '10 hours', 'ten years', ['ten', 'years']])(
    'invalid comparison options, throw Error',
    value => {
      expect(() => joi.calendardate().gt(new Date(), { exact: value })).toThrow(
        /^options expected object that contain date comparison options/
      )
    }
  )

  test('comparison option === undefined', () => {
    expect(
      joi
        .calendardate()
        .lt('2021-06-21', { exact: undefined, max: undefined, min: undefined })
        .validate('2021-06-20')
    ).toEqual({ value: expect.any(String) })
  })

  test('comparison option === empty array, throw Error', () => {
    expect(() =>
      joi.calendardate().lt('2021-06-21', { exact: [], max: [], min: [] })
    ).toThrow(/^options expected object that contain date comparison options/)
  })

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
  ])('option unit value: %s', value => {
    expect(() =>
      joi.calendardate().gt(new Date(), {
        exact: `10 ${value}`,
        max: ['100', value],
        min: [20, value]
      })
    ).not.toThrow()
  })

  test('arg is Date instance, expect to store its copy', () => {
    const date = new Date()
    const value = dayjs(date).format('YYYY-MM-DD')
    const schema = joi.calendardate().eq(date)
    date.setFullYear(1990)

    expect(schema.validate(value)).toEqual({ value })
  })

  test('arg is `today` date string', () => {
    const value = dayjs().format('YYYY-MM-DD')
    expect(joi.calendardate().eq('today').validate(value)).toEqual({ value })
  })

  test('arg is `yesterday` date string', () => {
    const value = dayjs().subtract(1, 'd').format('YYYY-MM-DD')
    expect(joi.calendardate().eq('yesterday').validate(value)).toEqual({
      value
    })
  })

  test('arg is `tomorrow` date string', () => {
    const value = dayjs().add(1, 'd').format('YYYY-MM-DD')
    expect(joi.calendardate().eq('tomorrow').validate(value)).toEqual({
      value
    })
  })

  test('eq base comparison', () => {
    const [older, compareTo, newer] = ['2021-06-22', '2021-06-21', '2021-06-20']
    const schema = joi.calendardate().eq(compareTo)
    expect(schema.validate(compareTo)).toEqual({ value: compareTo })
    expect(schema.validate(newer).error).toMatchObject({
      details: expect.arrayContaining([
        expect.objectContaining({
          message: `"value" must be equal to "${compareTo}"`,
          type: 'calendardate.eq'
        })
      ])
    })
    expect(schema.validate(older).error).toMatchObject({
      details: expect.arrayContaining([
        expect.objectContaining({
          message: `"value" must be equal to "${compareTo}"`,
          type: 'calendardate.eq'
        })
      ])
    })
  })

  test('gt base comparison', () => {
    const [value, compareTo] = ['2021-06-22', '2021-06-21']
    const schema = joi.calendardate().gt(compareTo)
    expect(schema.validate(value)).toEqual({ value })
    expect(schema.validate(compareTo).error).toMatchObject({
      details: expect.arrayContaining([
        expect.objectContaining({
          message: `"value" must be greater than "${compareTo}"`,
          type: 'calendardate.gt'
        })
      ])
    })
  })

  test('ge base comparison', () => {
    const [older, compareTo, newer] = ['2021-06-22', '2021-06-21', '2021-06-20']
    const schema = joi.calendardate().ge(compareTo)
    expect(schema.validate(older)).toEqual({ value: older })
    expect(schema.validate(compareTo)).toEqual({ value: compareTo })
    expect(schema.validate(newer).error).toMatchObject({
      details: expect.arrayContaining([
        expect.objectContaining({
          message: `"value" must be greater or equal to "${compareTo}"`,
          type: 'calendardate.ge'
        })
      ])
    })
  })

  test('lt base comparison', () => {
    const [value, compareTo] = ['2021-06-21', '2021-06-22']
    const schema = joi.calendardate().lt(compareTo)
    expect(schema.validate(value)).toEqual({ value })
    expect(schema.validate(compareTo).error).toMatchObject({
      details: expect.arrayContaining([
        expect.objectContaining({
          message: `"value" must be less than "${compareTo}"`,
          type: 'calendardate.lt'
        })
      ])
    })
  })

  test('le base comparison', () => {
    const [older, compareTo, newer] = ['2021-06-22', '2021-06-21', '2021-06-20']
    const schema = joi.calendardate().le(compareTo)
    expect(schema.validate(newer)).toEqual({ value: newer })
    expect(schema.validate(compareTo)).toEqual({ value: compareTo })
    expect(schema.validate(older).error).toMatchObject({
      details: expect.arrayContaining([
        expect.objectContaining({
          message: `"value" must be less or equal to "${compareTo}"`,
          type: 'calendardate.le'
        })
      ])
    })
  })

  test('exact comparison option', () => {
    const [compareTo, less, exact, more] = [
      '2021-09-01',
      '2021-07-02' /* One day short */,
      '2021-06-20' /* Round down exact diff */,
      '2021-06-01' /* One month greater */
    ]
    const error = {
      message: `"value" must differ from "${compareTo}" by exactly 2 months`,
      type: 'calendardate.exact'
    }
    const schema = joi.calendardate().lt(compareTo, { exact: '2 months' })

    expect(schema.validate(exact)).toEqual({ value: exact })
    expect(schema.validate(less).error).toMatchObject({
      details: expect.arrayContaining([expect.objectContaining(error)])
    })
    expect(schema.validate(more).error).toMatchObject({
      details: expect.arrayContaining([expect.objectContaining(error)])
    })
  })

  test('max comparison option', () => {
    const [compareTo, less, exact, more] = [
      '2017-06-28',
      '2021-06-26' /* One day short */,
      '2021-10-01' /* Round down exact diff */,
      '2022-06-28' /* One year greater */
    ]
    const error = {
      message: `"value" must differ from "${compareTo}" by less or equal to 4 years`,
      type: 'calendardate.max'
    }
    const schema = joi.calendardate().gt(compareTo, { max: '4 years' })

    expect(schema.validate(less)).toEqual({ value: less })
    expect(schema.validate(exact)).toEqual({ value: exact })
    expect(schema.validate(more).error).toMatchObject({
      details: expect.arrayContaining([expect.objectContaining(error)])
    })
  })

  test('min comparison option', () => {
    const [compareTo, less, exact, more] = [
      '2021-04-01',
      '2021-02-01' /* One day short */,
      '2021-01-31' /* Exact diff */,
      '2021-01-30' /* One ode day greater */
    ]
    const error = {
      message: `"value" must differ from "${compareTo}" by more or equal to 60 days`,
      type: 'calendardate.min'
    }
    const schema = joi.calendardate().lt(compareTo, { min: '60 days' })

    expect(schema.validate(more)).toEqual({ value: more })
    expect(schema.validate(exact)).toEqual({ value: exact })
    expect(schema.validate(less).error).toMatchObject({
      details: expect.arrayContaining([expect.objectContaining(error)])
    })
  })

  test('min = 0 comparison option', () => {
    const value = '2021-06-21'
    const options = { min: '0 days' }
    const schema = joi.calendardate()

    expect(schema.ge(value, options).validate(value)).toEqual({ value })
    expect(schema.le(value, options).validate(value)).toEqual({ value })
  })
})

describe('calendardate.cast(arg)', () => {
  const testdate = () => dayjs().subtract(854, 'day').format('YYYY-MM-DD')

  test.each([
    ['days', 854],
    ['weeks', 122],
    ['months', 28],
    ['quarters', 9],
    ['years', 2]
  ])("arg is '%s', expect %s", (arg, value) => {
    expect(joi.calendardate().cast(arg).validate(testdate())).toEqual({ value })
  })

  test("arg is 'date', expect Date instance", () => {
    expect(joi.calendardate().cast('date').validate('2021-06-28')).toEqual({
      value: new Date('2021-06-28')
    })
  })

  test("arg is 'number', expect timestamp", () => {
    expect(joi.calendardate().cast('number').validate('2021-06-28')).toEqual({
      value: new Date('2021-06-28').getTime()
    })
  })
})
