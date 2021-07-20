const {Spinner} = require('clui');

function fetchBalance(accountName) {
  return new Promise(resolve => {
    setTimeout(() => resolve(100.0), 2000);
  });
}

async function fetchAndReportBalance(accountName) {
  const spinner = new Spinner('Fetching account balance...');
  spinner.start();
  const balance = await fetchBalance(accountName);
  spinner.stop();
  console.log(`${accountName} balance: ${balance}`);
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
