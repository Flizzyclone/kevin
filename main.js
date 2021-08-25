//CORE LIBRARIES
const fs = require('fs');
const store = require('data-store')({ path: process.cwd() + '/data/redditpostdata.json' });
//discord
const Discord = require("discord.js");
const client = new Discord.Client;

const config = require('./config.json');

//reddit
const snoowrap = require('snoowrap');

const reddit = new snoowrap({
    userAgent: 'updates a spreadsheet with the list of approved members',
    clientId: config.reddit.credentials.clientId,
    clientSecret: config.reddit.credentials.clientSecret,
    username: config.reddit.credentials.username,
    password: config.reddit.credentials.password
});

const gtvsub = reddit.getSubreddit(config.reddit.subredditName);

const suggestions = require('./suggestions');

const helpmsg = new Discord.MessageEmbed;
helpmsg.title = 'Help';
helpmsg.description = '**Main**\n!gtv help -*Shows this message*\n/demographics - Shows Demographic Information';
//!gtv star leaderboard [page ex. 1,2,3] - *Shows a leaderboard of who has gotten the most stars*;

client.on("ready", async () => {
    checkfornewpost();
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(function tick() {
        checkfornewpost();
    }, 60000);
});

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id == config.guildId) {
        let channel = client.channels.cache.get(config.channels.serverLog);
        channel.send(`Welcome to the server ${member.user.tag}!`)
            .then(msg => msg.react('👋'));
    }
});

client.on("guildMemberRemove", async (member) => {
    if (member.guild.id == config.guildId) {
        client.api.channels(config.channels.serverLog).messages.post({
            data: {
                content:`${member.user.tag} just left the server 🙁`
            }
        });
    }
});

