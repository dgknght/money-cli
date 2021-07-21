const http = require('axios');
const querystring = require('querystring');
const {Spinner} = require('clui');

// TODO: Move this to a shared location
async function withSpinner(message, fn) {
  const spinner = new Spinner(message);
  spinner.start();
  const result = await fn()
  spinner.stop();
  return result;
}

function accountIndexUrl(criteria) {
  const apiBaseUri = "http://lvh.me:5000/api"; //TODO: Figure out how to manage configuration
  const entityId = 8; //TODO: Figure out how to configure this and/or pass it in
  return `${apiBaseUri}/entities/${entityId}/accounts?${querystring.stringify(criteria)}`
}

async function fetchAccounts(criteria) {
  const url = accountIndexUrl(criteria);
  res = await http.get(url)
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
      console.log(`${account.name} balance: ${account.balance}`)
    }).catch(error => {
      console.log(`Unable to fetch the account balance: ${error}`);
    });
  });
};

module.exports = {
  exec: (args) => {
    switch(args._[3]) {
      case 'balance':
        fetchAndReportBalance(args.a);
        break;
    };
  }
};
