# Setup yarn

Setup yarn with cache

## Usage:

### Inputs

- `cacheKeyPrefix` - Cache key prefix. (default: `yarn`)
- `installCommand` - Yarn install command. (default: `yarn install`)

## Example

```yaml
on:
  pull_request:

jobs:
  rspec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v1
        with:
          node-version: 12

      - uses: SonicGarden/setup-yarn-action@v1
        id: setup-yarn

      - name: yarn check
        if: steps.setup-yarn.outputs.cache-hit != 'true'
        run: yarn check
```
