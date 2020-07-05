import format from 'date-fns/format';
import chalk from 'chalk';

export const getStyledErrorMsg = (msg: string, inputValue?: string) =>
  chalk`🍎 {red.bold ERROR:} {yellow ${msg}}{red.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;

export const getStyledCautionMsg = (msg: string, inputValue?: string) =>
  chalk`${formatDate()} - 🍋 {yellow.bold Caution:} {magenta ${msg}}{yellow.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;

export const getStyledInfoMsg = (msg: string, inputValue?: string) =>
  chalk`${formatDate()} - 🥬 {green.bold INFO} {yellow ${msg}}{green.bold ${
    inputValue ? ` (${inputValue})}` : ''
  }}`;

export const getStyledLogMsg = (msg: string, inputValue?: string) =>
  chalk`${formatDate()} - 🥑 {cyan.bold LOG} {green ${msg}}{yellow.bold ${
    inputValue ? ` (${inputValue})}` : ''
  }}`;

const formatDate = () => format(Date.now(), 'yyyy-MM-dd HH:mm:ss');
