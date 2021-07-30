import chalk from 'chalk';
import Configstore from 'configstore';
export const config = new Configstore('money-cli');

export const getOrThrow = (name) => {
  const result = config.get(name);
  if (typeof result === 'undefined') {
    throw new Error(`No configuration value for ${name}`);
  }
  return result;
};

function set(args) {
  config.set(args.name, args.value);
  console.log(`Set configuration ${chalk.cyan(args.name)} to ${chalk.green(args.value)}`);
}

function unset(args) {
  config.delete(args.name);
  console.log(`Unset configuration ${chalk.cyan(args.name)}`);
}

function show() {
  console.log(config.all);
}

let name, value;
export default (yargs) => {
  yargs.command(
    'config',
    'Shows the current configuration',
    {},
    show
  );
  yargs.command(
    'config-unset <name>',
    'Unset the specified configuration value',
    {},
    unset
  );
  yargs.command(
    'config-set <name> <value>',
    'Set the specification configuration value',
    {},
    set
  );

  // switch(args._[3]) {
  //   case 'help':
  //     console.log("HELP - config");
  //     console.log("  With no command, view the current configuration");
  //     console.log("  Available commands:");
  //     console.log("    set -n|--name -v|--value - Set a configuration value");
  //     console.log("    unset -n|--name          - Remove a configuration value");
  //     break;
  //   default:
  //     if (typeof command === 'undefined') {
  //       console.log(config.all);
  //     } else {
  //       console.log(`unrecognized command "${command}"`);
  //     }
  // };
};
