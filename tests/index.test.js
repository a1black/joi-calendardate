/** @type {import('joi')} */
const joi = require('joi').extend(require('../index'))

describe('format argument testsuit', () => {
  describe('invalid format argument, throws Error', () => {
    test.each(['YY MM', 'YYY MM DD', 'YY MM MM', 'YY mm DD', 'YYYY MM DD HH'])(
      '%s',
      format => {
        expect(() => joi.calendardate().format(format)).toThrow(
          'Invalid format string'
        )
      }
    )
  })

  test('empty format string, throws Error', () => {
    expect(() => joi.calendardate().format('')).toThrow('Invalid format string')
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
