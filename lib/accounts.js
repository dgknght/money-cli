import {config} from '../lib/config.js';
import http from 'axios';
import clui from 'clui';
import {authToken} from '../lib/authentication.js';
const Spinner = clui.Spinner;


// TODO: Move this to a shared location
async function withSpinner(message, fn) {
  const spinner = new Spinner(message);
  spinner.start();
  const result = await fn()
  spinner.stop();
  return result;
}

function accountIndexUrl() {
  const apiBaseUri = config.get('apiBaseUri');
  if (typeof apiBaseUri != 'string') {
    throw new Error("No configuration setting for apiBaseUri");
  }
  const entityId = 8; //TODO: Figure out how to configure this and/or pass it in
  return `${apiBaseUri}/entities/${entityId}/accounts`
}

async function fetchAccounts(criteria) {
  const token = authToken();
  if (typeof token != 'string') {
    throw new Error("No auth token available");
  }
  const opts = {
    url: accountIndexUrl(criteria),
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    params: criteria
  };

  const res = await http(opts);
  return res.data
}

async function fetchAccountByPath(accountPath) {
  const segments = accountPath.split(/[\/:]/);
  let account = null;
  while(segments.length > 0) {
    const segment = segments.shift();
    const accounts = await fetchAccounts({ name: segment });
    if (accounts.length == 0) {
      throw new Error(`No account found with name "${segment}"`);
    } else {
      account = accounts[0];
    }
  }
  if (account == null) {
    throw new Error(`No account found with path ${accountPath}`);
  }
  return account;
}

async function fetchAndReportBalance(accountPath) {
  withSpinner('Fetching account balance...', () => {
    const account = fetchAccountByPath(accountPath).then(account => {
      console.log(`${account.name} balance: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.quantity)}`)
    }).catch(error => {
      console.log(`Unable to fetch the account balance: ${error}`);
      console.log(error.stack);
    });
  });
};

export default (args) => {
  switch(args._[3]) {
    case 'balance':
      fetchAndReportBalance(args.a);
      break;
  };
};
