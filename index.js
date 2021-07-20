const parseArgs = require ('minimist')

const About = require('./lib/about');

const args = parseArgs(process.argv);
const command = args._[2]

switch(command) {
  case 'about':
    About.about();
    break;
  case 'help':
    About.help();

  default:
    console.log(`unrecognized command "${command}"`);
};

