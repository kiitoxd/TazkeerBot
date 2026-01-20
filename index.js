const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');
const config = require('./config.json');
const hadiths = require('./hadiths.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let prayerTimes = {};
const meccaLocation = { lat: 21.4225, lon: 39.8262 };

async function getPrayerTimes() {
  try {
    const today = moment().format('YYYY-MM-DD');
    const response = await axios.get(
      `https://api.aladhan.com/v1/timings/${today}?latitude=${meccaLocation.lat}&longitude=${meccaLocation.lon}&method=4`
    );
    
    if (response.data?.data?.timings) {
      const timings = response.data.data.timings;
      prayerTimes = {
        Fajr: timings.Fajr,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha
      };
      console.log('Prayer times loaded successfully:', prayerTimes);
      return true;
    }
  } catch (error) {
    console.error('Failed to get prayer times:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }
  }
  return false;
}

function getMeccaTime() {
  return moment().tz(config.meccaTimezone);
}

function checkRamadan() {
  const meccaTime = getMeccaTime();
  const year = meccaTime.year();
  
  const ramadanDates = {
    2024: { start: '2024-03-11', end: '2024-04-09' },
    2025: { start: '2025-03-01', end: '2025-03-30' },
    2026: { start: '2026-02-18', end: '2026-03-19' }
  };
  
  if (!ramadanDates[year]) return false;
  
  const today = meccaTime.format('YYYY-MM-DD');
  return today >= ramadanDates[year].start && today <= ramadanDates[year].end;
}

function isFastingTime() {
  if (!checkRamadan()) return false;
  
  const meccaTime = getMeccaTime();
  const hour = meccaTime.hour();
  const minute = meccaTime.minute();
  
  if (hour < 4 || (hour === 4 && minute < 30)) return false;
  if (hour >= 18) return false;
  
  return true;
}

function setupPrayerReminders() {
  Object.keys(prayerTimes).forEach(prayer => {
    const time = prayerTimes[prayer];
    const [hours, minutes] = time.split(':').map(Number);
    
    cron.schedule(`${minutes} ${hours} * * *`, () => {
      const channel = client.channels.cache.get(config.channelId);
      if (!channel) return;
      
      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`🕌 ${prayer} Prayer Time`)
        .setDescription(`It's time for ${prayer} prayer. May Allah accept your prayers.`)
        .setTimestamp();
      
      channel.send({ embeds: [embed] });
    });
  });
}

function setupFastingReminders() {
  cron.schedule('*/30 * * * *', () => {
    if (!isFastingTime()) return;
    
    const channel = client.channels.cache.get(config.channelId);
    if (!channel) return;
    
    const meccaTime = getMeccaTime();
    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🌙 Fasting Reminder')
      .setDescription(`Remember, you should be fasting now according to Mecca time (${meccaTime.format('HH:mm')}).`)
      .addFields({ name: 'Current Mecca Time', value: meccaTime.format('MMMM Do YYYY, HH:mm:ss'), inline: false })
      .setTimestamp();
    
    channel.send({ embeds: [embed] });
  });
}

function setupHadiths() {
  cron.schedule('0 * * * *', () => {
    const channel = client.channels.cache.get(config.channelId);
    if (!channel) return;
    
    const randomHadith = hadiths[Math.floor(Math.random() * hadiths.length)];
    
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('📖 Hadith of the Hour')
      .setDescription(randomHadith.text)
      .addFields({ name: 'Narrated by', value: randomHadith.narrator || 'Unknown', inline: true })
      .setTimestamp();
    
    channel.send({ embeds: [embed] });
  });
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  await getPrayerTimes();
  setupPrayerReminders();
  setupFastingReminders();
  setupHadiths();
  
  cron.schedule('0 0 * * *', async () => {
    await getPrayerTimes();
    setupPrayerReminders();
  });
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  // Debug: log when a command is received
  if (message.content.toLowerCase().startsWith('!')) {
    console.log(`Command received: ${message.content} from ${message.author.tag}`);
  }
  
  if (message.content.toLowerCase() === '!prayertimes') {
    // If prayer times are not loaded, try to fetch them
    if (Object.keys(prayerTimes).length === 0) {
      const loadingMsg = await message.reply('⏳ Loading prayer times...');
      const success = await getPrayerTimes();
      if (!success) {
        return loadingMsg.edit('❌ Failed to load prayer times. Please try again later.');
      }
    }
    
    // Check if prayer times are still empty after fetching
    if (Object.keys(prayerTimes).length === 0) {
      return message.reply('❌ Prayer times are not available at the moment. Please try again later.');
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('🕌 Today\'s Prayer Times')
      .setDescription('Prayer schedule for today:')
      .addFields(
        Object.keys(prayerTimes).map(prayer => ({
          name: prayer,
          value: prayerTimes[prayer],
          inline: true
        }))
      )
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }
  
  if (message.content.toLowerCase() === '!fasting') {
    const meccaTime = getMeccaTime();
    const fasting = isFastingTime();
    
    const embed = new EmbedBuilder()
      .setColor(fasting ? 0x2ECC71 : 0xE74C3C)
      .setTitle('🌙 Fasting Status')
      .setDescription(fasting 
        ? `You should be fasting now according to Mecca time.`
        : `You are not required to fast at this moment.`)
      .addFields({ name: 'Current Mecca Time', value: meccaTime.format('MMMM Do YYYY, HH:mm:ss'), inline: false })
      .addFields({ name: 'Is Ramadan?', value: checkRamadan() ? 'Yes' : 'No', inline: true })
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }
});

client.login(config.token);

