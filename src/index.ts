import YAMAG from '@/utils/misskey'
import { Note, Record } from '@/@types'
import { RankElement, usernameWithHost, isRecordInRange } from '@/utils'
import Config from '@/utils/config'
import { Constants } from '@/utils/constants'
import retry from 'async-retry'
import { PrismaClient } from '@prisma/client'

const NOTE_GET_RETRY_COUNT = 15

let notes: Array<Note> = []

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

  const inRange:Array<Record> = records.filter(record => isRecordInRange(record, Config.recordTime))
  const outOfRange:Array<Record> = records.filter(record => !isRecordInRange(record, Config.recordTime))

  const ranked:Array<RankElement> = []
  inRange.forEach((record, i, org) => {
    let rank = 1;
    if (i > 0) {
      rank = record.date.getTime() === org[i - 1].date.getTime() ? ranked[i - 1].rank : i + 1
    }
    ranked.push(new RankElement(rank, record))
  })
  outOfRange.forEach(record => {
    ranked.push(new RankElement(-1, record))
  })

  return ranked
}

const storeRanks = async (ranks:Array<RankElement>) => {
  const prisma = new PrismaClient();
  const date = await prisma.rankDate.findUnique({ where: { date: Config.recordTime } }) ||
               await prisma.rankDate.create({ data: { date: Config.recordTime } })
  const rankRecords = await Promise.all(
    ranks.map(async (rank)  => {
      const userId = rank.userId
      const user = await prisma.user.findUnique({ where: { id: userId } }) ||
                   await prisma.user.create({ data: { id: userId, userName: rank.username} })
      return { rank: rank.rank, userId: user.id, noteId: rank.noteId, rankDateId: date.id, postedAt: rank.date }
    })
  )
  const created = await prisma.rankRecord.createMany({ data: rankRecords, skipDuplicates: true })
  console.log(created)
}

const showRanking = (ranked: Array<RankElement>) => {
  let rankUserText:string = ranked.filter(el => 0 < el.rank && el.rank <= 10).map(el => 
    `${Constants.rankEmojis[el.rank - 1]} @${el.username} +${el.formattedDiff(Config.recordTime)}`
  ).join("\n")
  let validCount = ranked.reduce((acc, curr)=> {
    if (curr.rank > 0) acc += 1
    return acc
  }, 0)
  return `${Config.postTitle}\n\n${rankUserText}\n\n有効記録数：${validCount}\nフライング記録数：${ranked.length - validCount}`
}

const raiseOmittedTimeline = (notes:Note[]) => {
  // misskey.ioでノートが取得できない場合にエラー扱いしてリトライするためにエラーを起こす
  if (notes.filter(note => note.userId === '7rkr4nmz19' && note.text?.includes('読み込み時のタイムライン表示を簡略化')).length >= 2) {
    console.debug('高負荷のためTL取得不可')
    throw new Error('omitted timeline')
  }
}

const getLastNote = (notes:Array<Note>) => notes.slice(-1)[0];

const getNotes = async ():Promise<Array<Note>> => {
  const since = Config.recordTime.getTime() - (60 * 1000)
  const until = Config.recordTime.getTime() + (60 * 1000)
  const options = {
    excludeNsfw: false,
    limit: 100,
    sinceDate: since
  }
  console.log('loading notes...')
  let notes = await retry(
    async ()=> {
      console.log(`Getting first notes (1 minute previous)`)
      const req = await YAMAG.Misskey.request('notes/hybrid-timeline', options)

      raiseOmittedTimeline(req)

      return req
    },
    {
      retries: NOTE_GET_RETRY_COUNT,
      minTimeout: 5000,
      onRetry: (err, num)=> {
        console.log(`get note retrying...${num}`)
        console.debug(err)
      }
    }
  )
  if (notes.length === 0) return []

  while (new Date(getLastNote(notes).createdAt).getTime() < until) {
    const newNotes = await retry(async ()=> {
        console.log(`Getting notes: {sinceId: ${getLastNote(notes).id}}`)
        const req = await YAMAG.Misskey.request('notes/hybrid-timeline', {
          sinceId: getLastNote(notes).id,
          ...options
        })

        raiseOmittedTimeline(req)

        return req
      }, {
        retries: NOTE_GET_RETRY_COUNT,
        minTimeout: 5000,
        onRetry: (err, num)=> {
          console.log(`get note retrying...${num}`)
          console.debug(err)
        }
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

  let regexp = new RegExp(Config.matcher)
  let recordedNotes = notes.filter(note => note.text?.match(regexp))
  let filteredNotes = recordedNotes.filter(note => {
    return !['334', Config.userName].includes(note.user.username) &&
            ['public', 'home'].includes(note.visibility) &&
            note.user.host === null
  })
  console.log(`対象のノート: ${filteredNotes.length}件`)
  let ranking = createRanks(filteredNotes)
  let text = showRanking(ranking)
  console.log("ランキング集計完了\n")
  console.log(text)

  await retry(async() => {
    return await YAMAG.Misskey.postNote(text)
  }, {
    retries: 15,
    minTimeout: 5000,
    onRetry: (err, num)=> {
      console.log(`Retrying: note posting...${num}`)
      console.debug(err)
    }
  }).then(async n => {
    console.log('投稿完了')
  }).catch(err => {
    console.log("ノート投稿の失敗が既定の回数を超えました")
    console.log(err)
  })
  if (Config.isDbEnabled()) {
    storeRanks(ranking)
    console.log('DBに結果を保存しました')
  }
})()
