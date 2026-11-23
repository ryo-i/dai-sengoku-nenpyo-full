# ローカル開発

Docker と Docker Compose を使います。依存はリポジトリルートの `package-lock.json` を `npm ci` で入れます。

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
npm ci
docker compose up --build
```

DB の公開ポートは `55432` です。このマシンに入っている PostgreSQL の `5432` と重ならないようにしています。コンテナの中から DB を見るときは `db:5432` です。

| サービス | URL |
| --- | --- |
| 画面 | http://localhost:3000 |
| API | http://localhost:3001/ |
| 人物一覧 | http://localhost:3001/persons |
| Swagger | http://localhost:3001/api |
| DB | localhost:55432 |

サンプルの人物は自動では入りません。入れるときは次を実行し、画面を再読み込みします。

```bash
docker compose exec backend npx prisma db seed
```

## Swagger が開かないとき

通常は `http://localhost:3001/api` を開きます。404 になる場合は、DB を Docker で起動したまま backend だけホストで起動します。

```bash
docker compose up -d db
docker compose stop backend
DATABASE_URL=postgres://user:password@127.0.0.1:55432/mydb npm exec --workspace=apps/backend prisma migrate deploy
DATABASE_URL=postgres://user:password@127.0.0.1:55432/mydb BACKEND_PORT=3001 npm run start:dev --workspace=apps/backend
```

この状態で `http://localhost:3001/api` と `http://localhost:3001/api-json` を開けます。Docker の backend に戻すときは `docker compose up --build` です。

## Prisma Studio

```bash
npm run studio
```

- URL: `http://localhost:5555`
- サンプル投入前は `There are no rows in this table` と出ます

`npm run studio` は、ホストから `127.0.0.1:55432` へ接続します。DB プロセスは Docker 内の `db:5432` のままです。

次のエラーは、接続先が別の PostgreSQL になっているときに起きます。

- `Can't reach database server at db:5432`
- `User was denied access on the database`
- `Invalid STUDIO_EMBED_BUILD ...`（詳細表示時に長いスタックが出る）

## Storybook

```bash
npm run storybook
```

- URL: `http://localhost:6006`
- 実行場所はリポジトリのルートです
- 登録している Story は `PersonsView` と `PersonsStatus` です
