// AYOPAPO admin API — the shared bzs-edit server with this site's module.
// Schema, port and upload rules live in bzs-edit/sites/papo.js.
import { start } from 'bzs-edit';
import site from 'bzs-edit/sites/papo';

start(site, new URL('./config.json', import.meta.url).pathname);
