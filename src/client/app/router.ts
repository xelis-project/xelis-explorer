import { AccountPage } from "../pages/account/account";
import { AccountsPage } from "../pages/accounts/accounts";
import { AssetPage } from "../pages/asset/asset";
import { AssetsPage } from "../pages/assets/assets";
import { BlockPage } from "../pages/block/block";
import { BlockHeightPage } from "../pages/block_height/block_height";
import { BlockTopoPage } from "../pages/block_topo/block_topo";
import { BlocksPage } from "../pages/blocks/blocks";
import { ContractPage } from "../pages/contract/contract";
import { ContractsPage } from "../pages/contracts/contracts";
import { DAGPage } from "../pages/dag/dag";
import { DashboardPage } from "../pages/dashboard/dashboards";
import { DownloadAppPage } from "../pages/donwload_app/download_app";
import { KnownAccountsPage } from "../pages/known_accounts/known_accounts";
import { MempoolPage } from "../pages/mempool/mempool";
import { NetworkUpgradesPage } from "../pages/network_upgrades/network_upgrades";
import { NotFoundPage } from "../pages/not_found/not_found";
import { Page } from "../pages/page";
import { PeersPage } from "../pages/peers/peers";
import { SettingsPage } from "../pages/settings/settings";
import { TransactionPage } from "../pages/transaction/transaction";
import { TransactionsPage } from "../pages/transactions/transactions";

export const pages = [
    DashboardPage,
    BlockPage,
    BlocksPage,
    MempoolPage,
    PeersPage,
    DAGPage,
    BlockTopoPage,
    BlockHeightPage,
    AccountPage,
    KnownAccountsPage,
    TransactionPage,
    TransactionsPage,
    AccountsPage,
    ContractPage,
    ContractsPage,
    AssetPage,
    AssetsPage,
    SettingsPage,
    NetworkUpgradesPage,
    DownloadAppPage
];

export const match_route = (url: URL): typeof Page => {
    const page_type = pages.find(page => {
        const pattern = page.get_pattern();
        return pattern.test(url);
    });
    if (page_type) return page_type;
    return NotFoundPage;
}
