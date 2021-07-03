const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/customParseFormat'))

const DEF_FORMAT = 'YYYY-MM-DD'
const comparisonOp = {
  eq: (a, b) => a === b,
  ge: (a, b) => a >= b,
  gt: (a, b) => a > b,
  le: (a, b) => a <= b,
  lt: (a, b) => a < b,
  ne: (a, b) => a !== b
}

const internals = {
  customParse: (value, parser, error) => {
    let date
    const parsed = parser(value)
    if (parsed instanceof Date) {
      date = dayjs(parsed)
    } else {
      const [y, m, d] = Array.isArray(parsed) ? parsed : []
      date = dayjs(new Date(y, m, d))
    }

    return date.isValid()
      ? { value: date.format(DEF_FORMAT) }
      : { value, errors: error('calendardate.parse') }
  },

  isFunction: value => typeof value === 'function',

  isString: value => typeof value === 'string' || value instanceof String,

  normalizeDate: value => {
    value =
      value === 'today'
        ? dayjs().toDate()
        : value === 'tomorrow'
        ? dayjs().add(1, 'day').toDate()
        : value === 'yesterday'
        ? dayjs().subtract(1, 'day').toDate()
        : value
    return value instanceof Date ? dayjs(value).format(DEF_FORMAT) : value
  },

  normalizeCompareOptions: value => {
    const knownOptions = ['exact', 'less', 'more']
    const normalized = {}
    for (const [name, option] of Object.entries(value ?? {})) {
      if (knownOptions.includes(name) && option) {
        normalized[name] = internals.isString(option)
          ? option
              .split(' ')
              .map((value, index) => (!index ? parseInt(value) : value))
          : option
      }
    }

    return normalized
  },

  parse: (value, format, error) => {
    const date = dayjs(value, format, true)
    return date.isValid()
      ? { value: date.format(DEF_FORMAT) }
      : { value, errors: error('calendardate.format') }
  }
}

const joiCalendardate = joi => {
  const args = {
    date: value =>
      internals.isString(value) && dayjs(value, DEF_FORMAT, true).isValid(),

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
    },

    compareOptions: value => {
      const duration = value =>
        Array.isArray(value) &&
        value[0] > 0 &&
        /^(d(ays?)?|w(eeks?)?|months?|quarters?|y(ears?)?|Q|M)$/.test(value[1])

      return (
        typeof value === 'object' &&
        value &&
        Object.values(value).every(duration)
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
      'calendardate.exact':
        '{{#label}} must differ from {{:#date}} by exactly {{:#duration}}',
      'calendardate.format':
        '{{#label}} must be a valid date in {{:#format}} format',
      'calendardate.future': '{{#label}} must be in the future',
      'calendardate.ge': '{{#label}} must be greater or equal to {{:#date}}',
      'calendardate.gt': '{{#label}} must be greater than {{:#date}}',
      'calendardate.le': '{{#label}} must be less or equal to {{:#date}}',
      'calendardate.less':
        '{{#label}} must differ from {{:#date}} by less than {{:#duration}}',
      'calendardate.lt': '{{#label}} must be less than {{:#date}}',
      'calendardate.more':
        '{{#label}} must differ from {{:#date}} by more than {{:#duration}}',
      'calendardate.parse':
        '{{#label}} with value {:[.]} fails to be parsed by a callback',
      'calendardate.past': '{{#label}} must be in the past',
      'calendardate.trim':
        '{{#label}} must not have leading or trailing whitespace'
    },

    coerce: {
      from: ['object', 'string'],
      method(value, { schema }) {
        if (value instanceof Date) {
          value = dayjs(value).format(schema.$_getFlag('format') || DEF_FORMAT)
        } else if (internals.isString(value) && schema.$_getFlag('trim')) {
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

      const format = schema.$_getFlag('format') || DEF_FORMAT
      return internals.isFunction(format)
        ? internals.customParse(value, format, error)
        : internals.parse(value, format, error)
    },

    rules: {
      compare: {
        method: false,
        args: [
          {
            assert: args.date,
            normalize: internals.normalizeDate,
            name: 'date',
            message:
              'expected Date instance or valid ISO formatted calendar date',
            ref: true
          },
          {
            assert: args.compareOptions,
            normalize: internals.normalizeCompareOptions,
            name: 'options',
            message:
              'expected plain object that have "exact", "less" or "more" properties' +
              ' which values are an array or a string contain natural number and time unit'
          }
        ],
        validate(value, { error }, { date, options }, { name, operator }) {
          const minuend = dayjs(value)
          const sub = dayjs(date)
          const diffComare = {
            exact: (diff, unit) =>
              comparisonOp.eq(Math.abs(minuend.diff(sub, unit)), diff),
            less: (diff, unit) =>
              comparisonOp.lt(Math.abs(minuend.diff(sub, unit)), diff),
            more: (diff, unit) =>
              comparisonOp.gt(Math.abs(minuend.diff(sub, unit)), diff)
          }

          if (!operator(minuend.diff(sub), 0)) {
            return error(`calendardate.${name}`, { date })
          }
          for (const [rule, [diff, unit]] of Object.entries(options ?? {})) {
            if (!diffComare[rule](diff, unit)) {
              return error(`calendardate.${rule}`, {
                date,
                duration: `${diff} ${unit}`
              })
            }
          }

          return value
        }
      },
      eq: {
        method(date) {
          return this.$_addRule({
            name: 'eq',
            method: 'compare',
            args: { date },
            operator: comparisonOp.eq
          })
        }
      },
      format: {
        method(format) {
          if (!internals.isString(format) && !internals.isFunction(format)) {
            throw new Error(`format expected non-empty string or a function`)
          } else if (internals.isString(format) && !args.format(format)) {
            throw new Error(`format invalid formatting string: '${format}'`)
          }

          return this.$_setFlag('format', format)
        }
      },
      future: {
        args: ['date', 'options'],
        method(options) {
          return this.$_addRule({
            name: 'future',
            method: 'compare',
            args: { date: 'today', options },
            operator: comparisonOp.gt
          })
        }
      },
      ge: {
        method(date) {
          return this.$_addRule({
            name: 'ge',
            method: 'compare',
            args: { date },
            operator: comparisonOp.ge
          })
        }
      },
      gt: {
        args: ['date', 'options'],
        method(date, options) {
          return this.$_addRule({
            name: 'gt',
            method: 'compare',
            args: { date, options },
            operator: comparisonOp.gt
          })
        }
      },
      le: {
        method(date) {
          return this.$_addRule({
            name: 'le',
            method: 'compare',
            args: { date },
            operator: comparisonOp.le
          })
        }
      },
      lt: {
        args: ['date', 'options'],
        method(date, options) {
          return this.$_addRule({
            name: 'lt',
            method: 'compare',
            args: { date, options },
            operator: comparisonOp.lt
          })
        }
      },
      past: {
        args: ['date', 'options'],
        method(options) {
          return this.$_addRule({
            name: 'past',
            method: 'compare',
            args: { date: 'today', options },
            operator: comparisonOp.lt
          })
        }
      },
      trim: {
        convert: true,
        method(enabled = true) {
          if (typeof enabled !== 'boolean') {
            throw new Error(`enabled expected boolean, got '${enabled}'`)
          }

          return this.$_setFlag('trim', enabled)
        }
      }
    }
  }
}

module.exports = joiCalendardate
