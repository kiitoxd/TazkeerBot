const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');
const config = require('./config.json');
const hadiths = require('./hadiths.json');
const adhkar = require('./adhkar.json');

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
      
      // Get the role to mention
      const role = channel.guild.roles.cache.find(r => r.name === config.roleName);
      const roleMention = role ? `<@&${role.id}>` : '';
      
      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`🕌 ${prayer} Prayer Time`)
        .setDescription(`${roleMention ? roleMention + ' ' : ''}It's time for ${prayer} prayer. May Allah accept your prayers.`)
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

function sendHadithEmbed(channel, hadith, title = '📖 Hadith of the Hour') {
  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(title)
    .setDescription(hadith.text)
    .setTimestamp();
  
  if (hadith.arabic) {
    embed.addFields({ name: 'Arabic | العربية', value: hadith.arabic, inline: false });
  }
  
  if (hadith.narrator) {
    embed.addFields({ name: 'Narrated by', value: hadith.narrator, inline: true });
  }
  
  if (hadith.reference) {
    embed.addFields({ name: 'Reference', value: hadith.reference, inline: true });
  }
  
  if (hadith.source) {
    embed.setURL(hadith.source);
  }
  
  return embed;
}

function sendAdhkarEmbeds(channel, adhkarList, title, color) {
  const embeds = [];
  
  // Split adhkar into chunks to avoid embed limits (Discord allows max 6000 characters per embed)
  // We'll send each adhkar as a separate embed or group them
  adhkarList.forEach((dhikr, index) => {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${title} - ${index + 1}/${adhkarList.length}`)
      .setDescription(`**${dhikr.english}**`)
      .addFields({ 
        name: 'Arabic | العربية', 
        value: dhikr.arabic, 
        inline: false 
      });
    
    if (dhikr.repetitions > 1) {
      embed.addFields({ 
        name: 'Repetitions', 
        value: `${dhikr.repetitions} times`, 
        inline: true 
      });
    }
    
    if (dhikr.reference) {
      embed.addFields({ 
        name: 'Reference', 
        value: dhikr.reference, 
        inline: true 
      });
    }
    
    embed.setTimestamp();
    embeds.push(embed);
  });
  
  return embeds;
}

function setupHadiths() {
  cron.schedule('0 * * * *', () => {
    const channel = client.channels.cache.get(config.channelId);
    if (!channel) return;
    
    const randomHadith = hadiths[Math.floor(Math.random() * hadiths.length)];
    const embed = sendHadithEmbed(channel, randomHadith);
    
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
    
    // Convert prayer times to different timezones
    const timezones = {
      'UK (London)': 'Europe/London',
      'Egypt (Cairo)': 'Africa/Cairo',
      'USA (New York)': 'America/New_York',
      'Mecca': config.meccaTimezone
    };
    
    const today = moment().format('YYYY-MM-DD');
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('🕌 Today\'s Prayer Times')
      .setDescription('Prayer schedule for today in different timezones:')
      .setTimestamp();
    
    // Add prayer times for each timezone
    Object.keys(prayerTimes).forEach(prayer => {
      const meccaTimeStr = prayerTimes[prayer];
      const [hours, minutes] = meccaTimeStr.split(':').map(Number);
      
      // Create moment object in Mecca timezone
      const prayerTimeMecca = moment.tz(`${today} ${meccaTimeStr}`, 'YYYY-MM-DD HH:mm', config.meccaTimezone);
      
      let timezoneValues = '';
      Object.keys(timezones).forEach(tzName => {
        const tz = timezones[tzName];
        const timeInTz = prayerTimeMecca.clone().tz(tz);
        timezoneValues += `**${tzName}**: ${timeInTz.format('HH:mm')}\n`;
      });
      
      embed.addFields({
        name: prayer,
        value: timezoneValues,
        inline: true
      });
    });
    
    message.reply({ embeds: [embed] });
  }
  
  if (message.content.toLowerCase() === '!hadith') {
    const randomHadith = hadiths[Math.floor(Math.random() * hadiths.length)];
    const embed = sendHadithEmbed(message.channel, randomHadith, '📖 Hadith');
    
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
  
  if (message.content.toLowerCase() === '!azkaralsabah' || message.content.toLowerCase() === '!azkarsabah') {
    const embeds = sendAdhkarEmbeds(message.channel, adhkar.morning, '🌅 Morning Adhkar (أذكار الصباح)', 0xFFD700);
    
    // Send first embed as reply, then send the rest
    if (embeds.length > 0) {
      await message.reply({ embeds: [embeds[0]] });
      
      // Send remaining embeds (Discord allows up to 10 embeds per message, but we'll send separately for clarity)
      for (let i = 1; i < embeds.length; i++) {
        await message.channel.send({ embeds: [embeds[i]] });
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  if (message.content.toLowerCase() === '!azkaralmasah' || message.content.toLowerCase() === '!azkarmasah') {
    const embeds = sendAdhkarEmbeds(message.channel, adhkar.evening, '🌆 Evening Adhkar (أذكار المساء)', 0x4169E1);
    
    // Send first embed as reply, then send the rest
    if (embeds.length > 0) {
      await message.reply({ embeds: [embeds[0]] });
      
      // Send remaining embeds
      for (let i = 1; i < embeds.length; i++) {
        await message.channel.send({ embeds: [embeds[i]] });
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  if (message.content.toLowerCase() === '!help' || message.content.toLowerCase() === '!commands') {
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('Tazkeer Bot Commands')
      .setDescription('Here are all available commands:')
      .addFields(
        { 
          name: 'Prayer Times', 
          value: '`!prayertimes`\nShows today\'s prayer schedule in multiple timezones (UK, Egypt, USA, Mecca)', 
          inline: false 
        },
        { 
          name: 'Fasting Status', 
          value: '`!fasting`\nShows current fasting status according to Mecca time', 
          inline: false 
        },
        { 
          name: 'Hadith', 
          value: '`!hadith`\nGet a random Hadith with Arabic translation and reference', 
          inline: false 
        },
        { 
          name: 'Morning Adhkar', 
          value: '`!azkaralsabah` or `!azkarsabah`\nDisplay morning supplications (أذكار الصباح)', 
          inline: false 
        },
        { 
          name: 'Evening Adhkar', 
          value: '`!azkaralmasah` or `!azkarmasah`\nDisplay evening supplications (أذكار المساء)', 
          inline: false 
        },
        { 
          name: 'Help', 
          value: '`!help` or `!commands`\nShow this help message', 
          inline: false 
        }
      )
      .setFooter({ text: 'May Allah accept your deeds' })
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }
});

client.login(config.token);

