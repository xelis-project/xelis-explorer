import { reduceText } from '.'

export const pools = {
  "xel:fjqn40v9q8ghystrnpzfczzuuylj9wdcs6gegqe76x970g3xy4kqq6gk3d4": "XelPool",
  "xel:ys4peuzztwl67rzhsdu0yxfzwcfmgt85uu53hycpeeary7n8qvysqmxznt0": "K1Pool",
  "xel:ntpjg269f0efkvft8rckyqd0dwq480jphngy0fujxal7ng6qmfxqqnp3r5l": "Baikalmine",
  "xel:vzpn3gvs0y2pvrqh879f9xheqf0xhl40d2c54ecu45y2yflcneqqqc0dm33": "666Pool",
  "xel:kemepw8e6me6r7ezq063rz8f9gh0prnrt3j3kee3nj52rp5zmadqq4wf5y3": "Vipor",
  "xel:cm6qlldx6vs9t05z2twzf7vkk4797rt8lxr93w9ctyc7nvx7y9uqqqeglul": "Kryptex",
  "xel:ee48xuktxn0kxh3r6p0hw9x68adcm0dqf4c04hptu0qhegcnldusqr62y47": "HeroMiners"
}

export const formatMiner = (miner) => {
  if (pools[miner]) {
    return pools[miner]
  }

  return reduceText(miner, 0, 7)
}