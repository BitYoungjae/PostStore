import chalk from 'chalk';

export const getStyledErrorMsg = (msg: string, inputValue?: string) =>
  chalk`🌶{red.bold ERROR:} {yellow.bold ${msg}}{green.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;

export const getStyledInfoMsg = (msg: string, inputValue?: string) =>
  chalk`🥬{blue.bold INFO} {green.bold ${msg}}{yellow.bold ${
    inputValue ? ` (${inputValue})` : ''
  }}`;
