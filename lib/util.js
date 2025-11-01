import clui from 'clui';
const Spinner = clui.Spinner;

export const withSpinner = async (message, fn) => {
  const spinner = new Spinner(message);
  let result = null;
  try {
    spinner.start();
    result = await fn();
  } finally {
    spinner.stop();
  }
  return result;
};

export const formatCurrency = (amount, currency='USD', locale='en-US') => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  });
  return formatter.format(amount);
};

export const formatNumber = (amount, decimalPlaces=2, locale='en-US') => {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimalPlaces }).format(amount);
};
