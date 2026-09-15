#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(root, file), text.endsWith('\n') ? text : text + '\n');
const json = file => JSON.parse(read(file));
const fence = obj => '```json\n' + JSON.stringify(obj, null, 2) + '\n```';
const numbered = steps => steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
const bullets = items => items.map(item => `- ${item}`).join('\n');
const troubleshooting = (catalog, keys) => keys.map(key => `- ${key}: ${catalog.troubleshooting[key]}`).join('\n');
const banner = '<!-- Generated from src/client-connectivity; do not edit. -->';
const links = catalog => `[Public repository](${catalog.warpPackage.repository}) · [Source ZIP](${catalog.warpPackage.archive}) · [Support](${catalog.warpPackage.support})`;

function preamble(catalog, extras) {
  return [
    banner,
    catalog.account,
    catalog.sessions,
    extras.dcr ? catalog.dcrSessions : null,
    extras.cimd ? catalog.clients.antigravity.oauth.sessions : null,
    catalog.plans,
    catalog.distribution,
    catalog.catalogPolicy,
    `Endpoint: ${catalog.endpoint} (${catalog.transport}). ${catalog.authentication}`,
  ].filter(Boolean).join('\n\n');
}

function clientHeading(catalog, id) {
  const client = catalog.clients[id];
  return `## ${client.title}\n\n${numbered(client.steps)}`;
}

function verify(catalog) {
  return `## Verify\n\n${bullets(catalog.verification)}`;
}

function renderShared(catalog, configs) {
  const oauth = catalog.clients.antigravity.oauth;
  const pkg = catalog.antigravityPackage;
  return [
    '# Connect Opsphere to another client',
    '',
    preamble(catalog, { dcr: true, cimd: true }),
    '',
    clientHeading(catalog, 'cursor'),
    '',
    clientHeading(catalog, 'codex'),
    '',
    clientHeading(catalog, 'claude'),
    '',
    clientHeading(catalog, 'warp'),
    '',
    clientHeading(catalog, 'opencode'),
    '',
    clientHeading(catalog, 'antigravity'),
    '',
    clientHeading(catalog, 'generic'),
    '',
    '## Remote MCP configuration',
    '',
    'Warp local and generic `mcpServers` shape:',
    '',
    fence(configs.warp),
    '',
    'OpenCode (`opencode.json`):',
    '',
    fence(configs.opencode),
    '',
    'If the installed OpenCode requires V2 `mcp.servers`, nest the same `opsphere` object under `mcp.servers` instead of next to it. Do not set `oauth: false` or a static client secret.',
    '',
    'Antigravity plugin MCP that current agy loads (`mcp_config.json`):',
    '',
    fence(configs.antigravityNative),
    '',
    'Agent Plugins portable (`mcp.json`). Current agy skips this file:',
    '',
    fence(configs.antigravity),
    '',
    'OAuth is client-managed. Antigravity uses stable CIMD:',
    '',
    `- client_id: ${oauth.clientId}`,
    `- callback: ${oauth.callback}`,
    `- identity: ${oauth.identity}`,
    '',
    'Do not put client_id, callback, tokens or secrets in the plugin. MCP-only uses ~/.gemini/config/mcp_config.json with the same serverUrl.',
    '',
    verify(catalog),
    '',
    '## Troubleshooting',
    '',
    troubleshooting(catalog, [
      'missing_server',
      'empty_mcp_panel',
      'invalid_redirect_uri',
      'unknown_client_id',
      'token_issuance_failed',
      'authentication',
      'stale_catalog',
      'revocation',
    ]),
    '',
    '## Optional packages',
    '',
    catalog.warpPackage.availability,
    '',
    catalog.opencodePackage.availability,
    '',
    catalog.antigravityPackage.availability,
    '',
    links(catalog),
    '',
    `Warp: Install skills under ${catalog.warpPackage.skillsDirectory}. ${catalog.warpPackage.rulesPolicy}`,
    '',
    catalog.warpPackage.cloud,
    '',
    `OpenCode: Install skills under ${catalog.opencodePackage.skillsDirectory}. ${catalog.opencodePackage.rulesPolicy}`,
    '',
    catalog.opencodePackage.codeMode,
    '',
    catalog.opencodePackage.timeout,
    '',
    `Antigravity: ${pkg.portable} ${pkg.install} Official path: ${pkg.installPath} ${pkg.list} ${pkg.uninstall}`,
    '',
    pkg.nativeMcp,
    '',
    pkg.oauthMethod,
    '',
    pkg.duplicateMcp,
    '',
    pkg.unconfirmed,
    '',
    pkg.experimentalPaths,
    '',
  ].join('\n');
}

