import Netrc from 'netrc';
import chalk from 'chalk';
import {config} from '../lib/config.js';

function fetchHost() {
  const baseUri = config.get('apiBaseUri');
  if (typeof baseUri === 'string' && baseUri.length > 0) {
    const uri = new URL(baseUri);
    return uri.host
  }
  return null;
}

function save(args) {
  const host = fetchHost();
  if (typeof host === 'string' && host.length > 0) {
    const netrc = Netrc();
    netrc[host] = {
      login: args.token,
      password: 'token auth'
    }
    Netrc.save(netrc);
    console.log("Auth token saved successfully.");
  } else {
    console.log("Unable to determine the host");
  }
}

export const authToken = (throwOnAbsence=false) => {
  const host = fetchHost();
  if (typeof host === 'string' && host.length > 0) {
    const netrc = Netrc();
    if (typeof netrc[host] !== 'undefined') {
      return netrc[host].login;
    }
  }
  if (throwOnAbsence) {
    throw new Error("No auth token available");
  } else {
    return null;
  }
}

export default (yargs) => {
  yargs.command(
    'auth-save <token>',
    'Save the specified token',
    {},
    save
  );
  yargs.command(
    'auth-show',
    'Show the auth token',
    {},
    () => console.log(`Authentication token: ${chalk.green(authToken())}`)
  );
};
