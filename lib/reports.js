import {getOrThrow} from '../lib/config.js';
import http from 'axios';
import CLI from 'clui';
import {authToken} from '../lib/authentication.js';
import {fetchEntityId} from '../lib/entities.js';
import {withSpinner, formatCurrency} from '../lib/util.js';
import chalk from 'chalk';
import {format} from 'date-fns';

const positive = chalk.green;
const negative = chalk.black.bgRed;

const Gauge = CLI.Gauge;
const Line = CLI.Line;

async function fetchBudgetMonitors(entityId) {
  const res = await http({
    url: `${getOrThrow('apiBaseUri')}/entities/${entityId}/reports/budget-monitors`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`
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

async function fetchAndReportBudgetMonitors(args) {
  const monitors = await withSpinner('Fetching budget monitors...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return await fetchBudgetMonitors(entityId);
  });
  monitors.forEach(m => {
    let line = new Line()
      .column(m.caption, 20)
      .column(monitorGauge(m.period), 35)
      .column(monitorGauge(m.budget), 35)
      .fill()
      .output();
  });
}

function parseDate(value, ifAbsent) {
  if (typeof value === 'string') {
    switch(value) {
      case 'start-of-this-year':
        return Date.parse('1/1/2021');
      case 'end-of-previous-month':
        return Date.parse('6/30/2021');
      default:
        return Date.parse(value);
    }
  } else if (typeof value === 'Date') {
    return value;
  } else {
    return parseDate(ifAbsent);
  }
}

function serializeDate(date) {
  return format(date, 'yyyy-MM-dd');
}

async function fetchIncomeStatement(entityId, start, end) {
  const res = await http({
    url: `${getOrThrow('apiBaseUri')}/entities/${entityId}/reports/income-statement/${serializeDate(start)}/${serializeDate(end)}`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`
    }
  });
  return res.data;
}

function renderReportRow(r) {
  let line = new Line()
    .padding((r.style == 'data') ? ((r.depth * 2) + 2) : 0)
    .column(r.caption, 40)
    .padding(4 - ((r.style == 'data') ? ((r.depth * 2) + 4) : 0))
    .column(formatCurrency(r.value), 15)
    .fill()
    .output();
}

function acceptReportRow(r) {
  if (r.style == 'data') {
    return r.depth == 0 && r.value != 0.0;
  } else {
    return true;
  }
}

async function fetchAndReportIncomeStatement(args) {
  const report = await withSpinner('Fetching income statement...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return await fetchIncomeStatement(
      entityId,
      parseDate(args.from, '1/1/2021'),
      parseDate(args.to, '6/30/2021')
    );
  });
  report
    .filter(r => acceptReportRow(r))
    .forEach(r => renderReportRow(r));
}

async function fetchBalanceSheet(entityId, asOf) {
  const res = await http({
    url: `${getOrThrow('apiBaseUri')}/entities/${entityId}/reports/balance-sheet/${serializeDate(asOf)}`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`
    }
  });
  return res.data;
}

async function fetchAndReportBalanceSheet(args) {
  const report = await withSpinner('Fetching balance sheet...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return await fetchBalanceSheet(
      entityId,
      parseDate(args.asOf, '6/30/2021')
    );
  });
  report
    .filter(r => acceptReportRow(r))
    .forEach(r => renderReportRow(r));
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
      }
    },
    fetchAndReportBalanceSheet
  );
};
