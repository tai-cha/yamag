import { PrismaClient } from "@prisma/client";
import Config from "@/utils/config";
import * as Misskey from "misskey-js"
import WebSocket from 'ws';
import { Note } from "./@types";
import YAMAG from "@/utils/misskey"
import { usernameWithHost } from '@/utils'

// load env
Config

let formatOptions:Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Tokyo',
  hour: 'numeric',
  minute: "numeric",
  second: "numeric",
  fractionalSecondDigits: 3
}

const prisma = new PrismaClient();

const getRecordTxt = async (note:Note):Promise<string> => {
  let record = await prisma.rankRecord.findUnique({ where: { noteId:  note.id }, include: { user: true } })

  let username = usernameWithHost(note.user)
  const dateString = new Date(note.createdAt).toLocaleString('ja-jp', formatOptions)
  let rank:number | null | undefined = record?.rank
  let rankText = '未記録'
  
  if (rank !== null && rank !== undefined) {
    if (rank < 0) rankText = 'DQ'
    else rankText = `${rank}位`
  }

  return `@${username}\n順位：${rankText}\nノート時刻：${dateString}`
}

const getStatics = async (u:Misskey.entities.User) => {
  let username = usernameWithHost(u)
  const user = await prisma.user.findFirst({ where: { id: u.id }, include: { rankRecords: true } })
  if (user) {
    const cnt = await prisma.rankRecord.count({ where: { userId: user.id } })
    const rankedInCnt = await prisma.rankRecord.count({ where: { userId: user.id, rank: {gte:1, lte:10} } })
    const firstCnt = await prisma.rankRecord.count({ where: { userId: user.id, rank: 1 } })
    const maxRank = await prisma.rankRecord.findFirst({ where: { userId: user.id, rank: {gte:1} }, orderBy: [{ rank: 'asc' }] })
    const maxRankString = maxRank ? `${maxRank.rank}位` : 'なし'

    return `@${username}\n参加回数：${cnt}\nランクイン回数：${rankedInCnt}\n最高ランク:${maxRankString}\n1位獲得回数：${firstCnt}`;
  } else {
    return `@${username}\n記録なし`
  }
}

(async ()=>{
  const stream = new Misskey.Stream(Config.server.origin, { token: Config.server.credential }, { WebSocket })
  const mainChannel = stream.useChannel('main')
  mainChannel.on('mention', async note => {
    if (note.userId === note.reply?.userId) {
      if(note.reply?.text?.match(Config.matcher)) {
        YAMAG.Misskey.request('notes/reactions/create', { noteId: note.id, reaction: "👍" })
        let text = await getRecordTxt(note.reply)
        YAMAG.Misskey.postNote(text, { replyId: note.id })
      }
    } else if (note.replyId === null || note.reply?.user?.username === Config.userName) {
      YAMAG.Misskey.request('notes/reactions/create', { noteId: note.id, reaction: "👍" })
      if (note.text?.match(/\/follow/)) {
        YAMAG.Misskey.request('following/create', { userId: note.userId })
      } else if (note.text?.match(/\/unfollow/)) {
        YAMAG.Misskey.request('following/delete', { userId: note.userId })
      } else {
        let text = await getStatics(note.user)
        YAMAG.Misskey.postNote(text, { replyId: note.id })
      }
    }
  })
})()
