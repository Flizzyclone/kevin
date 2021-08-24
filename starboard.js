//CORE LIBRARIES
const fs = require('fs')
//discord
const Discord = require("discord.js");

const config = require('./config.json');

const client = new Discord.Client({
    ws: { intents: ["GUILDS","GUILD_EMOJIS","GUILD_MEMBERS","GUILD_MESSAGES","GUILD_MESSAGE_REACTIONS"] },
    partials: ['MESSAGE','REACTION']
});

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('server', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'data/starDB.sqlite',
});

const starDB = sequelize.define('starDB', {
    reaction_msg: {
      type: Sequelize.STRING,
      unique: false,
      primaryKey: false,
    },
    starboard_msg: {
      type: Sequelize.STRING,
      unique: false,
    }
},{
    freezeTableName: true
});

const userDB = sequelize.define('userDB', {
    user_id: {
      type: Sequelize.STRING,
      unique: true,
      primaryKey: true,
    },
    stars: {
      type: Sequelize.INTEGER,
      unique: false,
    }
},{
    freezeTableName: true
});

starDB.sync();
userDB.sync();

let settings = JSON.parse(fs.readFileSync('./data/starsettings.json'));

let starboardchannelid = settings.starboardchannel;
let starsrequired = settings.starsreq;
let emoji;

let blacklistedchannels = settings.blacklistedchannels;

let starchannel;

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    starchannel = client.channels.cache.get(starboardchannelid);
    let GTV = await client.guilds.fetch(config.guildId);
    emoji = GTV.emojis.resolve(config.starboardEmoji);
});

