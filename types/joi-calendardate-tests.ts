import * as Joi from 'joi';

Joi.calendardate().cast('date');
Joi.calendardate().cast('days');
Joi.calendardate().cast('months');
Joi.calendardate().cast('number');
Joi.calendardate().cast('quarters');
Joi.calendardate().cast('weeks');
Joi.calendardate().cast('years');
Joi.calendardate().eq('today');
Joi.calendardate().eq(new Date());
Joi.calendardate().eq(Joi.ref('date'));
Joi.calendardate().format('YYYY-MM-DD');
Joi.calendardate().ge('today');
Joi.calendardate().ge(new Date());
Joi.calendardate().ge(Joi.ref('date'));
Joi.calendardate().ge('2021-06-28', {exact: '1 month', max: '1 month', min: '1 month'});
Joi.calendardate().gt('2021-06-28');
Joi.calendardate().gt(new Date());
Joi.calendardate().gt(Joi.ref('date'));
Joi.calendardate().gt('2021-06-28', {});
Joi.calendardate().gt('2021-06-28', {exact: '1 month', max: '1 month', min: '1 month'});
Joi.calendardate().le('today');
Joi.calendardate().le(new Date());
Joi.calendardate().le(Joi.ref('date'));
Joi.calendardate().le('2021-06-28', {exact: '1 month', max: '1 month', min: '1 month'});
Joi.calendardate().lt('2021-06-28');
Joi.calendardate().lt(new Date());
Joi.calendardate().lt(Joi.ref('date'));
Joi.calendardate().lt('2021-06-28', {});
Joi.calendardate().lt('2021-06-28', {exact: '1 month', max: '1 month', min: '1 month'});
Joi.calendardate().trim();
Joi.calendardate().trim(true);
