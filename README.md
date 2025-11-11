# Stalwart TLSA Updater

This is a NestJS application that receives a webhook event and updates DNS TLSA records based on the current TLS certificates of the Stalwart System. Currently, it supports Cloudflare DNS for managing the TLSA records.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

```bash
docker compose run app pnpm install
docker compose up -d
```
