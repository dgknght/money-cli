import chalk from 'chalk';
import figlet from 'figlet';

export default {
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
    console.log("    about    - Get information about the command line application");
    console.log("    accounts - Get account information");
    console.log("    config   - Get or set configuration values");
    console.log("    reports  - View basic reports");
  }
};