client.on("message", async (msg) => {
    // Birthday Message
    if (msg.author.id != config.clientID) {
        if (msg.author.id == config.birthdayBotId && msg.channel.id == config.channels.birthday) {
            let general = await client.channels.cache.get(config.channels.general);
            general.send(msg.content)
                .then(msg => msg.react('🎂'));
        };
        // DM (Direct Message) Handling
        if (msg.channel.type == 'dm' && msg.author.id !== config.clientID) {
            let GTV = await client.guilds.fetch(config.guildId);
            if (GTV.member(msg.author).roles.cache.has(config.newMemberRole) == false) {
                let date = new Date();
                let datestring = date.toLocaleString('en-GB', { timeZone: 'UTC' });
                content = msg.content;
                if (msg.attachments.array().length > 0) {
                    let attachments = msg.attachments.array();
                    for (i=0; i < attachments.length; i++) {
                        content = content + '\n' + attachments[i].url.toString();
                    } 
                }
                let logchannel = await client.channels.cache.get(config.channels.commands);
                let logmsg = `DM From ${msg.author} at ${datestring}:\n${Discord.Util.removeMentions(content)}`;
                logchannel.send(logmsg);
            }
        }
        let ogargs = msg.content.split(" ");
        var args = msg.content.split(" ");
        for (i=0; i < args.length; i++) {
            args[i] = args[i].toLowerCase();
        }
        //for (i=0; i < args.length; i++) { this was a funny little joke
        //    if (args[i] == 'bill') {
        //        msg.channel.send('BILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILLBILL')
        //    }
        //}
        for (i=0; i < args.length; i++) {
            if (args[i][0] == 't' && args[i+1] != undefined && args[i+1][0] == 'j') {
                let GTV = await client.guilds.cache.get(config.guildId);
                let TJ = GTV.member(client.users.cache.get(config.tjId));
                TJ.setNickname(`${ogargs[i]} ${ogargs[i+1]}`,'Automated TJ Nicknaming');
            }
        }
        if (args[0] == "?suggest") {
            let settings = JSON.parse(fs.readFileSync('./data/suggestiondata.json'));
            let channel = await client.channels.cache.get(settings.suggestionschannel);
            let returnMsg = await suggestions.newSuggestion(msg, channel);
            msg.channel.send(returnMsg.message);
            returnMsg.suggestionMsg.react(config.suggestions.yesEmoji);
            returnMsg.suggestionMsg.react(config.suggestions.neutralEmoji);
            returnMsg.suggestionMsg.react(config.suggestions.noEmoji);
        } else if (args[0] == "?deletesuggestion") {
            if (args[1] == '0') {
                msg.channel.send('Reserved Suggestion Number.');
            }
            let settings = JSON.parse(fs.readFileSync('./data/suggestiondata.json'));
            let suggestionChannel = await client.channels.cache.get(settings.suggestionschannel);
            let response = await suggestions.deleteSuggestion(args[1],msg.author.id);
            if (response.status == false) {
                msg.channel.send(response.error);
            } else {
                let message = await suggestionChannel.messages.fetch(response.message_id);
                message.delete();
                msg.channel.send(`Suggestion #${response.id} deleted. It read ` + '`' + Discord.Util.removeMentions(response.desc) + '`.');
            }
        } else if (args[0] == "?suggestionchannel") { 
            let settings = JSON.parse(fs.readFileSync('./data/suggestiondata.json'));
            let admin = false;
            try {
                admin = msg.member.hasPermission('ADMINISTRATOR');
            } catch (e) {
                msg.channel.send(`Must do this command in server where suggestions is enabled!`);
                return;
            }
            if (admin == true) {
                if (args[1] == null) {
                    msg.channel.send('Please send a channel to change suggestions to.');
                } else {
                    let channelid = args[1];
                    channelid = channelid.replace('>','');
                    channelid = channelid.replace('#','');
                    channelid = channelid.replace('<','');
                    try {
                        console.log(settings.suggestionChannel);
                        let oldchannel = await client.channels.cache.get(settings.suggestionschannel);
                        starchannel = await client.channels.cache.get(channelid);
                        const webhooks = await oldchannel.fetchWebhooks();
		                const webhook = webhooks.first();
                        await webhook.edit({
                            name:msg.author.username,
                            avatar:msg.author.avatarURL(),
                            channel: channelid
                        });
                        settings.suggestionschannel = channelid;
                        fs.writeFileSync('./data/suggestiondata.json', JSON.stringify(settings));
                        msg.channel.send(`Suggestions channel set to ${starchannel}!`);
                        return;
                    } catch(e) {
                        console.error(e);
                        msg.channel.send('`' + e + '`');
                        return;
                    }
                }
            } else {
                msg.channel.send(`You are not an admin, you can't do that`);
                return;
            }
            fs.writeFileSync('./data/suggestiondata.json',JSON.stringify(settings));
        } else if (args[0] == "!gtv") {
            //if (ogargs[1] == "FTRMA") { congrats ziad
            //    const channel = client.channels.cache.get('');
            //    channel.send(`${msg.author} has won the puzzle!`);
            //};
            if (args[1] == 'dm' && msg.member.hasPermission('MANAGE_MESSAGES')) {
                console.log(msg.content);
                let memid = args[2];
                memid = memid.replace('>','');
                memid = memid.replace('!','');
                memid = memid.replace('<@','');
                let member = client.users.cache.get(memid);
                let dm;
                try {
                    dm = await member.createDM();
                  } catch (error) {
                    console.error('cant create dm with user, someone mess up syntax????');
                    let feedback = new Discord.Message;
                    feedback.content = 'Cant find user';
                    msg.channel.send(feedback);
                    return false;
                }
                let msgWords = ogargs;
                let messagetosend = new Discord.Message;
                msgWords.splice(0,3);
                messagetosend.content = msgWords.join(' ');
                if (msg.attachments.array().length > 0) {
                    let attachments = msg.attachments.array();
                    for (i=0; i < attachments.length; i++) {
                        messagetosend.content = messagetosend.content + '\n' + attachments[i].url.toString();
                    } 
                }
                try {
                    dm.send(messagetosend);
                    msg.channel.send("Message Sent!");
                  } catch (error) {
                    console.log(error);
                    console.error('cant send DM');
                    msg.channel.send("Can't send DM");
                }
            }
            if (args[1] == 'msg' && msg.member.hasPermission('MANAGE_MESSAGES')) {
                let memid = args[2];
                memid = memid.replace('>','');
                memid = memid.replace('!','');
                memid = memid.replace('<#','');
                let channel;
                try {
                    channel = client.channels.cache.get(memid);
                  } catch (error) {
                    console.error('cant create dm with user, someone mess up syntax????');
                    msg.channel.send("Can't find channel");
                    return;
                }
                let msgWords = ogargs;
                let messagetosend = new Discord.Message;
                msgWords.splice(0,3);
                messagetosend.content = msgWords.join(' ');
                if (msg.attachments.array().length > 0) {
                    let attachments = msg.attachments.array();
                    for (i=0; i < attachments.length; i++) {
                        messagetosend.content = messagetosend.content + '\n' + attachments[i].url.toString();
                    } 
                }
                try {
                    channel.send(messagetosend);
                    msg.channel.send("Message Sent!");
                  } catch (error) {
                    console.error('cant send message');
                    msg.channel.send("Can't send message");
                }
            }
            if (args[1] == 'embed' && msg.member.hasPermission('MANAGE_MESSAGES')) {
                embed(msg, args);
            }
            if (args[1] == 'help') {
                msg.channel.send(helpmsg);
            }
            if (args[1] == 'demographics') {
                msg.channel.send('Demographics has been moved to a slash command! Type /demographics');
            }
        } else if (args[0] == "!shutdown") {
            msg.channel.send('No.');
        }
    }
});

