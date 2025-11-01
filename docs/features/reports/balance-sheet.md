# Balance Sheet

- An authenticated user can view a balance sheet for an entity
- The entity can be specified, or the currently selected entity can
  be used.
- The "as-of" date can be specified, but otherwise defaults to the
  end of the previous month.
- A maximum depth can be specified. Zero is the default.
- The formace can be specified.
  - "padded" (the default) is rendered for viewing directly at the command line.
  - "csv" is for opening in a spreadsheet application.
- Dollar amounts are aligned on the decimal point and always include cents.
  E.g.:

  Asset                  $1,500.00
    Checking           $1,000.00
    Savings              $500.00
  Liability                $200.00
    Credit Card          $200.00
  Equity                 $1,300.00
    Retained Earnings $1,3000.00
