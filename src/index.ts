import '@logseq/libs' //https://plugins-doc.logseq.com/
import { loadTwoHopLink } from './hopLinks'
import { setup as l10nSetup } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import ja from "./translations/ja.json"
import { settings } from './settings'
import { AppInfo } from '@logseq/libs/dist/LSPlugin.user'

let logseqVersion: string = "" //バージョンチェック用
let logseqVersionMd: boolean = false //バージョンチェック用
// export const getLogseqVersion = () => logseqVersion //バージョンチェック用
export const booleanLogseqVersionMd = () => logseqVersionMd //バージョンチェック用

/* main */
const main = async () => {

  // バージョンチェック
  logseqVersionMd = await checkLogseqVersion()
  // console.log("logseq version: ", logseqVersion)
  // console.log("logseq version is MD model: ", logseqVersionMd)
  // 100ms待つ
  await new Promise(resolve => setTimeout(resolve, 100))

  if (logseqVersionMd === false) {
    // Logseq ver 0.10.*以下にしか対応していない
    logseq.UI.showMsg("The ’2 Hop Link’ plugin only supports Logseq ver 0.10.* and below.", "warning", { timeout: 5000 })
    return
  }

  await l10nSetup({ builtinTranslations: { ja } })
  /* user settings */
  logseq.useSettingsSchema(settings())
  if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300)

  loadTwoHopLink()

  logseq.beforeunload(async () => {
    parent.document.getElementById("hopLinks")?.remove()
  })

}/* end_main */

// MDモデルかどうかのチェック DBモデルはfalse
const checkLogseqVersion = async (): Promise<boolean> => {
  const logseqInfo = (await logseq.App.getInfo("version")) as AppInfo | any
  //  0.11.0もしくは0.11.0-alpha+nightly.20250427のような形式なので、先頭の3つの数値(1桁、2桁、2桁)を正規表現で取得する
  const version = logseqInfo.match(/(\d+)\.(\d+)\.(\d+)/)
  if (version) {
    logseqVersion = version[0] //バージョンを取得
    // console.log("logseq version: ", logseqVersion)

    // もし バージョンが0.10.*系やそれ以下ならば、logseqVersionMdをtrueにする
    if (logseqVersion.match(/0\.([0-9]|10)\.\d+/)) {
      logseqVersionMd = true
      // console.log("logseq version is 0.10.* or lower")
      return true
    } else logseqVersionMd = false
  } else logseqVersion = "0.0.0"
  return false
}


logseq.ready(main).catch(console.error)