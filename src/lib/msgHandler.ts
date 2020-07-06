import format from 'date-fns/format';
import chalk from 'chalk';

const styledInputValue = (inputValue?: string) =>
  inputValue ? chalk`{bold (${inputValue})}` : '';

export const getStyledErrorMsg = (msg: string, inputValue?: string) =>
  chalk`${formatDate()} - 🍎 {red.bold ERROR:} {yellow ${msg}} {red ${styledInputValue(
    inputValue,
  )}}`;

export const getStyledCautionMsg = (msg: string, inputValue?: string) =>
  chalk`${formatDate()} - 🍋 {yellow.bold Caution:} {magenta ${msg}} {yellow ${styledInputValue(
    inputValue,
  )}}`;

export const getStyledInfoMsg = (msg: string, inputValue?: string) =>
  chalk`${formatDate()} - 🥬 {green.bold INFO} {yellow ${msg}} {green ${styledInputValue(
    inputValue,
  )}}`;

export const getStyledLogMsg = (msg: string, inputValue?: string) =>
  chalk`${formatDate()} - 🥑 {cyan.bold LOG} {green ${msg}} {cyan ${styledInputValue(
    inputValue,
  )}}`;

const formatDate = () => format(Date.now(), 'yyyy-MM-dd HH:mm:ss');
