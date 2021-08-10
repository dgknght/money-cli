import http from 'axios';
import {getOrThrow, config} from '../lib/config.js';
import {withSpinner} from '../lib/util.js';
import {fetchEntityId} from '../lib/entities.js';
import {fetchAccountId} from '../lib/accounts.js';
import {authToken} from '../lib/authentication.js';

async function postTransaction(entityId, trx) {
  const url = `${getOrThrow('apiBaseUri')}/entities/${entityId}/transactions`;
  const response = await http({
    url: url,
    method: 'post',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`
    },
    data: trx
  });
  return response.data
}

async function recordReceipt(args) {
  withSpinner('Posting transaction...', async () => {
    const entityId = await fetchEntityId(args.entity);
    const creditAccountId = await fetchAccountId(args.paymentAccount, entityId);
    const debitAccountId = await fetchAccountId(args.expenseAccount, entityId);
    return await postTransaction(entityId, {
      'transaction-date': args.transactionDate,
      'credit-account-id': creditAccountId,
      'debit-account-id': debitAccountId,
      'quantity': args.quantity,
      'description': args.description
    });
  }).then(result => {
    console.log(`Created the transaction: ${result}`);
  }).catch(error => {
    console.log(`ERROR: ${error}`);
    console.log(error.response.data);
  });
}

export default (yargs) => {
  yargs.command(
    'trans-receipt [entity]',
    'Record a simple transaction',
    {
      d: {
        alias: 'transactionDate',
        default: 'today',
        describe: 'The transaction date'
      },
      p: {
        alias: 'paymentAccount',
        describe: 'The payment (credit) account'
      },
      e: {
        alias: 'expenseAccount',
        describe: 'The expense (debit) account'
      },
      a: {
        alias: ['quantity', 'amount'],
        describe: 'The payment amount'
      },
      l: {
        alias: ['location', 'description'],
        describe: 'The transaction description'
      }
    },
    recordReceipt
  );
};
