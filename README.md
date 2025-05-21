# envdiff-docs

## Overview

EnvDiff Docs is a Google Apps Script project that converts JSON reports generated
by the EnvDiff tool into well‑formatted Google Docs. The add-on provides a menu
within Google Docs to import a report, then parses metadata, definitions,
operation results and diff information to create a structured document.

## Development

1. Install dependencies:
   ```sh
   npm ci
   ```
2. Run the linter:
   ```sh
   npm run lint
   ```
3. Format the code:
   ```sh
   npm run format
   ```
4. Run unit tests:
   ```sh
   npm test
   ```
5. Build the project:
   ```sh
   npm run build
   ```
6. Deploy to a Google Apps Script project using [clasp](https://github.com/google/clasp):
   ```sh
   npm run deploy
   ```
   Use `npm run deploy:prod` to push to production.

## License

This project is licensed under the Apache 2.0 License.
