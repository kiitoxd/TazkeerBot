const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
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
const userTimezonesFile = path.join(__dirname, 'userTimezones.json');

// Country to timezone mapping
const countryToTimezone = {
  'usa': 'America/New_York',
  'united states': 'America/New_York',
  'us': 'America/New_York',
  'uk': 'Europe/London',
  'united kingdom': 'Europe/London',
  'britain': 'Europe/London',
  'egypt': 'Africa/Cairo',
  'saudi arabia': 'Asia/Riyadh',
  'saudi': 'Asia/Riyadh',
  'uae': 'Asia/Dubai',
  'united arab emirates': 'Asia/Dubai',
  'qatar': 'Asia/Qatar',
  'kuwait': 'Asia/Kuwait',
  'bahrain': 'Asia/Bahrain',
  'oman': 'Asia/Muscat',
  'jordan': 'Asia/Amman',
  'lebanon': 'Asia/Beirut',
  'syria': 'Asia/Damascus',
  'iraq': 'Asia/Baghdad',
  'yemen': 'Asia/Aden',
  'palestine': 'Asia/Gaza',
  'turkey': 'Europe/Istanbul',
  'pakistan': 'Asia/Karachi',
  'india': 'Asia/Kolkata',
  'bangladesh': 'Asia/Dhaka',
  'indonesia': 'Asia/Jakarta',
  'malaysia': 'Asia/Kuala_Lumpur',
  'singapore': 'Asia/Singapore',
  'philippines': 'Asia/Manila',
  'thailand': 'Asia/Bangkok',
  'australia': 'Australia/Sydney',
  'canada': 'America/Toronto',
  'france': 'Europe/Paris',
  'germany': 'Europe/Berlin',
  'spain': 'Europe/Madrid',
  'italy': 'Europe/Rome',
  'netherlands': 'Europe/Amsterdam',
  'belgium': 'Europe/Brussels',
  'switzerland': 'Europe/Zurich',
  'sweden': 'Europe/Stockholm',
  'norway': 'Europe/Oslo',
  'denmark': 'Europe/Copenhagen',
  'poland': 'Europe/Warsaw',
  'russia': 'Europe/Moscow',
  'china': 'Asia/Shanghai',
  'japan': 'Asia/Tokyo',
  'south korea': 'Asia/Seoul',
  'brazil': 'America/Sao_Paulo',
  'argentina': 'America/Argentina/Buenos_Aires',
  'mexico': 'America/Mexico_City',
  'south africa': 'Africa/Johannesburg',
  'nigeria': 'Africa/Lagos',
  'kenya': 'Africa/Nairobi',
  'morocco': 'Africa/Casablanca',
  'tunisia': 'Africa/Tunis',
  'algeria': 'Africa/Algiers',
  'libya': 'Africa/Tripoli',
  'sudan': 'Africa/Khartoum',
  'ethiopia': 'Africa/Addis_Ababa'
};

