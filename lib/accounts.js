import {getOrThrow} from '../lib/config.js';
import http from 'axios';
import {authToken} from '../lib/authentication.js';
import {withSpinner} from '../lib/util.js';
import {fetchEntityId} from '../lib/entities.js';
import {formatCurrency} from '../lib/util.js';
import chalk from 'chalk';

const positive = chalk.green;
const negative = chalk.black.bgRed;

function accountIndexUrl(entityId) {
  return `${getOrThrow('apiBaseUri')}/entities/${entityId}/accounts`
}

async function fetchAccounts(criteria, entityId) {
  const token = authToken(true);
  const opts = {
    url: accountIndexUrl(entityId),
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    params: criteria
  };

  const res = await http(opts);
  return res.data
}

export const fetchAccountByPath = async (accountPath, entityId) => {
  const segments = accountPath.split(/[/:]/);
  let account = null;
  while(segments.length > 0) {
    const segment = segments.shift();
    const accounts = await fetchAccounts({ name: segment }, entityId);
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
};

export const fetchAccountId = async (accountPath, entityId) => {
  const account = await fetchAccountByPath(accountPath, entityId);
  return account.id;
};

async function fetchAndReportBalance({account, entity}) {
  const act = await withSpinner('Fetching account balance...', async () => {
    const entityId = await fetchEntityId(entity);
    return await fetchAccountByPath(account, entityId);
  });
  let decorate;
  if (act.quantity.d < 0) {
    decorate = negative;
  } else {
    decorate = positive;
  }
  console.log(`${act.name} balance: ${decorate(formatCurrency(act.quantity.d))}`)
};

export default (yargs) => {
  yargs.command(
    'account-balance <account> [entity]',
    'Manage account information',
    {},
    fetchAndReportBalance
  );
};
