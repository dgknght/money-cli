#!/usr/bin/env node

import About from './lib/about.js';
import accounts from './lib/accounts.js';
import config from './lib/config.js';
import auth from './lib/authentication.js'
import reports from './lib/reports.js';
import transactions from './lib/transactions.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const parser = yargs(hideBin(process.argv))
  .usage('$0 <command> [<subcommand> [<args>]]')
  .scriptName('money')
  .help();
parser.command(
  'about',
  'Get information about the application and the developer.',
  {},
  About.about
);
[
  accounts,
  auth,
  config,
  reports,
  transactions
].forEach(m => m(parser));
parser.argv
