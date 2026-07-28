import { AssetData } from "@xelis/sdk/daemon/types";
import { get_assets } from "../data/assets";
import { parse_atomic } from "./parse_atomic";
import { reduce_text } from "./reduce_text";
import DaemonWS from '@xelis/sdk/daemon/websocket';

const asset_cache = new Map<string, AssetData>();
const asset_cache_limit = 512;

export const ws_format_asset = async (ws: DaemonWS, asset_hash: string, atomic_amount: number, locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) => {
    const format = (decimals: number, ticker?: string) => {
        const amount = parse_atomic(atomic_amount, decimals);
        let value = `${amount.toLocaleString(locales, { maximumFractionDigits: decimals, ...options })}`;
        if (ticker) value += ` ${ticker}`;
        else value += ` (${reduce_text(asset_hash)})`;
        return value;
    }

    const assets = get_assets();
    const local_asset = assets[asset_hash];
    if (local_asset) {
        return `${format(local_asset.decimals, local_asset.ticker)}`;
    }

    let asset_data = asset_cache.get(asset_hash);
    if (!asset_data) {
        try {
            asset_data = await ws.methods.getAsset({ asset: asset_hash });
            asset_cache.set(asset_hash, asset_data);
            if (asset_cache.size > asset_cache_limit) {
                const oldest = asset_cache.keys().next().value;
                if (oldest) asset_cache.delete(oldest);
            }
        } catch {
            // can't get data
        }
    }

    if (asset_data) {
        return `${format(asset_data.decimals, asset_data.ticker)}`;
    }

    return `${atomic_amount} ATOMIC (${reduce_text(asset_hash)})`;
}
