/**
 * Patch This: A basic patching system
 * Copyright (C) 2020 Guilherme T Maeoka
 * <https://github.com/guimspace/patch-this>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

function update_ () {
  if (!isInstalled_()) return 3;

  const lock = LockService.getDocumentLock();
  try {
    lock.waitLock(200);
  } catch (err) {
    ConsoleLog.warn(err);
    return 1;
  }

  const v0 = getClassVersion_('script');
  const v1 = APPS_SCRIPT_GLOBAL.script_version;

  if (v0 === 1) {
    lock.releaseLock();
    return 2;
  }

  let ver, major, minor, patch;
  let mm, pp, r, t;

  const beta = v0.beta == null ? 0 : v0.beta;
  const patch_list = PATCH_THIS.patch_list;

  major = v0.major;
  minor = v0.minor;
  patch = v0.patch;

  t = 0;
  mm = minor;
  pp = patch;
  r = { r: 0, m: minor, p: patch, b: beta };

  do {
    ver = (major === v1.major ? v1 : null);
    if (major >= patch_list.length) {
      major -= 2;
      t = 1;
    } else if (patch_list[major]) {
      r = update_major_(ver, patch_list[major], minor, patch, beta);
    }

    if (r.r || major === v1.major) {
      t = 1;
    } else {
      major++;
      mm = r.m;
      minor = 0;
      pp = r.p;
      patch = -1;
    }
  } while (!t);

  if (r.r) {
    if (r.m === -1) {
      major--;
      r.m = mm;
    }
    if (r.p === -1) r.p = pp;

    if (r.r === 2) ConsoleLog.warn('add-on/update/fail', r);
    r.r = 2;
  } else {
    if (r.m === -1) r.m = 0;
    r.r = 0;
  }

  const cell = {
    major: major,
    minor: r.m,
    patch: r.p,
    beta: r.b
  };

  let ss, i;

  i = 0;
  ss = setClassVersion_('script', cell);
  while (ss && ++i < 3) {
    Utilities.sleep(Math.pow(3, i) * 1000);
    ss = setClassVersion_('script', cell);
  }

  lock.releaseLock();
  if (ss === 1) {
    ConsoleLog.error('update_(): Update failed to set new script version.');
    return 2;
  }

  bsSignSetup_();
  return r.r;
}
