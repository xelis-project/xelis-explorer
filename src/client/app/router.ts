import { Page } from "../pages/page";

type PageConstructor = typeof Page;
type PageModule = { [key: string]: PageConstructor };

interface RouteDefinition {
    pathname: string;
    load: () => Promise<PageModule>;
    export_name: string;
}

// Keep route matching small and dependency-free. Page implementations are loaded
// only after a route has matched, so the initial client bundle contains no page
// trees or page-specific libraries.
const routes: RouteDefinition[] = [
    { pathname: "/", load: () => import("../pages/dashboard/dashboards"), export_name: "DashboardPage" },
    { pathname: "/block/:id", load: () => import("../pages/block/block"), export_name: "BlockPage" },
    { pathname: "/blocks", load: () => import("../pages/blocks/blocks"), export_name: "BlocksPage" },
    { pathname: "/mempool", load: () => import("../pages/mempool/mempool"), export_name: "MempoolPage" },
    { pathname: "/peers", load: () => import("../pages/peers/peers"), export_name: "PeersPage" },
    { pathname: "/dag", load: () => import("../pages/dag/dag"), export_name: "DAGPage" },
    { pathname: "/topo/:id", load: () => import("../pages/block_topo/block_topo"), export_name: "BlockTopoPage" },
    { pathname: "/height/:id", load: () => import("../pages/block_height/block_height"), export_name: "BlockHeightPage" },
    { pathname: "/account/:id", load: () => import("../pages/account/account"), export_name: "AccountPage" },
    { pathname: "/known-accounts", load: () => import("../pages/known_accounts/known_accounts"), export_name: "KnownAccountsPage" },
    { pathname: "/tx/:id", load: () => import("../pages/transaction/transaction"), export_name: "TransactionPage" },
    { pathname: "/transactions", load: () => import("../pages/transactions/transactions"), export_name: "TransactionsPage" },
    { pathname: "/accounts", load: () => import("../pages/accounts/accounts"), export_name: "AccountsPage" },
    { pathname: "/contract/:id", load: () => import("../pages/contract/contract"), export_name: "ContractPage" },
    { pathname: "/contracts", load: () => import("../pages/contracts/contracts"), export_name: "ContractsPage" },
    { pathname: "/asset/:id", load: () => import("../pages/asset/asset"), export_name: "AssetPage" },
    { pathname: "/assets", load: () => import("../pages/assets/assets"), export_name: "AssetsPage" },
    { pathname: "/settings", load: () => import("../pages/settings/settings"), export_name: "SettingsPage" },
    { pathname: "/network-upgrades", load: () => import("../pages/network_upgrades/network_upgrades"), export_name: "NetworkUpgradesPage" },
    { pathname: "/download-app", load: () => import("../pages/donwload_app/download_app"), export_name: "DownloadAppPage" },
];

const not_found_route: RouteDefinition = {
    pathname: "*",
    load: () => import("../pages/not_found/not_found"),
    export_name: "NotFoundPage",
};

const route_patterns = routes.map(route => ({
    route,
    pattern: new URLPattern({ pathname: route.pathname }),
}));

export const match_route = async (url: URL): Promise<PageConstructor> => {
    const match = route_patterns.find(({ pattern }) => pattern.test(url));
    const route = match?.route || not_found_route;
    const module = await route.load();
    return module[route.export_name];
};
