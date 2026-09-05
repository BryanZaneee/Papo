// AYOPAPO admin API — the shared bzs-edit server with this site's module.
// Schema, port and upload rules live in bzs-edit/sites/papo.js.
import { join } from 'node:path';
import { start } from 'bzs-edit';
import site from 'bzs-edit/sites/papo';

start(site, join(import.meta.dirname, 'config.json'));