client.on("message", async (msg) => {
    if (msg.author.id != config.clientID) {
    var args = msg.content.split(" ");
    for (i=0; i < args.length; i++) {
        args[i] = args[i].toLowerCase();
    }
    switch (args[0]) {
        case "!gtv": case "kevin":
            if (args[1] == 'star') {
                    if (args[2] == 'channel') {
                        let admin = false;
                        try {
                            admin = msg.member.hasPermission('ADMINISTRATOR');
                        } catch (e) {
                            msg.channel.send("Must do this command in a server where starboard is!");
                            return;
                        }
                        if (admin == true || msg.author.id == config.caretakerId) {
                            let channelid = args[3];
                            channelid = channelid.replace('>','');
                            channelid = channelid.replace('#','');
                            channelid = channelid.replace('<','');
                            try {
                                settings.starboardchannel = channelid;
                                fs.writeFileSync('./data/starsettings.json', JSON.stringify(settings));
                                starchannel = client.channels.cache.get(channelid);
                                starboardchannelid = settings.starboardchannel;
                                msg.channel.send(`Starboard channel set to ${starchannel}!`);
                                return;
                            } catch(e) {
                                console.error(e);
                                msg.channel.send("There was an error setting the starboard channel.");
                                return;
                            }
                        } else {
                            msg.channel.send("You are not an admin, you can't do that");
                            return;
                        }
                    }
                    if (args[2] == 'load') {
                        let admin = false;
                        try {
                            admin = msg.member.hasPermission('ADMINISTRATOR');
                        } catch (e) {
                            msg.channel.send("Must do this command in server where starboard is!");
                            return;
                        }
                        if (admin == true || msg.author.id == config.caretakerId) {
                            try {
                                await msg.channel.messages.fetch(args[3]);
                                msg.channel.send("Message cached.");
                                return;
                            } catch(e) {
                                console.error(e);
                                msg.channel.send("There was an error catching the requested message.");
                                return;
                            } 
                        } else {
                            msg.channel.send("You are not an admin, you can't do that");
                            return;
                        }
                    }
                    if (args[2] == 'force') {
                        let admin = false;
                        try {
                            admin = msg.member.hasPermission('ADMINISTRATOR');
                        } catch (e) {
                            msg.channel.send("Must do this command in a server where starboard is!");
                            return;
                        }
                        if (admin == true || msg.author.id == config.caretakerId) {
                            try {
                                let reactionmsg = await msg.channel.messages.fetch(args[3]);
                                let starcontentmsg = (`${emoji} ${starsrequired.toString()} | ${reactionmsg.channel}`);
                                let starmessage = new Discord.MessageEmbed;
                                starmessage.color = '#FFAC33';
                                starmessage.setAuthor(reactionmsg.author.tag, reactionmsg.author.avatarURL());
                                if (reactionmsg.content != '' && reactionmsg.content != null) {
                                    if (reactionmsg.content.length > 500) {
                                        let contentTrim = reactionmsg.content.substring(0, Math.min(reactionmsg.content.length, 500));
                                        contentTrim = contentTrim + '...';
                                        starmessage.addField('Message', contentTrim);
                                    } else {
                                        starmessage.addField('Message', reactionmsg.content);
                                    }
                                }
                                if (reactionmsg.attachments.size > 0) {
                                    let attachments = reactionmsg.attachments.array();
                                    starmessage.setImage(attachments[0].url);
                                }
                                starmessage.addField('\u200B',`[Jump to Message](${reactionmsg.url})`);
                                starmessage.setFooter('ID: ' + reactionmsg.id);
                                starmessage.setTimestamp();
                                starchannel.send({
                                    "content": starcontentmsg,
                                    "embed": starmessage
                                });
                                return;
                            } catch(e) {
                                console.error(e);
                                msg.channel.send("There was an error catching the requested message.");
                                return;
                            } 
                        } else {
                            msg.channel.send("You are not an admin, you can't do that");
                            return;
                        }
                    }
                    if (args[2] == 'blacklist') {
                        let admin = false;
                        try {
                            admin = msg.member.hasPermission('ADMINISTRATOR');
                        } catch (e) {
                            msg.channel.send("Must do this command in a server where starboard is");
                            return;
                        }
                        if (admin == true || msg.author.id == config.caretakerId) {
                            if (args[3] == '' || args[3] == undefined || args[3] == null) {
                                if (settings.blacklistedchannels.length == 0) {
                                    msg.channel.send("There are no channels in the starboard blacklist.");
                                    return;
                                }
                                let feedback = new Discord.Message;
                                let listcontent = 'Channels Blacklisted:\n';
                                for (let i=0; i < settings.blacklistedchannels.length; i++) {
                                    let channel = client.channels.cache.get(settings.blacklistedchannels[i]);
                                    listcontent = listcontent + `${channel},`;
                                }
                                feedback.content = listcontent.replace(/,[^,]*$/, ''); //regex out the last comma
                                msg.channel.send(feedback);
                                return;
                            }
                            let channelid = args[3];
                            channelid = channelid.replace('>','');
                            channelid = channelid.replace('#','');
                            channelid = channelid.replace('<','');
                            if (settings.blacklistedchannels.indexOf(channelid) != -1) {
                                let channel = client.channels.cache.get(channelid);
                                msg.channel.send(`${channel} already in starboard blacklist!`);
                                return;
                            }
                            try {
                                let channel = client.channels.cache.get(channelid);
                                settings.blacklistedchannels.push(channelid);
                                blacklistedchannels = settings.blacklistedchannels;
                                fs.writeFileSync('./data/starsettings.json', JSON.stringify(settings));
                                msg.channel.send(`${channel} added to starboard blacklist!`);
                                return;
                            } catch(e) {
                                console.error(e);
                                msg.channel.send('There was an error adding to the blacklist.');
                                return;
                            }
                        } else {
                            msg.channel.send("You are not an admin, you can't do that");
                            return;
                        }
                    }
                    if (args[2] == 'unblacklist') {
                        let admin = false;
                        try {
                            admin = msg.member.hasPermission('ADMINISTRATOR');
                        } catch (e) {
                            msg.channel.send("Must do this command in server where starboard is!");
                            return;
                        }
                        if (admin == true || msg.author.id == config.caretakerId) {
                            let channelid = args[3];
                            channelid = channelid.replace('>','');
                            channelid = channelid.replace('#','');
                            channelid = channelid.replace('<','');
                            if (settings.blacklistedchannels.indexOf(channelid) == -1) {
                                let channel = client.channels.cache.get(channelid);
                                msg.channel.send(`${channel} is not in starboard blacklist!`);
                                return;
                            }
                            try {
                                let channel = client.channels.cache.get(channelid);
                                let index = settings.blacklistedchannels.indexOf(channelid);
                                settings.blacklistedchannels.splice(index,1);
                                blacklistedchannels = settings.blacklistedchannels;
                                fs.writeFileSync('./data/starsettings.json', JSON.stringify(settings));
                                msg.channel.send(`${channel} removed from starboard blacklist!`);
                                return;
                            } catch(e) {
                                console.error(e);
                                msg.channel.send('There was an error removing from the blacklist.');
                                return;
                            }
                        } else {
                            msg.channel.send("You are not an admin, you can't do that");
                            return;
                        }
                    }
                    if (args[2] == 'starsrequired') {
                        let admin = false;
                        try {
                            admin = msg.member.hasPermission('ADMINISTRATOR');
                        } catch (e) {
                            msg.channel.send("Must do this command in server where starboard is!");
                            return;
                        }
                        if (admin == true || msg.author.id == config.caretakerId) {
                            if (args[3] == undefined || args[3] == null || args[3] == '') {
                                msg.channel.send("No number given!");
                                return;
                            }
                            let reqnum = args[3];
                            if (isNaN(reqnum) == true) {
                                msg.channel.send(`${args[3]} is not a number!`);
                                return;
                            }
                            try {
                                settings.starsreq = reqnum;
                                starsrequired = settings.starsreq;
                                fs.writeFileSync('./data/starsettings.json', JSON.stringify(settings));
                                msg.channel.send(`Required number of stars set to ${reqnum}`);
                                return;
                            } catch(e) {
                                console.error(e);
                                msg.channel.send("There was an error changing the number of required stars!");
                                return;
                            }
                        } else {
                            msg.channel.send("You are not an admin, you can't do that");
                            return;
                        }
                    }
                    if (args[2] == 'leaderboard') {
                        if (true) {
                            let embed = new Discord.MessageEmbed;
                            let page;
                            let memberlist = await userDB.findAll();
                            let pages = Math.ceil((memberlist.length / 10));
                            if (args[3] == undefined || args[3] == '' || args[3] == null) {
                                page = 1;
                            } else if (args[3] > 0 && args[3] <= pages) {
                                page = args[3];
                            } else {
                                msg.channel.send("Invalid Page!");
                                return;
                            }
                            let start = ((page - 1) * 10)
                            //fetch usernames
                            let usernames = [];
                            for (i=start; i < (start + 10); i++) {
                                if (memberlist[i] != undefined && memberlist[i] != null && memberlist[i] != '') {
                                    try {
                                        let user = await client.users.fetch(memberlist[i].dataValues.user_id);
                                        usernames.push(user.tag);
                                    } catch(e) {
                                       usernames.push('User not found');
                                    }
                                } else {
                                    break;
                                }
                            }
                            //fetch stars
                            let values = [];
                            let greaterthan = (usernames.length + start - 1);
                            for (i=start; i <= greaterthan; i++) {
                                values.push(memberlist[i].dataValues.stars);
                            }
                            //requester stars/place
                            let requesterstars;
                            if (await userDB.count({where: {user_id: msg.author.id }}) != 0) {
                                let userRow = await userDB.findByPk(msg.author.id);
                                requesterstars = userRow.dataValues.stars;
                            } else {
                                requesterstars = 0;
                            }
                            //embed construction
                            let desc = '';
                            embed.title = `Leaderboard - Page ${page}`;
                            embed.setFooter(`Your stars:⭐${requesterstars} - Page ${page}/${pages}`);
                            for (i=0; i <= (values.length - 1); i++) {
                                if ((start+i+1) > 3) {
                                    desc = desc + `🏅 ${(start+i+1)}: ${usernames[i]} - **${values[i]} stars**\n`;
                                } else if ((start+i+1) == 1) {
                                    desc = desc + `🥇 ${(start+i+1)}: ${usernames[i]} - **${values[i]} stars**\n`;
                                } else if ((start+i+1) == 2) {
                                    desc = desc + `🥈 ${(start+i+1)}: ${usernames[i]} - **${values[i]} stars**\n`;
                                } else if ((start+i+1) == 3) {
                                    desc = desc + `🥉 ${(start+i+1)}: ${usernames[i]} - **${values[i]} stars**\n`;
                                }
                            }
                            embed.description = desc;
                            msg.channel.send(embed);
                        } else {
                            msg.channel.send('Leaderboard functionality is disabled.');
                        }
                    }
                    if (args[2] == 'setstar' && msg.author.id == config.caretakerId) {
                        try {
                            memberDB.update({ stars: Number(args[4]) }, { where: { user_id: args[3] } });
                            msg.channel.send('Done');
                        } catch(e) {
                            console.log(e);
                            msg.channel.send('Error');
                        }
                    }
                }
            }
        }
    })

