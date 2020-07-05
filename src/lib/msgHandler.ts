import chalk from 'chalk';

export const getStyledErrorMsg = (msg: string, inputValue?: string) =>
  chalk`🍎 {red.bold ERROR:} {yellow.bold ${msg}}{red.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;

export const getStyledCautionMsg = (msg: string, inputValue?: string) =>
  chalk`🍋 {yellow.bold ERROR:} {magenta.bold ${msg}}{yellow.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;

export const getStyledInfoMsg = (msg: string, inputValue?: string) =>
  chalk`🥬 {green.bold INFO} {yellow.bold ${msg}}{green.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;
