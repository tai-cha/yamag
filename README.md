# YAAGM: Yet Another Accuracy Game for Misskey

## What's this app
これは「334」のような特定の時間に対しての投稿時間の精度を図るようなゲームの集計を行うアプリです。

### Features (WIP)
- 特定時刻のノートの収集・ランキングの集計
  - 同着も含め10位以内を表示する（10人ではなく）
- (まだ) 終了後に自分の投稿時刻と順位を表示する
- (できたら) LTLではなくSTL(Hybrid Timeline)で動かし他サーバーにも対応する
- (もしかしたら) 累計でのランクイン回数や累計の合計レーティングを表示する

## How to use
- 環境変数「SERVER_TOKEN」にMisskey.ioで取得したトークンを設定する
- 特定時刻をコード上で変更しておく（あとで変えられるようにする予定です）
- 特定時刻が過ぎた後にコードを実行する(cron等を用いれば自動化できる)
  - `pnpm build`をしておいて（前提なので一回でOK）
  - `pnpm start`
- 集計結果がノートされる

## ENV Config
環境変数、または.envファイルを用いることでアプリケーションの設定を変更可能です

### SERVER_ORIGIN
- Misskeyサーバーのアドレス
- default "https://misskey.io"
### **SERVER_TOKEN**
- **設定必須**
### RECORD_HOUR
- 記録を開始する時刻の時(24時間形式)
- default 3
### RECORD_MINUTE
- 記録を開始する時刻の分(24時間形式)
- default 34
### POST_TITLE
- 投稿時タイトル
- default "Today's 334 Top 10"
### MATCHER
- 取得対象となる文字列を変更する場合に使います
- default 
```js
/(33-?4|:hanshin:)/
```
### REMINED_POST_TEXT
- 観測時投稿テキストを変更できます
- default "334観測中"

### POST_DISABLED
- 何か値を設定するとMisskeyにノートが投稿されなくなります
- 手元で集計のみ行いたい場合等にお使いください
 
## LICENCE
このプロジェクトはMPL-2.0を採用しています。
ライセンスに従った形での利用や改変は大歓迎です