client.on("messageReactionAdd", async (reaction) => {
    if (reaction.partial) {
        try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			return;
		}
    }
    let reactioncount = reaction.count;
    let reactionmsg = reaction.message;
    if (reaction.emoji.id == emoji.id) {
        if (reactionmsg.channel.id != starboardchannelid && blacklistedchannels.indexOf(reactionmsg.channel.id) == -1) { // not starboard or blacklisted channel
            if (reactioncount >= starsrequired) {
                let users = await reaction.users.fetch();
                users = users.array();
                for(i=0; i < reactioncount; i++) {
                    if (users[i].id == reactionmsg.author.id) {
                        reactioncount = (reactioncount - 1);
                        break;
                    }
                }
                if (reactioncount >= starsrequired) {
                    let starEntry = await starDB.findOne({ where: { reaction_msg: reactionmsg.id }});
                    if (starEntry == null) {
                        let starcontentmsg = (`${emoji} ${reactioncount} | ${reactionmsg.channel}`);
                        let starmessage = new Discord.MessageEmbed;
                        starmessage.color = '#FFAC33';
                        starmessage.setAuthor(reactionmsg.author.tag, reactionmsg.author.avatarURL());
                        if (reactionmsg.content != '' && reactionmsg.content != null) {
                            if (reactionmsg.content.length > 500) {
                                let contentTrim = reactionmsg.content.substring(0, Math.min(reactionmsg.content.length, 500));
                                contentTrim = contentTrim + '...';
                                starmessage.addField('Message', contentTrim);
                            } else {
                                starmessage.addField('Message', reactionmsg.content);
                            }
                        }
                        if (reactionmsg.attachments.size > 0) {
                            let attachments = reactionmsg.attachments.array();
                            starmessage.setImage(attachments[0].url);
                        }
                        starmessage.addField('\u200B',`[Jump to Message](${reactionmsg.url})`);
                        starmessage.setFooter('ID: ' + reactionmsg.id);
                        starmessage.setTimestamp();
                        starchannel.send({
                            "content": starcontentmsg,
                            "embed": starmessage
                        })
                            .then(sentmessage => starDB.create({
                                reaction_msg: reactionmsg.id,
                                starboard_msg: sentmessage.id,
                            }))
                            .catch(console.error);
                        if (await userDB.count({where: {user_id: reactionmsg.id }}) != 0) {
                            let userRow = await userDB.findByPk(reactionmsg.author.id);
                            userRow.increment('stars', { by: reactioncount });
                        } else {
                            userDB.create({ user_id: reactionmsg.author.id, stars: reactioncount})    
                        }
                    } else {
                        if (reactioncount < starsrequired) { //how have you done this
                            let starmessage = await starchannel.messages.fetch(starEntry.dataValues.starboard_msg);
                            try {
                                starmessage.delete();
                            } catch(e) {
                                console.error('problem deleting message ' + starEntry.dataValues.starboard_msg);
                            }
                            await starDB.destroy({ where: { reaction_msg: reactionmsg.id } });
                            return;
                        } else { //if stars is over required count
                            let starcontentmsg = (`${emoji} ${reactioncount} | ${reactionmsg.channel}`);
                            let starmessage = await starchannel.messages.fetch(starEntry.dataValues.starboard_msg);
                            starmessage.edit(starcontentmsg, starmessage.embeds[0]);
                            if (await userDB.count({where: {user_id: reactionmsg.author.id }}) != 0) {
                                let userRow = await userDB.findByPk(reactionmsg.author.id);
                                userRow.increment('stars', { by: 1 });
                            } else {
                                userDB.create({ user_id: reactionmsg.author.id, stars: reactioncount})
                            }
                        }
                    }
                }
            }
        }
    }
})