async function embed(msg, args) {
    const filter = (msg) => msg.author.id != config.clientID;
    let embed = new Discord.MessageEmbed;
    let channelid = args[2];
    channelid = channelid.replace('>','');
    channelid = channelid.replace('<#','');
    await msg.channel.send('What do you want the embed title to be?');
    msg.channel.awaitMessages(filter, { max: 1})
        .then(collected => {
            embed.title = collected.first().content;
            msg.channel.send('What do you want as the description?');
            msg.channel.awaitMessages(filter, { max: 1})
                .then(collected => {
                    embed.description = collected.first().content;
                    let chann = client.channels.cache.get(channelid);
                    chann.send(embed);
                    msg.channel.send('Embed Sent!');
                });
        });
}

async function checkfornewpost() {
    let channel = await client.channels.fetch(config.channels.redditPosts);
    let lastcolor = store.data.lastpostcolor;
    let newcolor = await getnewcolor(lastcolor);
    gtvsub.getNew({limit: 2}).then(newpost => {
        if (newpost[0].title != store.data.lastposttitle) {
            if(newpost[0].title == store.data.secondposttitle) {
                store.set('lastposttitle', newpost[0].title);
                store.set('secondposttitle', newpost[1].title);
                return
            }
            if(store.data.lastpostcolor == 6) {
                store.set('lastpostcolor', 1);
            } else {
                store.set('lastpostcolor', store.data.lastpostcolor + 1);
            }
            store.set('lastposttitle', newpost[0].title);
            store.set('secondposttitle', newpost[1].title);
            let redditpostembed = new Discord.MessageEmbed;
            redditpostembed.title = newpost[0].title;
            redditpostembed.setFooter(`/u/${newpost[0].author.name}`);
            redditpostembed.color = newcolor;
            let link = 'https://reddit.com' + newpost[0].permalink;
            redditpostembed.setURL(link);
            if (newpost[0].post_hint == 'image') {
                redditpostembed.setThumbnail(newpost[0].url);
                redditpostembed.description = newpost[0].url;
            } else if (newpost[0].is_gallery == true) {
                let tempmsg;
                let imglink;
                let imgcaption;
                let imgcaptions = new Array;
                let imgids = new Array;
                for(i=0; i < newpost[0].gallery_data.items.length; i++) {
                    imgids.push(newpost[0].gallery_data.items[i].media_id);
                    imgcaptions.push(newpost[0].gallery_data.items[i].caption);
                }
                redditpostembed.setThumbnail(newpost[0].media_metadata[imgids[0]].s.u);
                for(i=0; i < imgids.length; i++) {
                    imglink = newpost[0].media_metadata[imgids[i]].s.u;
                    if (imgcaptions[i] == '' || imgcaptions[i] == undefined || imgcaptions[i] == null) {
                        imgcaption = ('Image ' + (i+1).toString());
                    } else {
                        imgcaption = imgcaptions[i];
                    }
                    tempmsg = ('[Link]' + '(' + imglink + ')');
                    redditpostembed.addField(imgcaption, tempmsg);
                }
            } else {
                redditpostembed.description = newpost[0].selftext;
            }
            redditpostembed.setTimestamp();
            channel.send(redditpostembed);
        }
    });
}

async function getnewcolor(lastcolor) {
    switch(lastcolor) {
        case 6: //this is up here since it technically shoots back the first color
            return('#E93233');
        case 1:
            return('#FFA131');
        case 2:
            return('#FFF033');
        case 3:
            return('#31974F');
        case 4:
            return('#316EFF');
        case 5:
            return('#8F379F');
    }
}

client.login(config.clientToken);
