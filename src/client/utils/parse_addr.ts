interface AddrInfo {
    ip: string;
    port: string;
    type: "ipv4" | "ipv6";
}

const is_ipv4 = (ip: string) => {
    const octets = ip.split(`.`);
    return octets.length === 4 && octets.every((octet) => {
        // Do not let Number accept signs, whitespace, or an empty value.
        if (!/^\d{1,3}$/.test(octet)) return false;
        return Number(octet) <= 255;
    });
};

const is_ipv6 = (ip: string) => {
    // An IPv6 address may contain an IPv4 address in its final two groups.
    const groups = ip.split(`:`);
    const last_group = groups[groups.length - 1];
    const has_ipv4_tail = last_group.includes(`.`);

    if (has_ipv4_tail) {
        if (!is_ipv4(last_group)) return false;
        groups.splice(-1, 1, `ipv4`);
    }

    const compression_count = (ip.match(/::/g) || []).length;
    if (compression_count > 1) return false;
    if (compression_count === 1) {
        const compression_parts = ip.split(`::`);
        // Reject malformed forms such as `:::` and `1:::2`.
        if (compression_parts[0].endsWith(`:`) || compression_parts[1].startsWith(`:`)) {
            return false;
        }
    }

    const group_count = groups.filter((group) => group !== ``).reduce((count, group) => {
        return count + (group === `ipv4` ? 2 : 1);
    }, 0);

    // `::` must replace at least one group; without it an IPv6 address has
    // exactly eight groups.
    if (compression_count === 0) return group_count === 8;
    if (group_count >= 8) return false;

    return groups.every((group) => group === `` || group === `ipv4` || /^[0-9a-f]{1,4}$/i.test(group));
};

const get_port = (port: string) => {
    if (!/^\d+$/.test(port)) return undefined;
    const value = Number(port);
    return Number.isSafeInteger(value) && value <= 65535 ? port : undefined;
};

export const parse_addr = (addr: string): AddrInfo | undefined => {
    if (typeof addr !== `string`) return undefined;

    // Rust's SocketAddr formatter always brackets IPv6 addresses.
    if (addr.startsWith(`[`)) {
        const closing_bracket = addr.indexOf(`]`);
        if (closing_bracket === -1 || addr.slice(closing_bracket + 1, closing_bracket + 2) !== `:`) {
            return undefined;
        }

        const ip = addr.slice(1, closing_bracket);
        const port = get_port(addr.slice(closing_bracket + 2));
        if (!is_ipv6(ip) || port === undefined) return undefined;

        return { ip, port, type: `ipv6` };
    }

    // An unbracketed socket address can only be IPv4. Splitting at the last
    // colon also makes malformed extra-colon inputs fail cleanly.
    const separator = addr.lastIndexOf(`:`);
    if (separator <= 0 || addr.indexOf(`:`) !== separator) return undefined;

    const ip = addr.slice(0, separator);
    const port = get_port(addr.slice(separator + 1));
    if (!is_ipv4(ip) || port === undefined) return undefined;

    return { ip, port, type: `ipv4` };
};
