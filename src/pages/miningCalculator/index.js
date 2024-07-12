import { useMemo, useState } from 'react'
import { useLang } from 'g45-react/hooks/useLang'
import prettyMs from 'pretty-ms'

import { useNetworkInfo } from '../home'
import { BLOCK_TIME, formatDifficulty, formatHashRate, formatXelis } from '../../utils'
import PageTitle from '../../layout/page_title'

import style from './style'

function MiningCalculator() {
  const { info } = useNetworkInfo()
  const { t } = useLang()

  const [hashRate, setHashRate] = useState()
  const [hashRateUnit, setHashRateUnit] = useState(1000) // KH/s

  const miningData = useMemo(() => {
    if (!info) return null

    const supplyLeft = info.maximum_supply - info.circulating_supply

    let baseReward = supplyLeft
    for (let i = 0; i < 20; i++) {
      baseReward /= 2;
    }

    const blockReward = baseReward * BLOCK_TIME / 180
    const networkHashRate = info.difficulty / BLOCK_TIME

    return { blockReward, networkHashRate }
  }, [info])

  const rewardData = useMemo(() => {
    if (!miningData && !hashRate) return {}

    const timeUntilBlock = (miningData.networkHashRate / ((hashRate || 1) * hashRateUnit)) * BLOCK_TIME
    const rewardPerHour = miningData.blockReward / (timeUntilBlock / 60 / 60)

    return {
      timeUntilBlock, // in seconds
      rewardPerHour: rewardPerHour,
      rewardPerDay: rewardPerHour * 24,
      rewardPerWeek: rewardPerHour * 24 * 7,
      rewardPerMonth: rewardPerHour * 24 * 30,
      rewardPerYear: rewardPerHour * 24 * 365,
    }
  }, [miningData, hashRate, hashRateUnit])

  return <div>
    <PageTitle title={t(`Mining Calculator`)} />
    <div>
      <div className={style.box.container}>
        <div className={style.box.networkHashrate}>
          <div>{t(`Network hashrate`)}</div>
          <div>{formatHashRate(info.difficulty)}</div>
        </div>
        <div className={style.box.inputCalculator}>
          <input type="text" onChange={(e) => {
            const value = parseFloat(e.target.value)
            setHashRate(isNaN(value) ? '' : value)
          }} placeholder={t(`Your hashrate`)} />
          <select value={hashRateUnit} onChange={(e) => {
            setHashRateUnit(parseInt(e.target.value))
          }}>
            <option value="1">H/s</option>
            <option value="1000">KH/s</option>
            <option value="1000000">MH/s</option>
            <option value="1000000000">GH/s</option>
            <option value="1000000000000">TH/s</option>
          </select>
        </div>
      </div>
      <div className={style.miningReward.container}>
        {hashRate && <>
          <div className={style.miningReward.result}>
            {t(`With {}H/s, you can probably find a block every`, [formatDifficulty(hashRate * hashRateUnit)])} <span className={style.miningReward.timeBlock}>{prettyMs(rewardData.timeUntilBlock * 1000 || 0, { compact: true })}</span>.
          </div>
          <div className={style.miningReward.specify}>
            {t(`More precisely every {} with each block at {}.`, [prettyMs(rewardData.timeUntilBlock * 1000 || 0), formatXelis(miningData.blockReward)])}
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
            {t(`XELIS operates using BlockDAG, meaning it's possible to have multiple block at the same height. These are called side blocks, and their rewards are lower than those of normal blocks. 
            This is not taken into account in the calculator. 
            The lower emission curve per block is also not taking into account when calculating for longer period.`)}
          </div>
        </>}
      </div>
    </div>
  </div>
}

export default MiningCalculator