import { Peer } from "@xelis/sdk/daemon/types";
import type * as leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetch_geo_location, GeoLocationData } from "../../utils/fetch_geo_location";
import { parse_addr } from "../../utils/parse_addr";
import { OverlayLoading } from "../overlay_loading/overlay_loading";

import './peers_map.css';

export interface PeerLocation {
    peer: Peer;
    geo_location: GeoLocationData;
}

interface PeerMarker {
    marker: leaflet.CircleMarker;
    geo_location: GeoLocationData;
    peers: Peer[];
}

export class PeersMap {
    element: HTMLDivElement;
    loading_element?: HTMLDivElement;
    peer_count_element: HTMLDivElement;
    overlay_loading: OverlayLoading;

    map!: leaflet.Map;
    peer_markers: Map<string, PeerMarker>;
    peer_marker_keys: Map<string, string>;
    destroyed = false;

    constructor() {
        this.element = document.createElement(`div`);
        this.peer_markers = new Map();
        this.peer_marker_keys = new Map();
        this.setup_map();

        this.peer_count_element = document.createElement(`div`);
        this.peer_count_element.classList.add(`xe-peers-map-peer-count`);
        this.element.appendChild(this.peer_count_element);

        this.overlay_loading = new OverlayLoading();
        this.element.appendChild(this.overlay_loading.element);
    }

    async setup_map() {
        const leaflet = await import("leaflet");
        if (this.destroyed) return;
        this.map = leaflet.map(this.element).setView([20, 0], 2);
        this.map.setMinZoom(2);
        leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(this.map);
    }

    set_peer_count(count: number) {
        this.peer_count_element.innerHTML = `${count.toLocaleString()}P`;
    }

    async fetch_peers_locations(peers: Peer[], signal?: AbortSignal) {
        const peers_addr = peers.map(peer => {
            const addr = parse_addr(peer.addr);
            if (!addr) {
                return undefined;
            }

            return { peer, addr };
        }).filter(p => p !== undefined);

        const ips = peers_addr.map(p => p.addr!.ip);
        let peers_locations: PeerLocation[] = [];

        const batch_size = 50;
        for (let i = 0; i < ips.length; i += batch_size) {
            if (signal?.aborted) return [];
            const ips_to_fetch = ips.slice(i, i + batch_size);
            let geo_locations: Record<string, GeoLocationData>;
            try {
                geo_locations = await fetch_geo_location(ips_to_fetch, signal);
            } catch (error) {
                if (signal?.aborted) return [];
                throw error;
            }
            if (signal?.aborted) return [];
            Object.keys(geo_locations).forEach((key) => {
                const peer_addr = peers_addr.find(p => p.addr?.ip === key);
                if (!peer_addr) return;

                peers_locations.push({
                    peer: peer_addr.peer,
                    geo_location: geo_locations[key]
                });
            });
        }

        return peers_locations;
    }

    async set(peers_locations: PeerLocation[]) {
        this.set_peer_count(peers_locations.length);

        // Add new peers
        for (let i = 0; i < peers_locations.length; i++) {
            const peer_location = peers_locations[i];
            await this.add_peer_marker(peer_location);
        }

        // Remove disappeared peers
        this.peer_marker_keys.forEach((_, peer_id) => {
            const peer = peers_locations.find(p => p.peer.id === peer_id);
            if (!peer) {
                this.remove_peer_marker(peer_id);
            }
        });
    }

    bind_marker_popup(marker: leaflet.CircleMarker, geo_location: GeoLocationData, peers: Peer[]) {
        const popup_peers = peers.map((peer) => {
            return `<div>${peer.addr} (${peer.version})</div>`;
        }).join(``);

        const popup = `
            <div class="xe-peers-map-tooltip">
                <div>${geo_location.city}, ${geo_location.country}</div>
                <div>
                    ${popup_peers}
                </div>
            </div>
        `;

        marker.bindPopup(popup, { closeButton: false });
    }

    build_marker_key(geo_location: GeoLocationData) {
        return `${geo_location.latitude},${geo_location.longitude}`;
    }

    async new_peer_marker(geo_location: GeoLocationData, peer_count: number) {
        const leaflet = await import("leaflet");

        if (geo_location.success) {
            return leaflet.circleMarker([geo_location.latitude, geo_location.longitude], {
                radius: 4 + peer_count,
                weight: 0,
                color: '#02FFCF',
                fillColor: '#02FFCF',
                fillOpacity: 0.5
            });
        }
    }

    async add_peer_marker(peer_location: PeerLocation) {
        const { geo_location, peer } = peer_location;
        const marker_key = this.build_marker_key(geo_location);
        const peer_marker = this.peer_markers.get(marker_key);
        if (peer_marker) {
            // skip adding peer to popup if already in there
            if (peer_marker.peers.find(p => p.id === peer.id)) {
                return;
            }

            // add peer to marker popup
            peer_marker.peers.push(peer);
            this.peer_marker_keys.set(peer.id, marker_key);
            this.bind_marker_popup(peer_marker.marker, geo_location, peer_marker.peers);
            peer_marker.marker.setRadius(4 + peer_marker.peers.length); // resize marker
        } else {
            // add new marker
            const marker = await this.new_peer_marker(geo_location, 1);
            if (marker) {
                marker.addTo(this.map);
                this.bind_marker_popup(marker, geo_location, [peer]);
                this.peer_marker_keys.set(peer.id, marker_key);
                this.peer_markers.set(marker_key, { marker, geo_location, peers: [peer_location.peer] });
            }
        }
    }

    remove_peer_marker(peer_id: string) {
        const marker_key = this.peer_marker_keys.get(peer_id);
        if (marker_key) {
            const peer_marker = this.peer_markers.get(marker_key);
            if (peer_marker) {
                for (let a = 0; a < peer_marker.peers.length; a++) {
                    const peer = peer_marker.peers[a];
                    if (peer.id === peer_id) {
                        if (peer_marker.peers.length > 1) {
                            // remove peer from popup
                            peer_marker.peers.splice(a, 1);
                            this.bind_marker_popup(peer_marker.marker, peer_marker.geo_location, peer_marker.peers);
                        } else {
                            // remove marker completely
                            peer_marker.marker.remove();
                            this.peer_markers.delete(marker_key);
                        }

                        break;
                    }
                }
            }

            this.peer_marker_keys.delete(peer_id);
        }
    }

    unload() {
        this.destroyed = true;
        this.peer_markers.forEach(({ marker }) => marker.remove());
        this.peer_markers.clear();
        this.peer_marker_keys.clear();
        this.map?.remove();
    }
}
