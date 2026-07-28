import { Hono } from 'hono';
import { master } from '../templates/master';
import { ServerApp } from '..';
import { match_route } from '../../client/app/router';
import { localization } from '../../client/localization/localization';
import { validate_lang_key } from '../../client/localization/supported_languages';

export default (app: Hono<ServerApp>) => {
    app.get(`*`, async (c) => {
        const lang_key = validate_lang_key(c.get(`language`));
        localization.locale = lang_key;

        let head = ``;
        let body = ``;

        const page_type = await match_route(new URL(c.req.url));

        await page_type.handle_server(c);

        let title = page_type.title + " - XELIS Explorer";
        let description = page_type.description;
        let status = page_type.status;

        const window_data = page_type.serialize_server_data(page_type.server_data);
        body += window_data;

        const html = master(c, { lang: lang_key, title, description, body, head });
        return c.html(html, status);
    });
}
