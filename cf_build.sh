# !/bin/bash

if [ "$CF_PAGES_BRANCH" == "mainnet" ] 
then
  npm run build-mainnet
elif [ "$CF_PAGES_BRANCH" == "testnet" ] 
then
  npm run build-testnet
fi