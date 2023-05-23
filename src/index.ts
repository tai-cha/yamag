import * as Misskey from 'misskey-js'
import { Server, Note, Record } from './@types'
import { RankElement, usernameWithHost, isRecordInRange } from './utils'
import { Constants } from './utils/constants'
import retry from 'async-retry'

process.env.TZ = 'Asia/Tokyo'
require('dotenv').config()

const today = new Date()
const recordTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 3, 34, 0, 0)

let io:Server = {
  origin: "https://misskey.io",
  credential: process.env.IO_TOKEN || ''
}

const client = new Misskey.api.APIClient(io)
let notes: Array<Note> = []

let postNote = async (text: string) => { 
  const post = await client.request('notes/create', { visibility: "public", text: text })
  console.log(post)
}

const createRanks = (notes: Array<Note>):Array<RankElement> => {
  const counted = new Set<Note['id']>();

  const records:Array<Record> = notes.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  }).map(note => {
    const username = usernameWithHost(note.user)

    if(!counted.has(username)) {
      counted.add(username)
      return { date: new Date(note.createdAt), note }
    }
  }).filter((record): record is Exclude<typeof record, undefined> => record !== undefined)

  const inRange:Array<Record> = records.filter(record => isRecordInRange(record, recordTime))

  const ranked:Array<RankElement> = []
  inRange.forEach((record, i, org) => {
    let rank = 1;
    if (i > 0) {
      rank = record.date.getTime() === org[i - 1].date.getTime() ? ranked[i - 1].rank : i + 1
    }
    ranked.push(new RankElement(rank, record))
  })

  return ranked
}

const showRanking = (ranked: Array<RankElement>, all: number) => {
  let rankUserText:string = ranked.filter(el => el.rank <= 10).map(el => 
    `${Constants.rankEmojis[el.rank - 1]} @/${el.username} +${el.formattedDiff(recordTime)}`
  ).join("\n")
  return `Today's 334 Top 10\n\n${rankUserText}\n\n有効記録数：${ranked.length}\nフライング記録数：${all - ranked.length}`
}

const getLastNote = (notes:Array<Note>) => notes.slice(-1)[0];

const getNotes = async ():Promise<Array<Note>> => {
  const since = recordTime.getTime() - (60 * 1000)
  const until = recordTime.getTime() + (60 * 1000)
  const options = {
    excludeNsfw: false,
    limit: 100,
    sinceDate: since
  }
  console.log('loading notes...')
  let notes = await retry(
    async ()=> await client.request('notes/local-timeline', options),
    { retries: 5, onRetry: ()=> { console.log("retrying...") } }
  )
  while (new Date(getLastNote(notes).createdAt).getTime() < until) {
    const newNotes = await retry(async ()=> {
        return await client.request('notes/local-timeline', {
          sinceId: getLastNote(notes).id,
          ...options
        })
      }, {
        retries: 5,
        onRetry: ()=> { console.log("retrying...") }
      }
    )
    notes = notes.concat(newNotes)
    console.log(notes.length)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return notes
}

(async ()=>{
  console.log("getNotes start")
  notes = await getNotes()
  console.log("getNotes end")

  let recordedNotes = notes.filter(note => note.text?.match(/(33-?4|:hanshin:)/))
  let ranking = createRanks(recordedNotes)
  let text = showRanking(ranking, recordedNotes.length)
  console.log(text)
  postNote(text)
})()

// 終了時
process.on("exit", async exitCode => {
  
})

// ^C
process.on("SIGINT", ()=> {
  process.exit(0)
})