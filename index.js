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
  diffToNow: (value, unit) => {
    return Math.abs(dayjs(value).diff(dayjs().format(DEF_FORMAT), unit))
  },

  isCalendarDate: value =>
    internals.isString(value) && dayjs(value, DEF_FORMAT, true).isValid(),

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

  normalizeCompareOptions: value =>
    Object.entries(value || {}).map(([name, opt]) => {
      opt = internals.isString(opt) ? opt.split(/\s+/) : opt
      return [name, parseInt(opt[0]), opt[1]]
    }),

  parse: (value, format, error) => {
    const date = dayjs(value, format, true)
    return date.isValid()
      ? { value: date.format(DEF_FORMAT) }
      : { value, errors: error('calendardate.format', { format }) }
  }
}

const joiCalendardate = joi => {
  const args = {
    date: internals.isCalendarDate,

    format: value => {
      const matches = value.match(
        /^(YYYY|YY|MM|M|DD|D)[-,./\s]*(YYYY|YY|MM|M|DD|D)([-,./\s]*(YYYY|YY|MM|M|DD|D))?$/
      )
      const dateparts = matches
        ? matches.filter((_, index) => [1, 2, 4].includes(index))
        : []
      return (
        dateparts.length === 3 &&
        dateparts
          .map(part => (part ? part[0] : part))
          .filter((el, index, arr) => arr.indexOf(el) === index).length === 3
      )
    },

    compareOptions: value => {
      const unitRegex = '(d(ays?)?|w(eeks?)?|months?|quarters?|y(ears?)?|Q|M)'
      const { error } = joi
        .object()
        .pattern(
          /^(?:exact|max|min)$/,
          joi.alt([
            joi.string().pattern(new RegExp(`^[0-9]+\\s+${unitRegex}$`)),
            joi
              .array()
              .items(
                joi.number().integer().min(0).required(),
                joi
                  .string()
                  .pattern(new RegExp(`^${unitRegex}$`))
                  .required()
              )
              .length(2)
          ])
        )
        .prefs({ allowUnknown: false })
        .validate(value)

      return error === undefined
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
        '{{#label}} must differ from {{:#date}} by exactly {{#limit}} {{#unit}}',
      'calendardate.format':
        '{{#label}} must be a valid date in {{:#format}} format',
      'calendardate.ge': '{{#label}} must be greater or equal to {{:#date}}',
      'calendardate.gt': '{{#label}} must be greater than {{:#date}}',
      'calendardate.le': '{{#label}} must be less or equal to {{:#date}}',
      'calendardate.lt': '{{#label}} must be less than {{:#date}}',
      'calendardate.max':
        '{{#label}} must differ from {{:#date}} by less or equal to {{#limit}} {{#unit}}',
      'calendardate.min':
        '{{#label}} must differ from {{:#date}} by more or equal to {{#limit}} {{#unit}}',
      'calendardate.trim':
        '{{#label}} must not have leading or trailing whitespace'
    },

    coerce: {
      from: ['object', 'string'],
      method(value, { schema }) {
        if (value instanceof Date) {
          schema.$_setFlag('format', DEF_FORMAT, { clone: false })
          value = dayjs(value).format(DEF_FORMAT)
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
      return internals.parse(value, format, error)
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
            name: 'options',
            message: 'expected object that contain date comparison options'
          }
        ],
        validate(value, { error }, { date, options }, { name, operator }) {
          const minuend = dayjs(value)
          const sub = dayjs(date)
          const diffComare = {
            exact: (diff, unit) =>
              comparisonOp.eq(Math.abs(minuend.diff(sub, unit)), diff),
            max: (diff, unit) =>
              comparisonOp.le(Math.abs(minuend.diff(sub, unit)), diff),
            min: (diff, unit) =>
              comparisonOp.ge(Math.abs(minuend.diff(sub, unit)), diff)
          }

          if (!operator(minuend.diff(sub), 0)) {
            return error(`calendardate.${name}`, { date })
          }

          for (const [rule, limit, unit] of internals.normalizeCompareOptions(
            options
          )) {
            if (!diffComare[rule](limit, unit)) {
              return error(`calendardate.${rule}`, { date, limit, unit })
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
          if (!internals.isString(format) || format.trim().length === 0) {
            throw new Error('format expected non-empty string')
          } else if (internals.isString(format) && !args.format(format)) {
            throw new Error(`Invalid formatting string: '${format}'`)
          }

          return this.$_setFlag('format', format)
        }
      },
      ge: {
        args: ['date', 'options'],
        method(date, options) {
          return this.$_addRule({
            name: 'ge',
            method: 'compare',
            args: { date, options },
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
        args: ['date', 'options'],
        method(date, options) {
          return this.$_addRule({
            name: 'le',
            method: 'compare',
            args: { date, options },
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
      trim: {
        method(enabled = true) {
          if (typeof enabled !== 'boolean') {
            throw new Error(`enabled expected boolean, got '${enabled}'`)
          }

          return this.$_setFlag('trim', enabled)
        }
      }
    },
    cast: {
      date: {
        from: internals.isCalendarDate,
        to(value) {
          return new Date(value)
        }
      },
      days: {
        from: internals.isCalendarDate,
        to(value) {
          return internals.diffToNow(value, 'day')
        }
      },
      months: {
        from: internals.isCalendarDate,
        to(value) {
          return internals.diffToNow(value, 'month')
        }
      },
      number: {
        from: internals.isCalendarDate,
        to(value) {
          return new Date(value).getTime()
        }
      },
      quarters: {
        from: internals.isCalendarDate,
        to(value) {
          return internals.diffToNow(value, 'quarter')
        }
      },
      weeks: {
        from: internals.isCalendarDate,
        to(value) {
          return internals.diffToNow(value, 'week')
        }
      },
      years: {
        from: internals.isCalendarDate,
        to(value) {
          return internals.diffToNow(value, 'year')
        }
      }
    }
  }
}

module.exports = joiCalendardate
