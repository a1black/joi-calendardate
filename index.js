const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/customParseFormat'))

/** @typedef {(value: string) => number[]|null} DateParser */

const DEF_FORMAT = 'YYYY-MM-DD'

const internals = {
  /** @type {(value: any) => value is Function} */
  isFunction: value => typeof value === 'function',

  /** @type {(value: any) => value is string} */
  isString: value => typeof value === 'string' || value instanceof String,

  /** @type {(value: string, format: string, error: Function) => string|Error} */
  parse: (value, format, error) => {
    const date = dayjs(value, format, true)
    return date.isValid()
      ? date.format(DEF_FORMAT)
      : error('calendardate.format', { value, format })
  },

  /** @type {(value: string, parser: DateParser, error: Function) => string|Error} */
  customParse: (value, parser, error) => {
    const parsed = parser(value)
    const [y, m, d] = Array.isArray(parsed) ? parsed : []
    const date = dayjs(new Date(y, m, d))
    return date.isValid()
      ? date.format(DEF_FORMAT)
      : error('calendardate.parse', { value })
  },

  /** @type {(value: string, date: string) => boolean} */
  eqRule: (value, date) => value === date,

  /** @type {(value: string, date: string) => boolean} */
  gtRule: (value, date) => dayjs(value).diff(date) > 0,

  /** @type {(value: string, date: string) => boolean} */
  ltRule: (value, date) => dayjs(value).diff(date) < 0
}

/** @type {import('joi').ExtensionFactory} */
const joiCalendardate = joi => {
  const args = {
    /** @type {(value: any) => boolean} */
    date: value => {
      /** Checks of value is valid ISO formatted date. */
      return (
        internals.isString(value) && dayjs(value, DEF_FORMAT, true).isValid()
      )
    },

    /** @type {(value: string) => boolean} */
    format: value => {
      /** Checks if formatting string is valid or not. */
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
      'calendardate.eq': '{{#label}} must be equal to {{:#date}}',
      'calendardate.future': '{{#label}} must be in the future',
      'calendardate.format':
        '{{#label}} must be a valid date in {{:#format}} format',
      'calendardate.ge': '{{#label}} must be greater or equal to {{:#date}}',
      'calendardate.gt': '{{#label}} must be greater than {{:#date}}',
      'calendardate.le': '{{#label}} must be less or equal to {{:#date}}',
      'calendardate.lt': '{{#label}} must be less than {{:#date}}',
      'calendardate.parse':
        '{{#label}} with value {:[.]} fails to be parsed by a callback',
      'calendardate.past': '{{#label}} must be in the past',
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
          ? internals.customParse(value, format, error)
          : internals.parse(value, format, error)
        if (internals.isString(parsed)) {
          value = parsed
        } else {
          return { value, errors: parsed }
        }
      }

      return { value }
    },

    rules: {
      // Requires that validated value matches `format`.
      format: {
        method(format) {
          if (!internals.isString(format) && !internals.isFunction(format)) {
            throw new Error(
              `format expected non-empty string or a function, got '${format}'`
            )
          } else if (internals.isString(format) && !args.format(format)) {
            throw new Error(`Invalid format string: '${format}'`)
          }

          return this.$_setFlag('format', format)
        }
      },
      // Requires that validated value hasn't got trailing spaces.
      trim: {
        convert: true,
        method(enabled = true) {
          if (typeof enabled !== 'boolean') {
            throw new Error(`enabled expected boolean, got '${enabled}'`)
          }

          return this.$_setFlag('trim', enabled)
        }
      },
      compare: {
        method: false,
        args: [
          {
            /** @type {(value: any) => boolean} */
            assert: args.date,
            /** @type {(value: string|Date) => string} */
            normalize: value => {
              value =
                value === 'today'
                  ? dayjs().toDate()
                  : value === 'tomorrow'
                  ? dayjs().add(1, 'day').toDate()
                  : value === 'yesterday'
                  ? dayjs().subtract(1, 'day').toDate()
                  : value
              return value instanceof Date
                ? dayjs(value).format(DEF_FORMAT)
                : value
            },
            name: 'date',
            message:
              'expected Date instance or valid ISO formatted calendar date',
            ref: true
          },
          'code',
          'eq',
          'gt',
          'lt'
        ],
        validate(value, { error }, { code, date, eq, gt, lt }) {
          if (typeof date !== 'string') throw new Error('NOPE')
          const rules = []
          if (eq) rules.push(internals.eqRule)
          if (gt) rules.push(internals.gtRule)
          if (lt) rules.push(internals.ltRule)

          return rules.some(rule => rule(value, date))
            ? value
            : error(code, { value, date })
        }
      },

      eq: {
        method(date) {
          return this.$_addRule({
            name: 'compare',
            args: {
              code: 'calendardate.eq',
              date,
              eq: true,
              gt: false,
              lt: false
            }
          })
        }
      },
      gt: {
        method(date) {
          return this.$_addRule({
            name: 'compare',
            args: {
              code: 'calendardate.gt',
              date,
              eq: false,
              gt: true,
              lt: false
            }
          })
        }
      },
      ge: {
        method(date) {
          return this.$_addRule({
            name: 'compare',
            args: {
              code: 'calendardate.ge',
              date,
              eq: true,
              gt: true,
              lt: false
            }
          })
        }
      },
      lt: {
        method(date) {
          return this.$_addRule({
            name: 'compare',
            args: {
              code: 'calendardate.lt',
              date,
              eq: false,
              gt: false,
              lt: true
            }
          })
        }
      },
      le: {
        method(date) {
          return this.$_addRule({
            name: 'compare',
            args: {
              code: 'calendardate.le',
              date,
              eq: true,
              gt: false,
              lt: true
            }
          })
        }
      },
      future: {
        method() {
          return this.$_addRule({
            name: 'compare',
            args: {
              code: 'calendardate.future',
              date: 'today',
              eq: false,
              gt: true,
              lt: false
            }
          })
        }
      },
      past: {
        method() {
          return this.$_addRule({
            name: 'compare',
            args: {
              code: 'calendardate.past',
              date: 'today',
              eq: false,
              gt: false,
              lt: true
            }
          })
        }
      }
    }
  }
}

module.exports = joiCalendardate
