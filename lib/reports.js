import {getOrThrow} from '../lib/config.js';
import http from 'axios';
import CLI from 'clui';
import {authToken} from '../lib/authentication.js';
import {fetchEntityId} from '../lib/entities.js';
import {withSpinner, formatCurrency} from '../lib/util.js';
import chalk from 'chalk';

const positive = chalk.green;
const negative = chalk.black.bgRed;

const Gauge = CLI.Gauge;
const Line = CLI.Line;

async function fetchBudgetMonitors(entityId) {
  const res = await http({
    url: `${getOrThrow('apiBaseUri')}/entities/${entityId}/reports/budget-monitors`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`,
      'Accept': 'application/json'
    }
  });
  return res.data;
}

function monitorGauge(period) {
  const diff = period['prorated-budget'] - period.actual;
  const decorator =  (diff < 0 ? negative : positive);
  return Gauge(
    period.actual,
    period['total-budget'],
    20,
    period['prorated-budget'],
    decorator(formatCurrency(diff))
  );
}

function fetchAndReportBudgetMonitors(args) {
  withSpinner('Fetching budget monitors...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return await fetchBudgetMonitors(entityId);
  }).then(monitors => {
    monitors.forEach(m => {
      new Line()
        .column(m.caption, 20)
        .column(monitorGauge(m.period), 35)
        .column(monitorGauge(m.budget), 35)
        .fill()
        .output();
    });
  }).catch(error => {
    console.log(chalk.red('ERROR'), error);
  });
}

function startOfThisMonth() {
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return firstDay.toISOString().split('T')[0];
}

function startOfThisYear() {
  const firstDay = new Date(new Date().getFullYear(), 0, 1);
  return firstDay.toISOString().split('T')[0];
}

function endOfThisMonth() {
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

function endOfPreviousMonth() {
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
  return lastDay.toISOString().split('T')[0];
}

function toDate(d) {
  switch(d) {
    case 'start-of-this-month':
      return startOfThisMonth();
    case 'end-of-this-month':
      return endOfThisMonth();
    case 'end-of-previous-month':
      return endOfPreviousMonth();
    case 'start-of-this-year':
      return startOfThisYear();
    case 'end-of-this-year':
      return endOfThisYear();
    default:
      return d;
  }
}

async function fetchIncomeStatement(entityId, startArg, endArg) {
  const start = toDate(startArg);
  const end = toDate(endArg);
  const res = await http({
    url: `${getOrThrow('apiBaseUri')}/entities/${entityId}/reports/income-statement/${start}/${end}`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`
    }
  });
  return res.data;
}

function renderReportRow(r, args) {
  if (args.format == 'csv') {
    renderCsvReportRow(r, args);
  } else {
    renderPaddedReportRow(r, args);
  }
}

function renderPaddedReportRow(r, args) {
  const rmax = (args.maxDepth + 1) * 4;
  let lpad = 0, rpad = rmax;
  if (r.style == 'data') {
    lpad = (r.depth + 1) * 2;
    rpad = rmax - (r.depth * 4);
  }
  new Line()
    .padding(lpad)
    .column(r.caption, 40)
    .padding(rpad)
    .column(formatCurrency(r.value.d), 15)
    .fill()
    .output();
}

function renderCsvReportRow(r, _args) {
  console.log(`${r.caption},${r.value.d}`);
}

function acceptReportRow(r, args) {
  if (r.style == 'data') {
    return r.depth <= args.maxDepth && r.value != 0.0;
  } else {
    return true;
  }
}

function fetchAndReportIncomeStatement(args) {
  withSpinner('Fetching income statement...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return await fetchIncomeStatement(
      entityId,
      args.from,
      args.to
    );
  }).then(report => {
    report
      .filter(r => acceptReportRow(r, args))
      .forEach(r => renderReportRow(r, args));
  }).catch(error => {
    console.log(chalk.red('ERROR', error));
    console.dir(error);
  });
}

async function fetchBalanceSheet(entityId, asOfArg) {
  const asOf = toDate(asOfArg);
  const res = await http({
    url: `${getOrThrow('apiBaseUri')}/entities/${entityId}/reports/balance-sheet/${asOf}`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`
    }
  });
  return res.data;
}

function fetchAndReportBalanceSheet(args) {
  withSpinner('Fetching balance sheet...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return await fetchBalanceSheet(
      entityId,
      args.asOf
    );
  }).then(report => {
    report
      .filter(r => acceptReportRow(r, args))
      .forEach(r => renderReportRow(r, args));
  }).catch(error => {
    console.log(chalk.red('ERROR'), error)
  });
}

export default (yargs) => {
  yargs.command(
    'report-monitors [entity]',
    'Render budget monitors',
    {},
    fetchAndReportBudgetMonitors
  );
  yargs.command(
    'report-income [entity]',
    'Render an income statement report',
    {
      f: {
        alias: 'from',
        default: 'start-of-this-year',
        describe: 'The start date for the reporting period'
      },
      t: {
        alias: 'to',
        default: 'end-of-previous-month',
        describe: 'The end date for the reporting period'
      },
      m: {
        alias: 'max-depth',
        default: 0,
        describe: 'The maximum depth of nested accounts to render'
      },
      o: {
        alias: 'format',
        default: 'padded',
        describe: 'The output format: padded (default) or csv'
      }
    },
    fetchAndReportIncomeStatement
  );
  yargs.command(
    'report-balances [entity]',
    'Render an balance sheet report',
    {
      d: {
        alias: 'asOf',
        default: 'end-of-previous-month',
        describe: 'The end date for the reporting period'
      },
      m: {
        alias: 'maxDepth',
        default: 0,
        describe: 'The maximum depth of nested accounts to render'
      },
      o: {
        alias: 'format',
        default: 'padded',
        describe: 'The output format: padded (default) or csv'
      }
    },
    fetchAndReportBalanceSheet
  );
};
