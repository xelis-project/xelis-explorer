import { css } from 'goober'
import { useMemo, useState } from 'react'
import { useLang } from 'g45-react/hooks/useLang'
import prettyMs from 'pretty-ms'

import { useNetworkInfo } from '../home'
import { BLOCK_TIME, formatDifficulty, formatHashRate, formatXelis } from '../../utils'
import PageTitle from '../../layout/page_title'
import theme from '../../style/theme'

const style = {
  container: css`
    .box {
      background: var(--stats-bg-color);
      padding: 1.5em;
      border-top-right-radius: 1em;
      border-top-left-radius: 1em;
    }

    .network-hashrate {
      font-size: 1.2em;
      border-radius: 1em;
      margin-bottom: 1em;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      display: flex;
      justify-content: space-between;
    }
    
    .input-calculator {
      position: relative;
      display: flex;
      align-items: center;

      input {
        width: 100%;
        padding: 1em 1.5em;
        font-size: 1.1em;
        border-radius: 30px;
        outline: none;
        color: var(--text-color);
        background-color: var(--stats-bg-color);
        border: none;
        font-weight: bold;
      }

      select {
        position: absolute;
        right: 2em;
        font-size: 1.1em;
        border: none;
        background: transparent;
        color: var(--text-color);
        cursor: pointer;
        outline: none;

        option {
          background: var(--bg-color);
        }
      }
    }

    .mining-reward {
      background: ${theme.apply({ xelis: `#000000c9`, dark: `#000000c9`, light: `#ffffff7a`})};
      padding: 1em;
      border-bottom-right-radius: 1em;
      border-bottom-left-radius: 1em;

      .time-find-block {
        text-decoration: underline;
      }

      > :nth-child(1) {
        font-size: 1.3em;
        margin-bottom: .5em;
      }

      > :nth-child(2) {
        margin-bottom: 1em;
        color: var(--muted-color);
      }

      > :nth-child(4) {
        list-style-type: disc;
        padding-left: 1em;
        padding-top: .5em;
        line-height: 1.3em;
        margin-bottom: 1em;
      }

      > :nth-child(5) {
        color: var(--muted-color);
      }
    }
  `
}

function MiningCalculator() {
  const { info } = useNetworkInfo()
  const { t } = useLang()

  const [hashRate, setHashRate] = useState()
  const [hashRateUnit, setHashRateUnit] = useState(1000000) // MH/s

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

    return {
      timeUntilBlock, // in seconds
      rewardPerHour: miningData.blockReward / (timeUntilBlock / 60 / 60),
      rewardPerDay: miningData.blockReward / (timeUntilBlock / 60 / 60 / 24),
      rewardPerWeek: miningData.blockReward / (timeUntilBlock / 60 / 60 / 24 / 7),
      rewardPerMonth: miningData.blockReward / (timeUntilBlock / 60 / 60 / 24 / 7 / 30),
      rewardPerYear: miningData.blockReward / (timeUntilBlock / 60 / 60 / 24 / 7 / 30 / 12),
    }
  }, [miningData, hashRate, hashRateUnit])

  return <div className={style.container}>
    <PageTitle title={t(`Mining Calculator`)} />
    <div>
      <div className="box">
        <div className="network-hashrate">
          <div>{t(`Network hashrate`)}</div>
          <div>{formatHashRate(info.difficulty)}</div>
        </div>
        <div className="input-calculator">
          <input type="text" onChange={(e) => {
            const value = parseFloat(e.target.value)
            setHashRate(isNaN(value) ? '' : value)
          }} placeholder={t(`Your hashrate`)} />
          <select defaultValue="1000000" onChange={(e) => {
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
      <div className="mining-reward">
        {hashRate && <>
          <div>
            {t(`With {}H/s, you can probably find a block every`, [formatDifficulty(hashRate * hashRateUnit)])} <span className="time-find-block">{prettyMs(rewardData.timeUntilBlock * 1000 || 0, { compact: true })}</span>.
          </div>
          <div>{t(`More precisely every {} with each block at {}.`, [prettyMs(rewardData.timeUntilBlock * 1000 || 0), formatXelis(miningData.blockReward)])}</div>
          <div>{t(`This represent around:`)}</div>
          <ul>
            <li>{formatXelis(rewardData.rewardPerHour)} / {t(`hour`)}</li>
            <li>{formatXelis(rewardData.rewardPerDay)} / {t(`day`)}</li>
            <li>{formatXelis(rewardData.rewardPerWeek)} / {t(`week`)}</li>
            <li>{formatXelis(rewardData.rewardPerMonth)} / {t(`month`)}</li>
            <li>{formatXelis(rewardData.rewardPerYear)} / {t(`year`)}</li>
          </ul>
          <div>{t(`XELIS operates using BlockDAG, meaning it's possible to have multiple block at the same height. These are called side blocks, and their rewards are lower than those of normal blocks. This is not taken into account in the calculator.`)}</div>
        </>}
      </div>
    </div>
  </div>
}

export default MiningCalculator