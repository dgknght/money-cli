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
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
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

export function buildQualifiedName(account, accountsById) {
  const pathSegments = [];
  let current = account;
  while (current) {
    pathSegments.unshift(current.name);
    current = current.parent?.id ? accountsById[current.parent.id] : null;
  }
  return pathSegments.join('/');
}

export function groupAndSortAccounts(accounts, maxDepth) {
  // Build a map of accounts by ID for parent lookup
  const accountsById = accounts.reduce(
    (res, a) => { res[a.id] = a; return res; },
    {}
  );

  // Build qualified names and filter by depth if maxDepth is provided
  const accountsWithPaths = accounts
    .map(account => ({
      account,
      qualifiedName: buildQualifiedName(account, accountsById),
      type: account.type
    }))
    .filter(item => {
      if (!maxDepth) return true;
      const depth = (item.qualifiedName.match(/\//g) || []).length + 1;
      return depth <= maxDepth;
    });

  // Group by type
  const typeOrder = ['asset', 'liability', 'equity', 'income', 'expense'];
  const grouped = typeOrder.reduce(
    (res, type) => { res[type] = []; return res; },
    {}
  );

  accountsWithPaths.forEach(item => {
    const type = item.type.toLowerCase();
    if (grouped[type]) {
      grouped[type].push(item);
    }
  });

  // Sort within each group
  const result = [];
  typeOrder.forEach(type => {
    const group = grouped[type];
    if (group.length > 0) {
      group.sort((a, b) => a.qualifiedName.localeCompare(b.qualifiedName));
      result.push({
        type: type,
        accounts: group.map(item => item.qualifiedName)
      });
    }
  });

  return result;
}

function listAccounts(args) {
  withSpinner('Fetching accounts...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return await fetchAccounts({}, entityId);
  }).then(accounts => {
    const grouped = groupAndSortAccounts(accounts, args.maxDepth);

    grouped.forEach(({type, accounts}) => {
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      console.log(chalk.bold(`\n${typeLabel}`));
      accounts.forEach(qualifiedName => {
        console.log(`  ${qualifiedName}`);
      });
    });
  }).catch(error => {
    console.log(chalk.red('ERROR'), error);
  });
}

export default (yargs) => {
  yargs.command(
    'account-balance <account> [entity]',
    'Manage account information',
    {},
    fetchAndReportBalance
  );
  yargs.command(
    'account-list [entity]',
    'List accounts in an entity',
    (yargs) => {
      return yargs.option('max-depth', {
        description: 'Limit nesting level of accounts',
        type: 'number'
      });
    },
    listAccounts
  );
};
