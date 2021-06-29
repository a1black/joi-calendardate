import * as Joi from 'joi';

Joi.calendardate().format((value) => [0, 0, 0]);
Joi.calendardate().format('YYYY-MM-DD');
