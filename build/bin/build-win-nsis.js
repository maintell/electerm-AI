const { rm, echo } = require('shelljs')
const fs = require('fs')
const path = require('path')
const {
  run,
  writeSrc,
  uploadToR2,
  builder
} = require('./build-common')

/**
 * Patch the electron-builder NSIS template so that the installer always tries
 * to keep shortcuts (desktop / start-menu / taskbar pins) when upgrading.
 *
 * By default, when `allowToChangeInstallationDirectory` is set, the template
 * sets `isTryToKeepShortcuts = "false"` for manual (non-auto-update) installs,
 * which causes `WinShell::UninstShortcut` / `UninstAppUserModelId` to be called
 * and the taskbar pin to be silently removed. Removing the guard makes the
 * installer always pass `--keep-shortcuts` to the old uninstaller when the
 * previous install wrote `KeepShortcuts = "true"` to the registry.
 */
function patchNsisKeepShortcuts () {
  const templatePath = path.join(
    require.resolve('app-builder-lib/package.json'),
    '../templates/nsis/include/installUtil.nsh'
  )
  const original = fs.readFileSync(templatePath, 'utf-8')
  const patched = original.replace(
    /(!macro setIsTryToKeepShortcuts\s+StrCpy \$isTryToKeepShortcuts "true"\s*)!ifdef allowToChangeInstallationDirectory[\s\S]*?!endif(\s*!macroend)/,
    '$1$2'
  )
  if (patched === original) {
    echo('NSIS keep-shortcuts patch: already applied or pattern not found, skipping')
  } else {
    fs.writeFileSync(templatePath, patched, 'utf-8')
    echo('NSIS keep-shortcuts patch: applied successfully')
  }
}

async function main () {
  const pb = builder
  echo('running build for win part nsis installer')

  patchNsisKeepShortcuts()

  echo('build nsis')
  const src = 'win-x64-installer.exe'
  rm('-rf', 'dist')
  writeSrc(src)
  await run(`${pb} --win nsis`)
  await uploadToR2(src)
}

main()
