/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const FETCH_TIMEOUT_MS = 2000;

/**
 * Minimal subset of `update-notifier`'s `UpdateInfo` shape. We re-declare
 * it locally because the Raudbjorn fork no longer ships the
 * `update-notifier` dependency — we unconditionally disable update
 * checks, so importing its types from npm would re-introduce a
 * package we removed.
 */
export interface UpdateInfo {
  latest: string;
  current: string;
  type?: string;
  name?: string;
}

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
