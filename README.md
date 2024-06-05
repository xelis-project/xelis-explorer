# XELIS Explorer

Real-time Blockchain Explorer for XELIS using JavaScript and WebSocket.

<https://explorer.xelis.io>  

- Real-time statistics with WebSockets.
- Navigate all blocks of the entire blockchain (if node isn't pruned).
- Block page.
- Transaction page.
- Accounts list page.
- Account history page.
- Live mempool.
- BlockDAG viewer.

Testnet: <https://testnet-explorer.xelis.io>

## Development

For development this app uses the `g45-react` package to bundle and serve app.
Simply run `npm start` to build, start the dev server and watch modified files automatically.
For environment variables, it will create a `bundler-define.json` file and check in the `env` folder.  

## Production

The app is served by cloudflare and uses `cf_build.sh` to build from a specific branch.
Pushing branch `testnet-pages` or `mainnet-pages` will automatically build and deploy to cloudflare.

To build for nodejs run `npm run build-prod:node`.
