import { useMemo, useState } from 'react'
import { useLang } from 'g45-react/hooks/useLang'
import prettyMs from 'pretty-ms'
import { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import Age from 'g45-react/components/age'

import { useNetworkInfo } from '../home'
import { BLOCK_TIME, formatDifficulty, formatHashRate, formatXelis } from '../../utils'
import PageTitle from '../../layout/page_title'

import style from './style'

function MiningCalculator() {
  const { info, loadInfo } = useNetworkInfo()
  const { t } = useLang()

  const [hashRate, setHashRate] = useState()
  const [hashRateUnit, setHashRateUnit] = useState(1000) // KH/s
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const rewardData = useMemo(() => {
    if (!info && !hashRate) return {}

    const timeUntilBlock = ((info.difficulty / BLOCK_TIME) / ((hashRate || 1) * hashRateUnit)) * BLOCK_TIME
    const rewardPerHour = info.miner_reward / (timeUntilBlock / 60 / 60)

    return {
      timeUntilBlock, // in seconds
      rewardPerHour: rewardPerHour,
      rewardPerDay: rewardPerHour * 24,
      rewardPerWeek: rewardPerHour * 24 * 7,
      rewardPerMonth: rewardPerHour * 24 * 30,
      rewardPerYear: rewardPerHour * 24 * 365,
    }
  }, [info, hashRate, hashRateUnit])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: () => {
      loadInfo()
      setLastUpdate(Date.now())
    }
  }, [])

  return <div>
    <PageTitle title={t(`Mining Calculator`)} />
    <div>
      <div className={style.box.container}>
        <div className={style.box.networkHashrate.container} title={t(`Last hashrate update.`)}>
          <div>{t(`Network hashrate`)}</div>
          <div className={style.box.networkHashrate.value}>
            <div><Age ssrKey="hashrate-update" timestamp={lastUpdate} update /></div>
            <div>{formatHashRate(info.difficulty)}</div>
          </div>
        </div>
        <div className={style.box.inputCalculator}>
          <input type="text" onChange={(e) => {
            const value = parseFloat(e.target.value)
            setHashRate(isNaN(value) ? null : value)
          }} placeholder={t(`Your hashrate`)} />
          <select value={hashRateUnit} onChange={(e) => {
            setHashRateUnit(parseInt(e.target.value))
          }}>
            <option value="1"><div>H/s</div></option>
            <option value="1000">KH/s</option>
            <option value="1000000">MH/s</option>
            <option value="1000000000">GH/s</option>
            <option value="1000000000000">TH/s</option>
          </select>
        </div>
      </div>
      <div className={style.miningReward.container}>
        {hashRate != null && <>
          <div className={style.miningReward.result}>
            {t(`With {}H/s, you can probably find a block every`, [formatDifficulty(hashRate * hashRateUnit)])} <span className={style.miningReward.timeBlock}>{prettyMs(rewardData.timeUntilBlock * 1000 || 0, { compact: true })}</span>.
          </div>
          <div className={style.miningReward.specify}>
            {t(`More precisely every {} with each block mining reward at {}.`, [prettyMs(rewardData.timeUntilBlock * 1000 || 0), formatXelis(info.miner_reward)])}
          </div>
          <div>{t(`This represent around:`)}</div>
          <ul className={style.miningReward.timeReward}>
            <li>{formatXelis(rewardData.rewardPerHour)} / {t(`hour`)}</li>
            <li>{formatXelis(rewardData.rewardPerDay)} / {t(`day`)}</li>
            <li>{formatXelis(rewardData.rewardPerWeek)} / {t(`week`)}</li>
            <li>{formatXelis(rewardData.rewardPerMonth)} / {t(`month`)}</li>
            <li>{formatXelis(rewardData.rewardPerYear)} / {t(`year`)}</li>
          </ul>
          <div className={style.miningReward.explanation}>
            {t(`
            XELIS operates using BlockDAG, meaning it's possible to have multiple block at the same height. These are called side blocks, and their rewards are lower than those of normal blocks. 
            This is not taken into account in the calculator. 
            The lower emission curve per block is also not taking into account when calculating for longer period.
            The dev fee is removed from the block reward calculation.
            `)}
          </div>
        </>}
      </div>
    </div>
  </div>
}

export default MiningCalculator