import parseArgs from 'minimist';

import About from './lib/about.js';
import accounts from './lib/accounts.js';
import config from './lib/config.js';
import auth from './lib/authentication.js'

const args = parseArgs(process.argv);
const command = args._[2]

const handlers = {
  'account': accounts,
  'auth': auth,
  'config': config,
  'about': About.about,
  'help': About.help
};

const handler = handlers[command];
if (handler != null) {
  handler(args);
} else {
  if (typeof command === 'undefined') {
    console.log('No command was given');
  } else {
    console.log(`unrecognized command "${command}"`);
  }
  About.help();
}
