import YAMAG from '@/utils/misskey'
import { recordTime, remindPostText } from '@/utils/config'

let now = new Date()
const getTimeDiff = ():number => recordTime.getTime() - new Date().getTime();

async function main() {
  console.log("Remind Post Script Launched")
  let currentDiff = getTimeDiff()
  if (20 * 1000 <= currentDiff && currentDiff < 5 * 60 * 1000) {
    while (getTimeDiff() > 58.5 * 1000) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    console.log(new Date())
    YAMAG.Misskey.postNote(`${remindPostText}(${now.toLocaleDateString('ja-JP')})`)
  }
}

main()