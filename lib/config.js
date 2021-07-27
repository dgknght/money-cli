import Configstore from 'configstore';
export const config = new Configstore('money-cli');

let name, value;
export default (args) => {
  switch(args._[3]) {
    case 'set':
      name = args.name || args.n;
      value = args.value || args.v;
      config.set(name, value);
      console.log(`Set configuration "${name}" to "${value}"`);
      break;
    case 'unset':
      name = args.name || args.n;
      config.delete(name, value);
      console.log(`Unset configuration "${name}"`);
      break;
    case 'help':
      console.log("HELP - config");
      console.log("  With no command, view the current configuration");
      console.log("  Available commands:");
      console.log("    set -n|--name -v|--value - Set a configuration value");
      console.log("    unset -n|--name          - Remove a configuration value");
      break;
    default:
      if (typeof command === 'undefined') {
        console.log(config.all);
      } else {
        console.log(`unrecognized command "${command}"`);
      }
  };
};
