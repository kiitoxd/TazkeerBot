# Tazkeer Discord Bot

A Discord bot that reminds users of prayer times, fasting schedules according to Mecca timezone, and shares Hadiths every hour.

## Features

- 🕌 **Prayer Time Reminders**: Automatically sends reminders for all five daily prayers
- 🌙 **Fasting Reminders**: Reminds users when they should be fasting according to Mecca timezone during Ramadan
- 📖 **Hourly Hadiths**: Shares a beautiful Hadith every hour

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the bot:
   - Open `config.json`
   - Add your Discord bot token
   - Add your channel ID where reminders should be sent (see instructions below)
   - Note: Prayer API key is not required (bot uses free Aladhan API)

3. Run the bot:
```bash
npm start
```

## Commands

- `!prayertimes` - Shows today's prayer schedule
- `!fasting` - Shows current fasting status according to Mecca time

## Configuration

Edit `config.json` to customize:
- Bot token
- Channel ID for reminders
- Timezone settings
- Prayer API key (optional)

## How to Get Channel ID

1. **Enable Developer Mode in Discord:**
   - Open Discord Settings (⚙️)
   - Go to **Advanced** → Enable **Developer Mode**

2. **Get the Channel ID:**
   - Right-click on the Discord channel where you want reminders
   - Click **Copy ID** (or **Copy Channel ID**)
   - Paste this ID into `config.json` as the `channelId` value

## Notes

- The bot uses the Aladhan API for prayer times (free, no key required)
- The `prayerApiKey` field in config.json is not currently used by the code
- Fasting reminders are based on Mecca timezone
- Ramadan dates are pre-configured for 2024-2026 (you can extend this)
- Hadiths are stored in `hadiths.json` and can be customized

