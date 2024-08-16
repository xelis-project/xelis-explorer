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
  "xel:ufyp55hz5uzxk3d5m4k9h3ahe4k604hthkndt22w4hxmc877lftqqsq5h6n": {
    name: `SoloPool`,
    link: `https://xel.solopool.org/`,
  },
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
  "xel:empagph7k0hmlgzd9vev84cxt9nz52375cftmvkdw56vwa8zhahqqselwez": {
    name: "NonKYC",
    link: "https://nonkyc.io/"
  },
  "xel:lmkvzyslkwg6qslmkfrsq3rjc67lzuqhqyt7lelf0wy96n0ej3usqaeeawa": {
    name: "CoinEx",
    link: "https://www.coinex.com"
  }
}

export const addrs = { ...pools, ...exchanges }

export const formatAddr = (addr) => {
  if (pools[addr]) {
    return pools[addr].name
  }

  if (exchanges[addr]) {
    return exchanges[addr].name
  }

  return reduceText(addr, 0, 7)
}

export const formatMiner = (miner) => {
  if (pools[miner]) {
    return pools[miner].name
  }

  return reduceText(miner, 0, 7)
}