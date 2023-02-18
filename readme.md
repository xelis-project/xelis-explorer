# Xelis Explorer

Official Explorer for Xelis Blockhain.  
Realtime statistics with web sockets.  
List all blocks of the entire blockchain.  

<https://explorer.xelis.io>  
<https://testnet-explorer.xelis.io>  
<https://dev-explorer.xelis.io>  

## Scripts

`npm start`  
Use this for development.  
Run http server, watch and build files automatically.  

`npm run build:local_dev`  
Build js, css files to `/public/dist` with esbuild.  
Use `npm run build:dev` for cf dev branch (keeps sourcemap).  
Use `npm run build:testnet` for cf testnet branch (keeps sourcemap).  
Use `npm run build:mainnet` for cf mainnet branch (remove sourcemaps and minify code).  
