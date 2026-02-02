# Tazkeer Discord Bot

A Discord bot that reminds users of prayer times and shares Hadiths every hour with locale-based language support.

## Features

- Prayer Time Reminders: Automatically sends reminders for all five daily prayers
- Hourly Hadiths: Shares a beautiful Hadith every hour (locale-based: Arabic for Arabic-speaking countries, English otherwise)
- Morning Adhkar: Access authentic morning supplications (أذكار الصباح)
- Evening Adhkar: Access authentic evening supplications (أذكار المساء)
- Locale-Based Language: Hadiths automatically display in Arabic for users in Arabic-speaking countries based on their timezone

## Setup

### Install Dependencies

```bash
npm install
```

### Configure the Bot

Open the `config.json` file and fill in your specific details:

- **bot token**: Your unique bot token from the Developer Portal.
- **Channel ID**: The ID of the channel where reminders will be posted.

**Note**: The bot uses the free Aladhan API, so a prayerApiKey is not required.

### launch the bot

start the bot using the pre-configured start script:

```bash
npm start
or bun start if you're using bun.
```

## Commands

- `!timezone <country>` - Set your timezone by country name. Example: `!timezone USA` or `!timezone Egypt`
- `!prayertimes` - Shows today's prayer schedule in your timezone (set with !timezone)
- `!hadith` - Get a random Hadith in your locale language (Arabic for Arabic-speaking countries, English otherwise)
- `!azkaralsabah` or `!azkarsabah` - Display morning adhkar (أذكار الصباح)
- `!azkaralmasah` or `!azkarmasah` - Display evening adhkar (أذكار المساء)
- `!help` or `!commands` - List all available commands

## how to get channel ID

1. Enable Developer Mode in Discord:
   - Open Discord Settings
   - Go to Advanced → Enable Developer Mode

2. get the Channel ID:
   - Right-click on the Discord channel where you want reminders
   - Click Copy ID (or Copy Channel ID)
   - Paste this ID into `config.json` as the `channelId` value