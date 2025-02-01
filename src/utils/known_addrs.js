import { reduceText } from '.'

export const pools = {
  "xel:fjqn40v9q8ghystrnpzfczzuuylj9wdcs6gegqe76x970g3xy4kqq6gk3d4": {
    name: `XelPool`,
    link: `https://xelpool.com/`,
  },
  "xel:ys4peuzztwl67rzhsdu0yxfzwcfmgt85uu53hycpeeary7n8qvysqmxznt0": {
    name: `K1Pool`,
    link: `https://k1pool.com/pool/xel`,
  },
  "xel:ntpjg269f0efkvft8rckyqd0dwq480jphngy0fujxal7ng6qmfxqqnp3r5l": {
    name: `Baikalmine`,
    link: `https://baikalmine.com/pools/pplns/xel/home`,
  },
  "xel:vzpn3gvs0y2pvrqh879f9xheqf0xhl40d2c54ecu45y2yflcneqqqc0dm33": {
    name: `666Pool`,
    link: `https://www.666pool.com/#/pool-data?coin=Xelis`,
  },
  "xel:kemepw8e6me6r7ezq063rz8f9gh0prnrt3j3kee3nj52rp5zmadqq4wf5y3": {
    name: `Vipor`,
    link: `https://vipor.net/mine/xelis`,
  },
  "xel:cm6qlldx6vs9t05z2twzf7vkk4797rt8lxr93w9ctyc7nvx7y9uqqqeglul": {
    name: `Kryptex`,
    link: `https://pool.kryptex.com/xel`,
  },
  "xel:ee48xuktxn0kxh3r6p0hw9x68adcm0dqf4c04hptu0qhegcnldusqr62y47": {
    name: `HeroMiners`,
    link: `https://xelis.herominers.com/`,
  },
  "xel:4r46fyhkhltjacaaqkr3vxhldf0stwpm3a8uku2ukztk74t88gpsqdlfua7": {
    name: `HeroMiners`,
    link: `https://xelis.herominers.com/`,
  },
  "xel:ufyp55hz5uzxk3d5m4k9h3ahe4k604hthkndt22w4hxmc877lftqqsq5h6n": {
    name: `SoloPool`,
    link: `https://xel.solopool.org/`,
  },
  "xel:eg2aasm87vnj06jh9c5jwudsw3v086zwwdz0kje0h6vvshu3d56squ32t7m": {
    name: `WoolyPooly`,
    link: `https://woolypooly.com/`,
  },
  "xel:wzscp02r4vug8wqpd0fzayxa5l4d2s63sfulad3anwtcvgru23eqqlc74yq": {
    name: `Xelski`,
    link: `https://xelskipool.xyz/`,
  },
  "xel:cc6qh3px26tlq3zp2tmf4lku7t3edhk4kg8e0eskjvq05h9yv9tqqczqh59": {
    name: `Suprnova`,
    link: `https://xel.suprnova.cc/`,
  },
  "xel:pj6lg4dz7hwc4ylpsy9c73d2ergqehu8yuc70zdgqqjkp0zhg4vqq8lkyhk": {
    name: `ExPool`,
    link: `https://expool.net/pool/xelis/`,
  },
  "xel:zmxrlpt55tcp450008teu28enz36lwxmwc8tfhxfdw5u5dg33uesqvjz4dt": {
    name: `MinerLab`,
    link: `https://xelis.minerlab.io/`
  }
}

export const exchanges = {
  "xel:qcd39a5u8cscztamjuyr7hdj6hh2wh9nrmhp86ljx2sz6t99ndjqqm7wxj8": {
    name: "TradeOgre",
    link: "https://tradeogre.com/"
  },
  "xel:23hkwe3gvqtjvplttd5ftvf8mepagj3n0rqpw8kp7kn0hwdmmdqsqsqr8p6": {
    name: "Exbitron",
    link: "https://exbitron.com/"
  },
  "xel:kprzhxdp594m5zczayy9d8cxg3kqu978mwqf9hh8qgume3njc97sqqyhejh": {
    name: "Xeggex",
    link: "https://xeggex.com/"
  },
  "xel:mre0qr55dc8kllhyl9q52ssay6sx48sksahrajq5cccux3j9ku8sql8frhn": {
    name: "XeggeX - Hot Wallet",
    link: "https://xeggex.com/"
  },
  "xel:empagph7k0hmlgzd9vev84cxt9nz52375cftmvkdw56vwa8zhahqqselwez": {
    name: "NonKYC",
    link: "https://nonkyc.io/"
  },
  "xel:ht09c5z4h59nra9hdnnmyyjxyu4ac4dncwfxygrjxps9twv4apwqq3pvzs8": {
    name: "NonKYC - Hot Wallet",
    link: "https://nonkyc.io/"
  },
  "xel:lmkvzyslkwg6qslmkfrsq3rjc67lzuqhqyt7lelf0wy96n0ej3usqaeeawa": {
    name: "CoinEx",
    link: "https://www.coinex.com"
  },
  "xel:aee43hxxe8tzl0lrjq25dsj8rhvev2jseeyk6xydx9ltuj4fyezqqcmg5zq": {
    name: "MEXC",
    link: "https://www.mexc.com/"
  },
  "xel:zeqtkurmcucg79tleqqhcv776sja2rss0ydxn2cy6a5xv9lauvyqq5h2lpk": {
    name: "Biconomy",
    link: "https://biconomy.com/"
  },
  "xel:4cqe028p90z25yp2594j63jlmz8lvuj2n5ujzeatxvp5vqe9v4tqqqf6mhw": {
    name: "XT",
    link: "https://www.xt.com/"
  }
}

export const misc = {
  "xel:ns5gar4crnhfgj6llyd7x4tfwm0nglkuvqcmjsdz4xdnt90tjf6sqdsm5nx": {
    name: "Faucet",
    link: "http://faucet.xelis.io",
  },
  "xel:qtlxcsz58wjdf9ahyfnpym3p0hgyre6cp26urzcppnc65knfdyzsqf845ep": {
    name: "Tip Bot",
    link: ""
  }
}

export const addrs = { ...pools, ...exchanges, ...misc }

export const formatAddr = (addr) => {
  if (pools[addr]) {
    return pools[addr].name
  }

  if (exchanges[addr]) {
    return exchanges[addr].name
  }

  if (misc[addr]) {
    return misc[addr].name
  }

  return reduceText(addr, 0, 7)
}

export const formatMiner = (miner) => {
  if (pools[miner]) {
    return pools[miner].name
  }

  return reduceText(miner, 0, 7)
}
