/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// npm install if node_modules was removed (e.g. via npm run clean or scripts/clean.js)
if (!existsSync(join(root, 'node_modules'))) {
  execSync('npm install', { stdio: 'inherit', cwd: root });
}

execSync('npm run generate', { stdio: 'inherit', cwd: root });

// Build in dependency order:
// 1. core (foundation package, includes test-utils)
// 2. channel-base (base channel infrastructure - used by channel adapters and cli)
// 3. channel adapters (depend on channel-base)
// 4. acp-bridge (depends on core - used by cli)
// 5. cli (depends on core, acp-bridge, channel packages)
const buildOrder = [
  'packages/core',
  'packages/channels/base',
  'packages/channels/telegram',
  'packages/channels/weixin',
  'packages/channels/dingtalk',
  'packages/channels/feishu',
  'packages/channels/qqbot',
  'packages/channels/plugin-example',
  'packages/acp-bridge',
  'packages/cli',
];

for (const workspace of buildOrder) {
  execSync(`npm run build --workspace=${workspace}`, {
    stdio: 'inherit',
    cwd: root,
  });
}

// Build container image if sandboxing is enabled.
// skip (-s) npm install + build since we did that above
try {
  execSync('node scripts/sandbox_command.js -q', { stdio: 'inherit', cwd: root });
  if (
    process.env.BUILD_SANDBOX === '1' ||
    process.env.BUILD_SANDBOX === 'true'
  ) {
    execSync('node scripts/build_sandbox.js -s', { stdio: 'inherit', cwd: root });
  }
} catch {
  // ignore
}
