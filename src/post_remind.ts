import YAMAG from '@/utils/misskey'
import { recordTime, remindPostText } from '@/utils/config'

const getTimeDiff = ():number => {
  let target = recordTime

  if (target.getTime() < new Date().getTime()) {
    target.setDate(target.getDate() + 1)
  }

  return recordTime.getTime() - new Date().getTime();
}

async function main() {
  console.log("Remind Post Script Launched")
  let currentDiff = getTimeDiff()
  if (20 * 1000 <= currentDiff && currentDiff < 5 * 60 * 1000) {
    while (getTimeDiff() > 58.5 * 1000) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    console.log(new Date())
    YAMAG.Misskey.postNote(`${remindPostText}(${recordTime.toLocaleDateString('ja-JP')})`)
  }
}

main()