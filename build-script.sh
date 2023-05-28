#!/bin/bash

npm i -g pnpm && pnpm i && pnpm build

# exec if database set
if ! [[ -z "${DATABASE_URL}" ]]; then
  pnpm migrate
fi