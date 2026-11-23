# アーキテクチャ

いま動いている画面と API は、人物の一覧と登録です。年表の時代、場所、勢力は [design/policy.md](design/policy.md) で設計していて、まだこのコードには入っていません。

## バックエンド

機能モジュールの中を、プレゼンテーション層、ドメイン層、データアクセス層に分けます。Prisma はデータアクセス層だけが使います。

```
PersonsController → PersonsService → PersonsRepository → Prisma
```

- `persons/persons.controller.ts` : エンドポイント
- `persons/dto/` : リクエストとレスポンスの DTO。Swagger と class-validator を付ける
- `persons/persons.service.ts` : ユースケース
- `persons/person.ts` : ドメイン型
- `persons/persons.repository.ts` : Prisma
- `app.controller.ts` : ルートメッセージ
- `common/filters/global-exception.filter.ts` : 共通の例外処理

## フロントエンド

Next.js の App Router はルーティングと metadata（OGP）に使います。人物一覧はブラウザから API を呼びます。画面の機能は `features/persons/` にまとめます。

```
Page → Feature（Component / Hook / API） → 共通 axios クライアント
```

- `app/page.tsx` : ページ（Server Component）。`@/features/persons` から `Persons` を呼ぶ
- `features/persons/index.ts` : feature の公開口。`"use client"` の境界にし、ページ本体は Server Component のままにする
- `features/persons/components/Persons.tsx` : データ取得を持つラッパー
- `features/persons/components/PersonsStatus.tsx` : loading と error の表示
- `features/persons/components/PersonsView.tsx` : 表示専用。Storybook で使う
- `features/persons/hooks/usePersons.ts` : データ取得
- `features/persons/api/person-api.ts` : API 呼び出し
- `features/persons/types/person.ts` : 生成型から `Person` と `CreatePersonDto` を再エクスポート
- `lib/api-client.ts` : 共通 axios クライアント
- `lib/openapi.d.ts` : OpenAPI から生成した型。直接編集しない

## API 型

```
backend DTO / Swagger
  → apps/backend/openapi.json
  → apps/frontend/src/lib/openapi.d.ts
  → axios
```

フロントの API 型は OpenAPI から生成します。backend の API を変えたら `npm run generate:api` で更新します。バックエンドのドメイン型は `persons/person.ts` に置きます。

Swagger は `@nestjs/swagger` でコードから生成します。`POST /persons` は `CreatePersonDto` を使い、`ValidationPipe` が不要な項目の除去と型変換をします。

## データベース

backend コンテナは、プロセスの起動前に `prisma migrate deploy` を実行します。適用済みの migration は再実行しません。新しい migration を作るときは `prisma migrate dev` を使います。

`prisma/seed.ts` はローカル確認用です。`Person` を削除してから、織田信長、豊臣秀吉、徳川家康を入れます。起動時には実行しません。

```bash
docker compose exec backend npx prisma db seed
```
