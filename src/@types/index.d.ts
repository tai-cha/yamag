import { entities } from "misskey-js"

export type Server = {
  origin: string
  credential: string
}

export type Note = entities.Note

export type Record = {
  note: Note,
  date: Date
}

export type RankElement = {
  date: Date,
  username: string,
  rank: number,
  noteId: string
}
