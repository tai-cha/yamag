FROM node:18.17.0-bullseye

WORKDIR /

# Install pnpm
RUN npm i -g pnpm

# Files required by pnpm install
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Bundle app source
COPY . .

RUN pnpm build

CMD [ "pnpm", "run", "mentions" ]