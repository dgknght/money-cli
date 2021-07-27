import Netrc from 'netrc';
import {config} from '../lib/config.js';

function fetchHost() {
  const baseUri = config.get('apiBaseUri');
  if (typeof baseUri === 'string' && baseUri.length > 0) {
    const uri = new URL(baseUri);
    return uri.host
  }
  return null;
}

function save(authToken) {
  const host = fetchHost();
  if (typeof host === 'string' && host.length > 0) {
    const netrc = Netrc();
    netrc[host] = {
      login: authToken,
      password: 'token auth'
    }
    Netrc.save(netrc);
    console.log("Auth token saved successfully.");
  } else {
    console.log("Unable to determine the host");
  }
}

export const authToken = () => {
  const host = fetchHost();
  if (typeof host === 'string' && host.length > 0) {
    const netrc = Netrc();
    if (typeof netrc[host] !== 'undefined') {
      return netrc[host].login;
    }
  }
  return null;
}

export default (args) => {
  switch(args._[3]) {
    case 'save':
      save(args._[4]);
      break;
    case 'show':
      console.log("Authentication token:", authToken());
      break;
  };
};
