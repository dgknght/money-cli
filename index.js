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
    console.log(`unrecognized command "${command}"`);
};

