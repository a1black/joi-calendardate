const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/customParseFormat'))

/** @typedef {(value: string) => number[]|null} DateParser */
/** @typedef {{value: string, error?: string}} RuleReturn */

class InvalidArgumentError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = this.constructor.name
  }
}

const internals = {
  /** @type {(value: any) => value is Function} */
  isFunction: value => typeof value === 'function',

  /** @type {(value: any) => value is string} */
  isString: value => typeof value === 'string' || value instanceof String,

  /** @type {(value: string, format: string) => RuleReturn} */
  parse: (value, format) => {
    const date = dayjs(value, format, true)
    return date.isValid()
      ? { value: date.format('YYYY-MM-DD') }
      : { value, error: 'calendardate.format' }
  },

  /** @type {(value: string, parser: DateParser) => RuleReturn} */
  customParse: (value, parser) => {
    const parsed = parser(value)
    const [y, m, d] = Array.isArray(parsed) ? parsed : []
    const date = dayjs(new Date(y, m, d))
    return date.isValid()
      ? { value: date.format('YYYY-MM-DD') }
      : { value, error: 'calendardate.parse' }
  }
}

/** @type {import('joi').ExtensionFactory} */
const joiCalendardate = joi => {
  const args = {
    /** @type {(value: string) => boolean} */
    format: value => {
      const matches = value.match(
        /^(YYYY|YY|MM|M|DD|D)[-,./\s]*(YYYY|YY|MM|M|DD|D)[-,./\s]*(YYYY|YY|MM|M|DD|D)$/
      )
      const dateparts = matches ? matches.slice(1, 4) : []
      return (
        dateparts.length === 3 &&
        dateparts
          .map(part => part[0][0])
          .filter((el, index, arr) => arr.indexOf(el) === index).length === 3
      )
    }
  }

  return {
    type: 'calendardate',
    base: joi.any(),

    messages: {
      'calendardate.base': '{{#label}} must be a string',
      'calendardate.empty': '{{#label}} is not allowed to be empty',
      'calendardate.format':
        '{{#label}} must be a valid date in {{:#format}} format',
      'calendardate.parse':
        '{{#label}} with value {:[.]} fails to be parsed by a callback',
      'calendardate.trim':
        '{{#label}} must not have leading or trailing whitespace'
    },

    coerce: {
      from: 'string',
      method(value, { schema }) {
        if (schema.$_getFlag('trim')) {
          value = value.trim()
        }

        return { value }
      }
    },

    validate(value, { error, schema }) {
      if (!internals.isString(value)) {
        return { value, errors: error('calendardate.base') }
      } else if (value === '') {
        return { value, errors: error('calendardate.empty') }
      }

      const trim = schema.$_getFlag('trim')
      if (trim && value !== value.trim()) {
        return { value, errors: error('calendardate.trim') }
      }

      const format = schema.$_getFlag('format') || 'YYYY-MM-DD'
      if (format) {
        const parsed = internals.isFunction(format)
          ? internals.customParse(value, format)
          : internals.parse(value, format)
        if (parsed.error) {
          return { value, errors: error(parsed.error, { format, value }) }
        } else {
          value = parsed.value
        }
      }

      return { value }
    },

    rules: {
      // Requires that validated value matches `format`.
      format: {
        method(format) {
          if (!internals.isString(format) && !internals.isFunction(format)) {
            throw new InvalidArgumentError(
              `format expected non-empty string or a function, got '${format}'`
            )
          } else if (internals.isString(format) && !args.format(format)) {
            throw new InvalidArgumentError(`Invalid format string: '${format}'`)
          }

          return this.$_setFlag('format', format)
        }
      },
      // Requires that validated value hasn't got trailing spaces.
      trim: {
        convert: true,
        method(enabled = true) {
          if (typeof enabled !== 'boolean') {
            throw new InvalidArgumentError(
              `enabled expected boolean, got '${enabled}'`
            )
          }

          return this.$_setFlag('trim', enabled)
        }
      },
      eq: {},
      gt: {},
      ge: {},
      lt: {},
      le: {},
      future: {},
      past: {}
    }
  }
}

module.exports = joiCalendardate