client.on("messageReactionRemove", async (reaction) => {
    if (reaction.partial) {
        try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			return;
		}
    }
    let reactioncount = reaction.count;
    let reactionmsg = reaction.message;
    if (reaction.emoji.id == emoji.id) {
        if (reactionmsg.channel.id != starboardchannelid && blacklistedchannels.indexOf(reactionmsg.channel.id) == -1) { // not starboard or blacklisted channel
                let users = await reaction.users.fetch();
                users = users.array();
                for(i=0; i < reactioncount; i++) {
                    if (users[i].id == reactionmsg.author.id) {
                        reactioncount = (reactioncount - 1);
                        break;
                    }
                }
                let starEntry = await starDB.findOne({ where: { reaction_msg: reactionmsg.id }});
                if (starEntry != null) {
                    if (reactioncount < starsrequired) {
                        let starmessage = await starchannel.messages.fetch(starEntry.dataValues.starboard_msg);
                        starmessage.delete();
                        await starDB.destroy({ where: { reaction_msg: reactionmsg.id } });
                        if (await userDB.count({where: {user_id: reactionmsg.author.id }}) != 0) {
                            let userRow = await userDB.findByPk(reactionmsg.author.id);
                            userRow.decrement('stars', { by: starsrequired });
                        }
                        return;
                    } else {
                        let starcontentmsg = (`${emoji} ${reactioncount} | ${reactionmsg.channel}`);
                        let starmessage = await starchannel.messages.fetch(starEntry.dataValues.starboard_msg);
                        starmessage.edit(starcontentmsg, starmessage.embeds[0]);
                        if (await userDB.count({where: {user_id: reactionmsg.author.id }}) != 0) {
                            let userRow = await userDB.findByPk(reactionmsg.author.id);
                            userRow.decrement('stars', { by: 1 });
                        }
                    }
                }
        }
    }
})

client.login(config.clientToken);