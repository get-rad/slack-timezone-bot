/**
 * When anyone in a channel bot is invited to sends a messages with a time
 * string, this handler activates and posts another message with same
 * time in timezones of all users in the channel.
 */
import { Slackbot } from '@xene/slack'
import * as moment from 'moment-timezone'
import { Moment } from 'moment'

const token = process.env['TOKEN']
const slack = new Slackbot({ botToken: token }).listen()

/**
 * Matches time strings in free form text
 * 12:12am, 1:02 am, 1 AM
 * 23:23, 11:11, 10:10 PM
 * 1 pm est, 15:20 MSK, 12 am UTC
 */
const TIME_RX = /[1-9]\d?(([:]\d{2}([ ]?(AM|PM)?))|([ ]?(AM|PM)))/i
const TIMEZONE_RX = /(PST|EST|GMT|UTC|CET|MSK)/i
const TIMEZONE_ABBR = {"PST":"America/Los_Angeles",
                       "EST":"America/New_York",
                       "GMT":"UTC",
                       "UTC":"UTC",
                       "CET":"Europe/Rome",
                       "MSK":"Europe/Moscow"
                       }

const hasTimeString = (s: string) => TIME_RX.test(s)
const parseTime = (s: string) => s.match(TIME_RX)[0]
const hasTimeZoneString = (s: string) => TIMEZONE_RX.test(s)
const parseTimeZone = (s: string) => s.match(TIMEZONE_RX)[0]

const clockEmoji = (m: Moment) => `:clock${(m.hours() % 12) || 12}:`
const normalizeTime = (s: string) => moment(s, 'h:mA').format('h:mm A')
const normalizeZone = (o: number) => moment().utcOffset(o).format('Z')
const userZone = (id: string) => slack.users.info(id).then(i => i.tzOffset / 60)
const timeInZone = (t: string, z: string) => moment(`${t} ${z}`, 'h:mm A Z')
const slackTime = (m: Moment) => `<!date^${m.unix()}^{time} in your time zone|${m.format('h:m A z')}>`

slack.rtm.on('message', async ({ text, user, channel }) => {
  text = text.toUpperCase()
  if (!hasTimeString(text) || slack.bot.id === user) return
  const timeString = normalizeTime(parseTime(text))
  const parsedTime = moment(timeString, 'h:mm A')
  if (!parsedTime.isValid()) return
  if (hasTimeZoneString(text)) {
    var tz = TIMEZONE_ABBR[parseTimeZone(text)]
    var now = moment().toDate() // Because of daylight saving time
    var timeZone = moment.tz(now, tz).format('Z')
  } else {
    var timeZone = normalizeZone(await userZone(user))
  }
  const time = timeInZone(timeString, timeZone)
  const options = { asUser: false, username: 'Your time', iconEmoji: clockEmoji(parsedTime) }
  slack.chat.postMessage(channel, { text: `*${timeString}* is *${slackTime(time.utc())}*.` }, options)
})
