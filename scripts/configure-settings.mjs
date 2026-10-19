import { chmodSync, closeSync, constants, fstatSync, lstatSync, mkdtempSync,
  openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Update only the documented runtime path. Never print settings or parse errors. */
function configureSettings(settingsPath, runtimePath) {
  if (!settingsPath || !runtimePath || !isAbsolute(settingsPath) || !isAbsolute(runtimePath)) {
    throw new Error('Settings and runtime paths must be absolute.');
  }
  let info;
  try {
    info = lstatSync(settingsPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Cannot inspect settings.json. Check file permissions.');
    console.log('  WARNING: settings.json not found; configure local settings separately.');
    return;
  }
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error('settings.json must be a regular file, not a symlink or directory.');
  }

  let source;
  let descriptor;
  try {
    // Do not follow a symlink swapped in between inspection and opening.
    descriptor = openSync(settingsPath, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = fstatSync(descriptor);
    if (!opened.isFile() || opened.dev !== info.dev || opened.ino !== info.ino) throw new Error();
    source = readFileSync(descriptor, 'utf8');
  } catch {
    throw new Error('Cannot read a stable regular settings.json file. Check permissions and retry without concurrent edits.');
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }

  let settings;
  try {
    settings = JSON.parse(source, (_key, value) => {
      // Reject integers that JSON parsing would round, rather than rewrite an
      // unrelated setting with a different value during format normalization.
      if (typeof value === 'number' && (!Number.isFinite(value) ||
          (Number.isInteger(value) && !Number.isSafeInteger(value)))) throw new Error();
      return value;
    });
  } catch {
    throw new Error('settings.json must be valid JSON without nonfinite or unsafe integer values; no settings were changed.');
  }
  if (!isRecord(settings) || (settings.env !== undefined && !isRecord(settings.env))) {
    throw new Error('settings.json and its env field must be JSON objects; no settings were changed.');
  }
  if (!settings.env || !Object.hasOwn(settings.env, 'PAI_DIR')) {
    console.log('  WARNING: env.PAI_DIR not found in settings.json; configure the optional entry separately.');
    return;
  }
  if (typeof settings.env.PAI_DIR !== 'string') {
    throw new Error('settings.json env.PAI_DIR must be a string; no settings were changed.');
  }
  if (settings.env.PAI_DIR === runtimePath) {
    console.log('  OK: env.PAI_DIR already identifies the runtime configuration directory.');
    return;
  }
  settings.env.PAI_DIR = runtimePath;
  const updated = JSON.stringify(settings, null, 2) + '\n';

  let temporary;
  try {
    // Keep any interrupted temporary settings inside a private sibling directory.
    // Publish only a complete serialized file, retaining the original POSIX mode.
    temporary = mkdtempSync(join(dirname(settingsPath), '.settings.tmp.'));
    chmodSync(temporary, 0o700);
    const staged = join(temporary, 'settings.json');
    writeFileSync(staged, updated, { flag: 'wx', mode: 0o600 });
    chmodSync(staged, info.mode & 0o777);
    const current = lstatSync(settingsPath);
    if (!current.isFile() || current.dev !== info.dev || current.ino !== info.ino ||
        current.mtimeMs !== info.mtimeMs || current.size !== info.size) throw new Error();
    renameSync(staged, settingsPath);
  } catch {
    throw new Error('Could not safely update settings.json. Check permissions and retry without concurrent edits.');
  } finally {
    if (temporary) {
      try { rmSync(temporary, { recursive: true, force: true }); }
      catch { throw new Error('Settings update could not clean its private temporary directory. Inspect .claude/.settings.tmp.* before retrying.'); }
    }
  }
  console.log('  OK: env.PAI_DIR updated to the runtime configuration directory.');
}

try {
  configureSettings(...process.argv.slice(2));
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
}
