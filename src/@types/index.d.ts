import { entities } from "misskey-js"

export type Server = {
  origin: string
  credential: string
}

export type Note = entities.note & {
  updatedAt?: Date | null
}

export type Record = {
  note: Note,
  date: Date
}

export type RankElement = {
  date: Date,
  username: string,
  userId: string,
  rank: number,
  noteId: string
}
