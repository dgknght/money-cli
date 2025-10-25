# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

money-cli is a Node.js CLI application for interacting with the clj-money API
(a double-entry accounting system). It uses yargs for command parsing and
communicates with a remote API via axios.

## Development Commands

```bash
# Run the CLI in development
node . <command> [args]

# Example commands
node . account-balance <account> [entity]
node . config-set apiBaseUri https://api.example.com
node . auth-save <token>

# Show help
node . --help
```

## Architecture

### Command Registration Pattern

Commands are organized in modular files under `lib/` and registered via a
function export pattern:

- Each command module exports a default function that receives the yargs parser
- The function registers one or more commands using `yargs.command()`
- `index.js` imports all command modules and iterates through them to register commands

Example from `lib/accounts.js`:
```javascript
export default (yargs) => {
  yargs.command('account-balance <account> [entity]', 'description', {}, handler);
};
```

### Authentication Flow

Authentication uses `.netrc` for token storage:
1. User obtains token from clj-money API (external to this CLI)
2. Token is saved via `auth-save <token>` command
3. Token is stored in `.netrc` file keyed by API host (extracted from `apiBaseUri` config)
4. `authToken()` in `lib/authentication.js` retrieves token from `.netrc` for API calls

### Configuration

Uses `configstore` package for persistent configuration:
- Config stored in system-specific location managed by configstore
- Required config: `apiBaseUri` (API base URL)
- Optional config: `currentEntityId` (auto-set by entity resolution)
- Access via `config.get()`, `config.set()`, or `getOrThrow()` (throws if missing)

### Entity Resolution

The `fetchEntityId()` function in `lib/entities.js` handles entity lookup:
- If no entity name provided, uses `currentEntityId` from config
- Otherwise fetches all entities from API and finds match by name
- Stores resolved entity ID in config for future use
- This allows omitting entity argument after first use

### Account Path Resolution

Accounts can be specified by path (e.g., "Checking", "Expenses:Groceries", "Assets/Bank/Checking"):
- `fetchAccountByPath()` splits path by `:` or `/` delimiters
- Traverses path segments sequentially, querying API for each segment
- Returns the final account in the path
- Used by commands needing account IDs (balance queries, transactions)

### Report Rendering

Reports support two output formats (controlled by `--format` flag):
1. **padded** (default): Uses `clui.Line` for formatted columns with proper indentation based on account depth
2. **csv**: Simple comma-separated output for data processing

Reports accept `--maxDepth` to control nested account visibility and filter out zero-value accounts.

### Utility Patterns

`lib/util.js` provides:
- `withSpinner()`: Wraps async operations with a CLI spinner for user feedback
- `formatCurrency()`: Formats amounts using Intl.NumberFormat
- `formatNumber()`: Formats numbers with specified decimal places

Color coding with chalk:
- Green for positive values/balances
- Red background for negative values/over-budget items

## Key Files

- `index.js`: Entry point, command registration orchestration
- `lib/config.js`: Configuration management (configstore wrapper)
- `lib/authentication.js`: Auth token storage/retrieval via .netrc
- `lib/entities.js`: Entity resolution and caching
- `lib/accounts.js`: Account lookup and balance display
- `lib/reports.js`: Budget monitors, income statements, balance sheets
- `lib/transactions.js`: Transaction posting
- `lib/util.js`: Shared utilities (spinner, formatting)

## Common Patterns

1. **Command handlers** are async functions that:
   - Use `withSpinner()` for async operations
   - Call `fetchEntityId()` to resolve entity
   - Make authenticated HTTP requests with `authToken(true)`
   - Use chalk for colored output
   - Catch errors and display with `chalk.red('ERROR')`

2. **API calls** use axios with:
   - `Authorization: Bearer ${token}` header
   - URL constructed from `apiBaseUri` config + path
   - HTTP method specified explicitly

3. **Error handling**: Most commands use `.catch()` to log errors to console
   rather than allowing stack traces to propagate
