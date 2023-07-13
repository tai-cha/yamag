import { Record } from "@/@types"
import { entities } from "misskey-js";
import { Constants } from "@/utils/constants";

export class RankElement {
  rank: number
  date: Date
  username: string
  userId: string
  noteId: string
  constructor(rank: number, record: Record) {
    this.rank = rank
    this.date = record.date
    this.username = record.note.user.username
    this.userId = record.note.user.id
    this.noteId = record.note.id
    return this
  }

  getDiff = (baseDate: Date):number => {
    return this.date.getTime() - baseDate.getTime()
  }

  formattedDiff = (baseDate: Date):string => {
    return `${(this.getDiff(baseDate) / 1000).toFixed(3)}s`
  }
}

export function isRecordInRange(record: Record, recordTime: Date) {
  return record.date.getTime() >= recordTime.getTime() &&
    record.date.getTime() < recordTime.getTime() + ( 60 * 1000 )
}

export function usernameWithHost(user: entities.User): string {
  let username = user.username
  if (user.host) username += `@${user.host}`
  return username
}

export function isUserDetailed(user: entities.User): user is entities.UserDetailed {
  return ('isBot' in user)
}

export class Utils {
  static RankElement = RankElement
  static isRecordInRange = isRecordInRange
  static usernameWithHost = usernameWithHost
  static Constants = Constants
}