function loadUserTimezones() {
  try {
    if (fs.existsSync(userTimezonesFile)) {
      const data = fs.readFileSync(userTimezonesFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading user timezones:', error);
  }
  return {};
}

function saveUserTimezone(userId, timezone) {
  try {
    const userTimezones = loadUserTimezones();
    userTimezones[userId] = timezone;
    fs.writeFileSync(userTimezonesFile, JSON.stringify(userTimezones, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving user timezone:', error);
    return false;
  }
}

function getUserTimezone(userId) {
  const userTimezones = loadUserTimezones();
  return userTimezones[userId] || null;
}

function getTimezoneFromCountry(country) {
  const normalizedCountry = country.toLowerCase().trim();
  return countryToTimezone[normalizedCountry] || null;
}

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

// Timezone to language mapping (Arabic-speaking countries)
const arabicSpeakingTimezones = [
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Qatar', 'Asia/Kuwait', 'Asia/Bahrain',
  'Asia/Muscat', 'Asia/Amman', 'Asia/Beirut', 'Asia/Damascus', 'Asia/Baghdad',
  'Asia/Aden', 'Asia/Gaza', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Tunis',
  'Africa/Algiers', 'Africa/Tripoli', 'Africa/Khartoum', 'Europe/Istanbul'
];

function getLanguageFromTimezone(timezone) {
  if (arabicSpeakingTimezones.includes(timezone)) {
    return 'arabic';
  }
  return 'english';
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


function sendHadithEmbed(channel, hadith, title = '📖 Hadith of the Hour', language = 'english') {
  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(title)
    .setTimestamp();
  
  // Display based on language preference
  if (language === 'arabic' && hadith.arabic) {
    embed.setDescription(hadith.arabic);
    if (hadith.text) {
      embed.addFields({ name: 'English', value: hadith.text, inline: false });
    }
  } else {
    embed.setDescription(hadith.text);
    if (hadith.arabic) {
      embed.addFields({ name: 'Arabic | العربية', value: hadith.arabic, inline: false });
    }
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
    
    // For channel-wide hadiths, use English as default (can be customized)
    // Or get the most common timezone from users if needed
    const randomHadith = hadiths[Math.floor(Math.random() * hadiths.length)];
    const embed = sendHadithEmbed(channel, randomHadith, '📖 Hadith of the Hour', 'english');
    
    channel.send({ embeds: [embed] });
  });
}

async function sendAdhkarReminder(adhkarList, title, color) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;
  
  // Get the role to mention
  const role = channel.guild.roles.cache.find(r => r.name === config.roleName);
  const roleMention = role ? `<@&${role.id}> ` : '';
  
  const embeds = sendAdhkarEmbeds(channel, adhkarList, title, color);
  
  if (embeds.length > 0) {
    // Send first embed with role mention
    const firstEmbed = embeds[0];
    firstEmbed.setDescription(`${roleMention}**${adhkarList[0].english}**`);
    await channel.send({ embeds: [firstEmbed] });
    
    // Send remaining embeds with delay to avoid rate limiting
    for (let i = 1; i < embeds.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await channel.send({ embeds: [embeds[i]] });
    }
  }
}

function setupMorningAdhkar() {
  if (!prayerTimes.Fajr) return;
  
  const fajrTime = prayerTimes.Fajr;
  const [hours, minutes] = fajrTime.split(':').map(Number);
  
  cron.schedule(`${minutes} ${hours} * * *`, async () => {
    await sendAdhkarReminder(adhkar.morning, 'Morning Adhkar (أذكار الصباح)', 0xFFD700);
  });
}

function setupEveningAdhkar() {
  if (!prayerTimes.Maghrib) return;
  
  const maghribTime = prayerTimes.Maghrib;
  const [hours, minutes] = maghribTime.split(':').map(Number);
  
  cron.schedule(`${minutes} ${hours} * * *`, async () => {
    await sendAdhkarReminder(adhkar.evening, 'Evening Adhkar (أذكار المساء)', 0x4169E1);
  });
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  await getPrayerTimes();
  setupPrayerReminders();
  setupHadiths();
  setupMorningAdhkar();
  setupEveningAdhkar();
  
  cron.schedule('0 0 * * *', async () => {
    await getPrayerTimes();
    setupPrayerReminders();
    setupMorningAdhkar();
    setupEveningAdhkar();
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
    
    // Get user's timezone
    const userTimezone = getUserTimezone(message.author.id);
    if (!userTimezone) {
      return message.reply('❌ Please set your timezone first using `!timezone <country>`. For example: `!timezone USA` or `!timezone Egypt`');
    }
    
    const today = moment().format('YYYY-MM-DD');
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('Today\'s Prayer Times')
      .setDescription(`Prayer schedule for today in your timezone (${userTimezone}):`)
      .setTimestamp();
    
    // Add prayer times for user's timezone
    Object.keys(prayerTimes).forEach(prayer => {
      const meccaTimeStr = prayerTimes[prayer];
      
      // Create moment object in Mecca timezone
      const prayerTimeMecca = moment.tz(`${today} ${meccaTimeStr}`, 'YYYY-MM-DD HH:mm', config.meccaTimezone);
      
      // Convert to user's timezone
      const timeInUserTz = prayerTimeMecca.clone().tz(userTimezone);
      
      embed.addFields({
        name: prayer,
        value: timeInUserTz.format('HH:mm'),
        inline: true
      });
    });
    
    message.reply({ embeds: [embed] });
  }
  
  if (message.content.toLowerCase().startsWith('!timezone')) {
    const args = message.content.split(' ').slice(1);
    
    if (args.length === 0) {
      const currentTimezone = getUserTimezone(message.author.id);
      if (currentTimezone) {
        return message.reply(`Your current timezone is set to: **${currentTimezone}**\n\nTo change it, use: \`!timezone <country>\`\nExample: \`!timezone USA\` or \`!timezone Egypt\``);
      } else {
        return message.reply('You haven\'t set a timezone yet.\n\nUse: `!timezone <country>`\nExample: `!timezone USA` or `!timezone Egypt`');
      }
    }
    
    const countryInput = args.join(' ');
    const timezone = getTimezoneFromCountry(countryInput);
    
    if (!timezone) {
      const availableCountries = Object.keys(countryToTimezone).slice(0, 20).join(', ');
      return message.reply(`❌ Country not found. Please enter a valid country name.\n\nSome examples: USA, UK, Egypt, Saudi Arabia, UAE, Pakistan, India, etc.\n\nAvailable countries include: ${availableCountries}...`);
    }
    
    const success = saveUserTimezone(message.author.id, timezone);
    if (success) {
      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('Timezone Set Successfully')
        .setDescription(`Your timezone has been set to: **${timezone}**\nCountry: **${countryInput}**`)
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    } else {
      message.reply('❌ Failed to save your timezone. Please try again.');
    }
  }
  
  if (message.content.toLowerCase() === '!hadith') {
    const randomHadith = hadiths[Math.floor(Math.random() * hadiths.length)];
    
    // Get user's timezone and determine language
    const userTimezone = getUserTimezone(message.author.id);
    const language = userTimezone ? getLanguageFromTimezone(userTimezone) : 'english';
    
    const embed = sendHadithEmbed(message.channel, randomHadith, '📖 Hadith', language);
    
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
          name: 'Timezone', 
          value: '`!timezone <country>`\nSet your timezone by country name. Example: `!timezone USA` or `!timezone Egypt`', 
          inline: false 
        },
        { 
          name: 'Prayer Times', 
          value: '`!prayertimes`\nShows today\'s prayer schedule in your timezone (set with !timezone)', 
          inline: false 
        },
        { 
          name: 'Hadith', 
          value: '`!hadith`\nGet a random Hadith in your locale language (Arabic for Arabic-speaking countries, English otherwise)', 
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

