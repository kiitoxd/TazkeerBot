1. Install Dependencies
**npm install
**
2. Configure the bot
Open the config.json file and fill in your specific details:

bot token: Your unique bot token from the Developer Portal.

Channel ID: The ID of the channel where reminders will be posted.

<<<<<<< HEAD
- Prayer Time Reminders: Automatically sends reminders for all five daily prayers
- Fasting Reminders: Reminds users when they should be fasting according to Mecca timezone during Ramadan
- Hourly Hadiths: Shares a beautiful Hadith every hour
- Morning Adhkar: Access authentic morning supplications (أذكار الصباح)
- Evening Adhkar: Access authentic evening supplications (أذكار المساء)

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

### Launch the Bot

Start the bot using the pre-configured start script:

```bash
npm start
```

## Commands

- `!prayertimes` - Shows today's prayer schedule in multiple timezones (UK, Egypt, USA, Mecca)
- `!fasting` - Shows Ramadan Fasting start/end time according to Mecca time
- `!hadith` - Get a random Hadith with Arabic translation and reference
- `!azkaralsabah` or `!azkarsabah` - Display morning adhkar (أذكار الصباح)
- `!azkaralmasah` or `!azkarmasah` - Display evening adhkar (أذكار المساء)
- `!help` or `!commands` - List all available commands

## How to Get Channel ID

1. Enable Developer Mode in Discord:
   - Open Discord Settings
   - Go to Advanced → Enable Developer Mode

2. Get the Channel ID:
   - Right-click on the Discord channel where you want reminders
   - Click Copy ID (or Copy Channel ID)
   - Paste this ID into `config.json` as the `channelId` value

## Additional Notes

- The bot uses the Aladhan API for prayer times (free, no key required)
- The `prayerApiKey` field in config.json is not currently used by the code
- Fasting reminders are based on Mecca timezone
- Ramadan dates are pre-configured for 2024-2026 (you can extend this)
- Hadiths are stored in `hadiths.json` and can be customized
- Adhkar (supplications) are stored in `adhkar.json` with Arabic text, English translations, and references
- Prayer time reminders automatically mention the @Tazkeer role (configurable in config.json)
=======
Note: The bot uses the free Aladhan API, so a prayerApiKey is not required

3. Launch the Bot
Start the bot using the pre-configured start script:

Bash
**npm start**
>>>>>>> e30269afa6b70e32b95e77b189344c3440a73704
