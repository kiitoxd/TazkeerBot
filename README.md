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


