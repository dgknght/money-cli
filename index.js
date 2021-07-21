const parseArgs = require ('minimist')

const About = require('./lib/about');
const Accounts = require('./lib/accounts');

const args = parseArgs(process.argv);
const command = args._[2]

switch(command) {
  case 'about':
    About.about();
    break;
  case 'help':
    About.help();
    break;
  case 'account':
    Accounts.exec(args);
    break;
  default:
    if (typeof command === 'undefined') {
      console.log('No command was given');
    } else {
      console.log(`unrecognized command "${command}"`);
    }
    About.help();
};

