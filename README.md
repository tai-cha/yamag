# YAAGM: Yet Another Accuracy Game for Misskey

## What's this app
これは「334」のような特定の時間に対しての投稿時間の精度を図るようなゲームの集計を行うアプリです。

### Features (WIP)
- 特定時刻のノートの収集・ランキングの集計
  - 同着も含め10位以内を表示する（10人ではなく）
- Noteをhttpによる取得で集計する
  - Stream API (WebSocket)を使うものより、取得漏れ含め比較的安定して動作する
- 終了後に自分の投稿時刻と順位を表示する
- LTLではなくSTL(Hybrid Timeline)で動かす~~し他サーバーにも対応する~~
  - 一旦他サーバー対応はしない（競技の公平性を鑑みて）
- 累計でのランクイン回数や(TODO: 累計の合計レーティング)を表示する

## How to use
### 前提
```
Node js v18.16.0
pnpm
```
- `pnpm install`(依存関係のインストール)
- 環境変数「SERVER_TOKEN」にMisskey.ioで取得したトークンを設定する
- 特定時刻をコード上で変更しておく（あとで変えられるようにする予定です）
- (返信機能を使う場合) DATABASE_URLを設定して、`pnpm run migrate`を実行
- 特定時刻が過ぎた後にコードを実行する(cron等を用いれば自動化できる)
  - `pnpm build`をしておいて（前提なので一回でOK）
  - `pnpm start`
- 集計結果がノートされる

### 集計開始ノートを投稿する
- `pnpm run remind`

### 返信機能を利用する
- **データベースの設定・migrate必須**
- `pnpm run mentions`

## ENV Config
環境変数、または.envファイルを用いることでアプリケーションの設定を変更可能です

### SERVER_ORIGIN
- Misskeyサーバーのアドレス
- default "https://misskey.io"

### **SERVER_TOKEN** (**設定必須**)
- Misskeyから取得したAPIのトークン
- 最低でもノートの作成・削除の権限は与えないと投稿が不可

### DATABASE_URL
- PostgreSQLのURL
- **返信機能を使うには必須**

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

### USER_NAME
- 自身のusername
  - ~~自身のノートをフライング含め集計しないために入れています~~
  - ~~（※今後廃止してBotユーザー全部弾くようにするかも）~~
  - リプライの判定に使います
- default `334_t`

### REMINED_POST_TEXT
- 観測時投稿テキストを変更できます
- default "334観測中"

### POST_DISABLED
- 何か値を設定するとMisskeyにノートが投稿されなくなります
- 手元で集計のみ行いたい場合等にお使いください

## etc..
- dotenv導入済みなのでローカルなどで試す場合は`.env`のファイルを用意して配置すれば設定変更可能
  - 開発環境（NODE_ENV=development）の場合は`.env.development`が読み込まれる（`.env`は読み込まない）
 
## LICENCE
このプロジェクトはMPL-2.0を採用しています。
ライセンスに従った形での利用や改変は大歓迎です