function renderClientGuide(catalog, configs, opts) {
  const client = catalog.clients[opts.id];
  const pkg = catalog[opts.packageKey];
  const oauth = catalog.clients.antigravity.oauth;
  const lines = [
    `# Connect Opsphere to ${client.title}`,
    '',
    preamble(catalog, opts.preamble),
    '',
    clientHeading(catalog, opts.id),
    '',
    '## Remote MCP configuration',
    '',
    fence(opts.id === 'antigravity' ? configs.antigravityNative : configs[opts.configKey]),
  ];
  if (opts.id === 'opencode') {
    lines.push(
      '',
      'If the installed OpenCode requires V2 `mcp.servers`, nest the same `opsphere` object under `mcp.servers` instead of next to it. Do not set `oauth: false` or a static client secret.',
    );
  }
  if (opts.id === 'antigravity') {
    lines.push(
      '',
      'This is the native plugin `mcp_config.json` that current agy loads. OAuth stays in the client:',
      '',
      `- client_id: ${oauth.clientId}`,
      `- callback: ${oauth.callback}`,
      `- identity: ${oauth.identity}`,
      '',
      oauth.sessions,
      '',
      pkg.nativeMcp,
      '',
      'Let Antigravity discover OAuth and complete PKCE S256. If it asks for a code, paste the one-time authorization code into the terminal. Do not log, share or document that code. Do not configure client_id, callback, tokens or secrets.',
      '',
      'Agent Plugins portable (`mcp.json`) is also in the package; agy 1.2.x skips it:',
      '',
      fence(configs.antigravity),
      '',
      'MCP-only is a separate mode using `~/.gemini/config/mcp_config.json` with the same `serverUrl`. Do not also install the plugin.',
    );
  }
  lines.push(
    '',
    verify(catalog),
    '',
    '## Troubleshooting',
    '',
    troubleshooting(catalog, opts.troubleKeys),
    '',
    `## Optional ${client.title} package`,
    '',
    pkg.availability,
    '',
    links(catalog),
    '',
  );
  if (opts.id === 'warp') {
    lines.push(
      `Install skills under ${pkg.skillsDirectory}. ${pkg.rulesPolicy}`,
      '',
      pkg.cloud,
      '',
    );
  }
  if (opts.id === 'opencode') {
    lines.push(
      `Install skills under ${pkg.skillsDirectory}. ${pkg.rulesPolicy}`,
      '',
      pkg.codeMode,
      '',
      pkg.timeout,
      '',
    );
  }
  if (opts.id === 'antigravity') {
    lines.push(
      pkg.portable,
      '',
      pkg.nativeMcp,
      '',
      `${pkg.install} → ${pkg.installPath}`,
      '',
      pkg.list,
      '',
      pkg.uninstall,
      '',
      pkg.oauthMethod,
      '',
      pkg.duplicateMcp,
      '',
      pkg.unconfirmed,
      '',
      pkg.experimentalPaths,
      '',
    );
  }
  return lines.join('\n');
}

export function generateGuides() {
  const catalog = json('client-connectivity/catalog.json');
  const configs = {
    warp: json('opsphere-warp/mcp/opsphere.json'),
    opencode: json('opsphere-opencode/mcp/opsphere.json'),
    antigravity: json('opsphere-antigravity/mcp.json'),
    antigravityNative: json('opsphere-antigravity/mcp_config.json'),
  };
  const shared = renderShared(catalog, configs);
  const warp = renderClientGuide(catalog, configs, {
    id: 'warp',
    packageKey: 'warpPackage',
    configKey: 'warp',
    preamble: { dcr: true, cimd: false },
    troubleKeys: ['missing_server', 'invalid_redirect_uri', 'authentication', 'stale_catalog', 'revocation'],
  });
  const opencode = renderClientGuide(catalog, configs, {
    id: 'opencode',
    packageKey: 'opencodePackage',
    configKey: 'opencode',
    preamble: { dcr: true, cimd: false },
    troubleKeys: ['missing_server', 'invalid_redirect_uri', 'authentication', 'stale_catalog', 'revocation'],
  });
  const antigravity = renderClientGuide(catalog, configs, {
    id: 'antigravity',
    packageKey: 'antigravityPackage',
    configKey: 'antigravity',
    preamble: { dcr: false, cimd: true },
    troubleKeys: [
      'missing_server',
      'empty_mcp_panel',
      'invalid_redirect_uri',
      'unknown_client_id',
      'token_issuance_failed',
      'authentication',
      'stale_catalog',
      'revocation',
    ],
  });
  return { shared, warp, opencode, antigravity };
}

const outputs = [
  ['skills/connect-another-client/references/connect.md', 'shared'],
  ['opsphere-warp/guides/connect.md', 'shared'],
  ['opsphere-warp/skills/connect-another-client/references/connect.md', 'shared'],
  ['opsphere-opencode/guides/connect.md', 'shared'],
  ['opsphere-opencode/skills/connect-another-client/references/connect.md', 'shared'],
  ['opsphere-antigravity/guides/connect.md', 'shared'],
  ['opsphere-antigravity/skills/connect-another-client/references/connect.md', 'shared'],
  ['opsphere-warp/guides/warp.md', 'warp'],
  ['opsphere-opencode/guides/opencode.md', 'opencode'],
  ['opsphere-antigravity/guides/antigravity.md', 'antigravity'],
];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const generated = generateGuides();
  if (process.argv.includes('--check')) {
    for (const [file, key] of outputs) {
      const expected = generated[key].endsWith('\n') ? generated[key] : generated[key] + '\n';
      const actual = read(file);
      if (actual !== expected) {
        console.error(`generated guide out of date: ${file}`);
        process.exitCode = 1;
      }
    }
    if (!process.exitCode) console.log('generate-client-guides: in sync');
  } else {
    for (const [file, key] of outputs) write(file, generated[key]);
    console.log('generate-client-guides: wrote', outputs.length, 'files');
  }
}
