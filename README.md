# YAMAG: Yet Another Misskey Accuracy Game app

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
Node js v18.17.0
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

### **DATABASE_URL**
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
- 値を`TRUE`に設定するとMisskeyにノートが投稿されなくなります
- 手元で集計のみ行いたい場合等にお使いください

### DISABLE_MENTION_AROUND_TIME
- 値を`TRUE`に設定すると集計時刻の前後でのメンションに反応しないようにすることが可能です
- default FALSE

### DISABLE_MENTION_SEC_BEFORE
- DISABLE_MENTION_AROUND_TIME と併用して使うオプションです
- メンションに反応しない時間を設定する際に集計時刻の**何ミリ秒前から**反応しないかを設定可能です
- default 60000

### DISABLE_MENTION_SEC_AFTER
- DISABLE_MENTION_AROUND_TIME と併用して使うオプションです
- メンションに反応しない時間を設定する際に集計時刻の**何ミリ秒後まで**反応しないかを設定可能です
- default 60000

## etc..
- dotenv導入済みなのでローカルなどで試す場合は`.env`のファイルを用意して配置すれば設定変更可能
  - 開発環境（NODE_ENV=development）の場合は`.env.development`が読み込まれる（`.env`は読み込まない）

## Dockerを用いた構築
// TODO
// この方法ではデータベースはローカルのものを使う、もしくは用意しないことも可能です
1. （任意）データベースを用意します
1. リポジトリよりbuild もしくは `taichanne30/yamag`イメージを利用します
1. `docker run`コマンドを用いて実行してください

## Docker-Composeを用いた構築
この方法ではデータベースも同時に用意可能です
### 公式イメージを用いる場合
※こちらも参考にしてください( https://github.com/taichanNE30/yamag-docker-compose-example )
1. 適当なディレクトリを作成します
1. リポジトリ内のenv_templatesを参考に`.env.app`, `.env.db`を作成します
1. 以下のdocker-compose.ymlを作成します
```docker-compose.yml
version: '3'
services:
  app:
    image: taichanne30/yamag:master
    restart: always
    links:
      - db
    networks:
      - int_net
      - ext_net
    env_file:
      - .env.app
  db:
    image: postgres:15.3-bullseye
    networks:
      - int_net
    env_file:
      - .env.db
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
networks:
  int_net:
    internal: true
  ext_net:
```
1. （初回起動時のみ）マイグレーションを実行する `docker-compose run -it app pnpm run migrate`
1. `docker-compose up -d`等で起動する

### 自分でビルドする場合（カスタムする場合など）
1. リポジトリをcloneします
1. リポジトリ内のenv_templatesを参考に`.env.app`, `.env.db`を作成します
1. （初回起動時のみ）マイグレーションを実行する `docker-compose run -it app pnpm run migrate`
1. `docker-compose up -d`等で起動する

## LICENCE
このプロジェクトはMPL-2.0を採用しています。
ライセンスに従った形での利用や改変は大歓迎です
