/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UpdateInfo } from 'update-notifier';

export const FETCH_TIMEOUT_MS = 2000;

export interface UpdateObject {
  message: string;
  update: UpdateInfo;
}

// Raudbjorn fork: unconditionally disable update checks against the npm
// registry. The fork is not published to npm, so any update check would
// be a useless phone-home to a public endpoint.
export async function checkForUpdates(): Promise<UpdateObject | null> {
  return null;
}
