const chalk = require('chalk');
const figlet = require('figlet');

module.exports = {
  about: () => {
    console.log(
      chalk.green(
        figlet.textSync('money-cli')
      )
    );
  },
  help: () => {
    console.log("HELP");
    console.log("  Available commands:");
    console.log("    about - Get information about the command line application");
  }
};
