# 大戦国・年表

元の [大戦国・年表](https://github.com/ryo-i/dai-sengoku-nenpyo)（Next.js）を、Next.js と NestJS で作り直すリポジトリです。

## 技術スタック

- フロントエンド: Next.js 15（App Router）、React 19、TypeScript、Tailwind CSS
- バックエンド: NestJS 11、TypeScript
- DB: PostgreSQL 16、Prisma
- API: OpenAPI からフロントの型を生成する。Swagger は `/api`
- テスト: フロントは Vitest と Playwright、バックエンドは Jest
- 開発環境: Docker Compose

## ドキュメント

- 起動、Swagger、Prisma Studio、Storybook: [docs/local.md](docs/local.md)
- いまのコードの置き方: [docs/architecture.md](docs/architecture.md)
- 年表の設計: [docs/design/policy.md](docs/design/policy.md)
- デプロイ: [docs/deploy.md](docs/deploy.md)
- ドキュメントの目次: [docs/index.md](docs/index.md)
