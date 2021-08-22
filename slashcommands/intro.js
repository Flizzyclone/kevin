//Libraries
//discord
const Discord = require("discord.js");
const client = new Discord.Client({
    ws: { intents: ["DIRECT_MESSAGES","DIRECT_MESSAGE_REACTIONS","GUILDS","GUILD_MEMBERS","GUILD_MESSAGES","GUILD_MESSAGE_REACTIONS"] }
});
let fs = require('fs'); // file system
const roleIDs = JSON.parse(fs.readFileSync('./roles.json','utf-8'));

//other functions
async function updateUserValue(id,prop,val) {
    let data = JSON.parse(fs.readFileSync('./members.json'));
    data[id][prop] = val;
    fs.writeFileSync('./members.json',JSON.stringify(data));
}

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
    var args = msg.content.split(" ");
    let GTV = client.guilds.cache.get('');
    switch (args[0]) {
        case "kevin":
            if (args[1] == 'svm' && msg.member.hasPermission('MANAGE_MESSAGES')) {
                let memid = args[2];
                memid = memid.replace('>','');
                memid = memid.replace('!','');
                memid = memid.replace('<@','');
                try {
                    let member = await client.users.cache.get(memid);
                    let memtosend = await GTV.member(member)
                    initiateVerif(memtosend);
                    msg.channel.send('Message Sent!');
                } catch(e) {
                    console.log(e);
                    msg.channel.send('Member not found!');
                }
            }
            if (args[1] == 'restart') {
                if (msg.channel.type == 'dm') {
                    let mem = await GTV.members.fetch(msg.author.id);
                    console.log(mem);
                    initiateVerif(mem) ;  
                }  
            }
    }
    switch (args[0]) {
        case "!restart":
            if(msg.channel.type == 'dm') {
                let mem = await GTV.members.fetch(msg.author.id);
                initiateVerif(mem)  ; 
                console.log(mem);
            }
    }
});

client.on("guildMemberAdd", async (member) => {
    initiateVerif(member);
});

async function initiateVerif(member) {
    let outputChannel = await client.channels.cache.get('');
    let directmess = await member.createDM();
    try {
        client.api.channels(directmess.id).messages.post({
            data: {
                embed: {
                    title:'Welcome to !',
                    description:'To ensure the safety of our community, we require that you go through an introduction process whereby you need to fill out some basic info about yourself and this bot will set you up with roles. After that, a moderator will review to make sure you are verified and will give you access to the Discord.',
                    color:15282739
                } 
            }
        });
    } catch (error) {
        console.log('cant send DM');
        console.log(error.message);
        if (error.message == 'Cannot send messages to this user') {
            let channel = client.channels.cache.get('');
            channel.send('Hey <@!' + member.id + "> due to your privacy settings, you are unable to proceed with bot verification. If you would prefer to use bot verification, please turn `Allow direct messages from server members` on in `Privacy & Safety` and then DM `!restart` to <@!>. Otherwise, follow the pinned message for manual verification.");
            outputChannel.send(`Couldn't send initial verification message to ${member.id} because of their privacy settings.`);
        } else {
            let channel = client.channels.cache.get('');
            channel.send(error.message);
            outputChannel.send(`Unknown error sending initial DM message to ${member.id}`);
        }
        return
    }
    console.log(member.user.tag + ' joined, messages sent');
    outputChannel.send(`${member.user.tag} joined, messages sent`) //disabled for testing
    let data = JSON.parse(fs.readFileSync('./members.json'));
    if (data[member.id] == null || data[member.id].name == null || data[member.id].age == undefined || data[member.id].sexuality == undefined || data[member.id].romantic == undefined || data[member.id].gender == undefined || data[member.id].pronoun == undefined || data[member.id].region == undefined || data[member.id].alt == undefined) { //if person has not joined b4
        console.log('user not found, adding a row');
        let userObj = new Object;
        userObj.id = member.user.id;
        userObj.tag = member.user.tag;
        data[userObj.id] = userObj;
        fs.writeFileSync('./members.json',JSON.stringify(data));    
        beginningStage(member);
    } else {
        let data = JSON.parse(fs.readFileSync('./members.json'));
        previouslyJoined(member);
        data[member.id].tag = member.user.tag;
    }
};

async function previouslyJoined(member) {
    let data = JSON.parse(fs.readFileSync('./members.json'));
    let directmess = await member.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            embed: {
                title:'Previous Info',
                description:`**Looks like you've joined before! Does all this information still look up to date?**\n\nName: ${data[member.id].name}\nReddit: ${data[member.id].redditname}\nAge: ${data[member.id].age}\nSexuality: ${data[member.id].sexuality}\nRomantic Orientation: ${data[member.id].romantic}\nGender: ${data[member.id].gender}\nPronouns: ${data[member.id].pronoun}\nRegion: ${data[member.id].region}\nAlt Account: ${data[member.id].alt}`
            },
            components: [
                {
                    type:1,
                    components: [
                        {
                            type: 2,
                            label: "Looks Good",
                            style: 3,
                            custom_id: "intro_prevjoin_yes"
                        },
                        {
                            type: 2,
                            label: "No",
                            style: 4,
                            custom_id: "intro_prevjoin_no"
                        }
                    ]
                }
            ]
        }
    });
}

async function previousYes(id) {
    finished(id);
    let data = JSON.parse(fs.readFileSync('members.json'));
    const GTV = client.guilds.cache.get('');
    let member =await GTV.members.fetch(id);
    member.setNickname((data[member.id].name), 'Automated introduction nicknaming');
    role = GTV.roles.cache.find(role => role.name === (data[member.id].age));
    member.roles.add(role);
    role = GTV.roles.cache.find(role => role.name === (data[member.id].sexuality));
    member.roles.add(role);
    role = GTV.roles.cache.find(role => role.name === (data[member.id].romantic));
    member.roles.add(role);
    role = GTV.roles.cache.find(role => role.name === (data[member.id].gender));
    member.roles.add(role);
    role = GTV.roles.cache.find(role => role.name === (data[member.id].pronoun));
    member.roles.add(role);
    role = GTV.roles.cache.find(role => role.name === (data[member.id].region));
    member.roles.add(role);
    if (data[member.id].alt == true) {
        member.roles.add(GTV.roles.cache.get(''));
    }
    if (data[member.id].color != undefined) {
        member.roles.add(GTV.roles.cache.get(data[member.id].color));
    }
    if (data[member.id].interests != undefined) {
        let interests = data[member.id].interests;
        for (i=0; i < interests.length; i++) {
            role = GTV.roles.cache.get(interests[i]);
            member.roles.add(role);
        }
    }
}

async function beginningStage(member) {
    let directmess = await member.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"To start, Do you have a Reddit account?",
            components: [{
                type:1,
                components: [{
                    type: 2,
                    label: "Yes",
                    style: 3,
                    custom_id: "intro_beginning_yes"
                },{
                    type: 2,
                    label: "No",
                    style: 4,
                    custom_id: "intro_beginning_no"
                }]
            }] 
        }
    });
}

async function notOnSub(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"Please verify at ",
            components: [{
                    type:1,
                    components: [{
                        type: 2,
                        label: "Done",
                        style: 3,
                        custom_id: "intro_notOnSub_yes"
                    },{
                        type: 2,
                        label: "Nevermind",
                        style: 4,
                        custom_id: "intro_notOnSub_no"
                    }]
                }]
        }
    });
}

async function wantSub(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"Do you want to verify on the subreddit?",
            components: [{
                    type:1,
                    components: [{
                        type: 2,
                        label: "Yes",
                        style: 3,
                        custom_id: "intro_wantSub_yes"
                    },{
                        type: 2,
                        label: "No",
                        style: 4,
                        custom_id: "intro_wantSub_no"
                    }]
                }]
        }
    });
}

async function redditAccCheck(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"Are you verified on the subreddit?",
            components: [{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Yes",
                            style: 3,
                            custom_id: "intro_redditAccCheck_yes"
                        },{
                            type: 2,
                            label: "No",
                            style: 4,
                            custom_id: "intro_redditAccCheck_no"
                        }]
                }]
        }
    });
}

async function redditUserInput(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    await directmess.send(`Please type your reddit username. You do not have to be approved to complete introduction.`)      
    const filter = (msg) => msg.content
    directmess.awaitMessages(filter, { max: 1})
        .then(collected => {
            let msg = collected.first();
            msg = msg.content.toString();
            msg = msg.replace('u/','');
            msg = msg.replace('/u/','');
            updateUserValue(id,"redditname",msg)
            nameStage(id);
        });
}

async function nameStage(id) {
    const GTV = await client.guilds.fetch('');
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    let member = await GTV.members.fetch(id);
    await directmess.send('Please type your first name. This will be used to set your nickname in the server.')
    const filter = (msg) => msg.content
    directmess.awaitMessages(filter, { max: 1})
        .then(collected => {
            let name = collected.first();
            name = name.toString();
            if (name.length > 31) {
                directmess.send(`Please shorten your nickname to under 32 characters.`);
                nameStage(id);
            } else {
                member.setNickname(name, 'Automated introduction nicknaming')
                stageAge(id)
                updateUserValue(id,"name",name)
            }
        });
}
async function stageAge(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"How old are you?",
            components: [{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "13",
                            style: 1,
                            custom_id: "intro_age_thirteen"
                        },{
                            type: 2,
                            label: "14",
                            style: 1,
                            custom_id: "intro_age_fourteen"
                        },{
                            type: 2,
                            label: "15",
                            style: 1,
                            custom_id: "intro_age_fifteen"
                        },{
                            type: 2,
                            label: "16",
                            style: 1,
                            custom_id: "intro_age_sixteen"
                        },{
                            type: 2,
                            label: "17",
                            style: 1,
                            custom_id: "intro_age_seventeen"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "18",
                            style: 1,
                            custom_id: "intro_age_eighteen"
                        },{
                            type: 2,
                            label: "19",
                            style: 1,
                            custom_id: "intro_age_nineteen"
                        }]
                }]
        }
    });
}

async function addRole(id, category, val) {
    if (val == "none") {
        updateUserValue(id, category, "None");
        return;
    }
    const GTV = client.guilds.cache.get('');
    let member = await GTV.members.fetch(id);
    if (typeof roleIDs[val] == 'object') {
        let role;
        for(let i=0; i < roleIDs[val].length; i++) {
            role = GTV.roles.cache.get(roleIDs[val][i]);
            member.roles.add(role);
        }
        updateUserValue(id,category,role.name);
        return;
    } else {
        let role = GTV.roles.cache.get(roleIDs[val]);
        member.roles.add(role);
        if (category != "color") {
            updateUserValue(id,category,role.name);
        } else {
            updateUserValue(id,category,roleIDs[val]);
        } 
    }
}

async function sexualityStage(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"What sexuality do you identify as?",
            components: [{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Homosexual",
                            style: 1,
                            custom_id: "intro_sexuality_homosexual"
                        },{
                            type: 2,
                            label: "Bisexual",
                            style: 1,
                            custom_id: "intro_sexuality_bisexual"
                        },{
                            type: 2,
                            label: "Pansexual",
                            style: 1,
                            custom_id: "intro_sexuality_pansexual"
                        },{
                            type: 2,
                            label: "Asexual",
                            style: 1,
                            custom_id: "intro_sexuality_asexual"
                        },{
                            type: 2,
                            label: "Demisexual",
                            style: 1,
                            custom_id: "intro_sexuality_demisexual"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Queer",
                            style: 1,
                            custom_id: "intro_sexuality_queersexual"
                        },{
                            type: 2,
                            label: "Graysexual",
                            style: 1,
                            custom_id: "intro_sexuality_grayasexual"
                        },{
                            type: 2,
                            label: "Heterosexual",
                            style: 1,
                            custom_id: "intro_sexuality_heterosexual"
                        },{
                            type: 2,
                            label: "Androsexual",
                            style: 1,
                            custom_id: "intro_sexuality_androsexual"
                        },{
                            type: 2,
                            label: "Gynesexual",
                            style: 1,
                            custom_id: "intro_sexuality_gynesexual"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Ceterosexual",
                            style: 1,
                            custom_id: "intro_sexuality_ceterosexual"
                        },{
                            type: 2,
                            label: "Questioning Sexuality",
                            style: 1,
                            custom_id: "intro_sexuality_sexquestion"
                        },{
                            type: 2,
                            label: "Other",
                            style: 1,
                            custom_id: "intro_sexuality_othersexuality"
                        },{
                            type: 2,
                            label: "None",
                            style: 1,
                            custom_id: "intro_sexuality_none"
                        }]
                }]
        }
    });
}

async function romanticStage(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"What romantic orientation do you identify as?",
            components: [{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Homoromantic",
                            style: 1,
                            custom_id: "intro_romantic_homoromantic"
                        },{
                            type: 2,
                            label: "Biromantic",
                            style: 1,
                            custom_id: "intro_romantic_biromantic"
                        },{
                            type: 2,
                            label: "Panromantic",
                            style: 1,
                            custom_id: "intro_romantic_panromantic"
                        },{
                            type: 2,
                            label: "Aromantic",
                            style: 1,
                            custom_id: "intro_romantic_aromantic"
                        },{
                            type: 2,
                            label: "Demiromantic",
                            style: 1,
                            custom_id: "intro_romantic_demiromantic"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Queer",
                            style: 1,
                            custom_id: "intro_romantic_queerromantic"
                        },{
                            type: 2,
                            label: "Grayromantic",
                            style: 1,
                            custom_id: "intro_romantic_grayromantic"
                        },{
                            type: 2,
                            label: "Heteroromantic",
                            style: 1,
                            custom_id: "intro_romantic_heteroromantic"
                        },{
                            type: 2,
                            label: "Androromantic",
                            style: 1,
                            custom_id: "intro_romantic_androromantic"
                        },{
                            type: 2,
                            label: "Gyneromantic",
                            style: 1,
                            custom_id: "intro_romantic_gyneromantic"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Ceteroromantic",
                            style: 1,
                            custom_id: "intro_romantic_ceteroromantic"
                        },{
                            type: 2,
                            label: "Questioning Romantic Orientation",
                            style: 1,
                            custom_id: "intro_romantic_romanticquestion"
                        },{
                            type: 2,
                            label: "Other",
                            style: 1,
                            custom_id: "intro_romantic_otherromantic"
                        },{
                            type: 2,
                            label: "None",
                            style: 1,
                            custom_id: "intro_romantic_none"
                        }]
                }]
        }
    });
}

async function genderStage(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"Which gender do you identify as? Transgender Male/Female set both the Transgender role and the Male/Female role. If this is not preferable, please use the Male or Female options.",
            components: [{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Male",
                            style: 1,
                            custom_id: "intro_gender_male"
                        },{
                            type: 2,
                            label: "Female",
                            style: 1,
                            custom_id: "intro_gender_female"
                        },{
                            type: 2,
                            label: "Non-Binary",
                            style: 1,
                            custom_id: "intro_gender_nonbinary"
                        },{
                            type: 2,
                            label: "Transgender Male",
                            style: 1,
                            custom_id: "intro_gender_transmale"
                        },{
                            type: 2,
                            label: "Transgender Female",
                            style: 1,
                            custom_id: "intro_gender_transfemale"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Demiboy",
                            style: 1,
                            custom_id: "intro_gender_demiboy"
                        },{
                            type: 2,
                            label: "Demigirl",
                            style: 1,
                            custom_id: "intro_gender_demigirl"
                        },{
                            type: 2,
                            label: "Demigender Non-Binary",
                            style: 1,
                            custom_id: "intro_gender_deminb"
                        },{
                            type: 2,
                            label: "Gender Queer",
                            style: 1,
                            custom_id: "intro_gender_genderqueer"
                        },{
                            type: 2,
                            label: "Gender Fluid",
                            style: 1,
                            custom_id: "intro_gender_genderfluid"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Questioning Gender Identity",
                            style: 1,
                            custom_id: "intro_gender_genderquestion"
                        },{
                            type: 2,
                            label: "Other",
                            style: 1,
                            custom_id: "intro_gender_othergender"
                        },{
                            type: 2,
                            label: "None",
                            style: 1,
                            custom_id: "intro_gender_none"
                        }]
                }]
        }
    });
}

async function pronounStage(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"What are your preferred pronouns?",
            components: [{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "He/Him",
                            style: 1,
                            custom_id: "intro_pronoun_hehim"
                        },{
                            type: 2,
                            label: "She/Her",
                            style: 1,
                            custom_id: "intro_pronoun_sheher"
                        },{
                            type: 2,
                            label: "They/Them",
                            style: 1,
                            custom_id: "intro_pronoun_theythem"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Any Pronouns",
                            style: 1,
                            custom_id: "intro_pronoun_anypronoun"
                        },{
                            type: 2,
                            label: "Ask Pronouns",
                            style: 1,
                            custom_id: "intro_pronoun_askpronoun"
                        },{
                            type: 2,
                            label: "Other Pronouns",
                            style: 1,
                            custom_id: "intro_pronoun_otherpronoun"
                        },{
                            type: 2,
                            label: "No Pronouns",
                            style: 1,
                            custom_id: "intro_pronoun_nopronoun"
                        }
                    ]
            }]
        }
    });
}

async function regionStage(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"Where do you live?",
            components: [{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Europe",
                            style: 1,
                            custom_id: "intro_region_europe"
                        },{
                            type: 2,
                            label: "North America",
                            style: 1,
                            custom_id: "intro_region_northam"
                        },{
                            type: 2,
                            label: "South America",
                            style: 1,
                            custom_id: "intro_region_southam"
                        },{
                            type: 2,
                            label: "Africa",
                            style: 1,
                            custom_id: "intro_region_africa"
                        }]
                },{
                    type: 1,
                    components: [{
                            type: 2,
                            label: "Middle East",
                            style: 1,
                            custom_id: "intro_region_mideast"
                        },{
                            type: 2,
                            label: "Asia",
                            style: 1,
                            custom_id: "intro_region_asia"
                        },{
                            type: 2,
                            label: "Oceania",
                            style: 1,
                            custom_id: "intro_region_oceania"
                        },{
                            type: 2,
                            label: "None",
                            style: 1,
                            custom_id: "intro_region_none"
                        }
                    ]
            }]
        }
    });
}

async function interestsStage(id) {
    updateUserValue(id,"interests",[])
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"What are you interested in? Press the 'Done' button when you are done selecting interests.\n\nSelected the wrong interest? Just click again to deselect!",
        components: [{
            type: 1,
            components: [{
                    type: 2,
                    label: "Art",
                    emoji: {name: "🎨"},
                    style: 1,
                    custom_id: "intro_interest_art"
                },{
                    type: 2,
                    label: "Automobiles",
                    emoji: {name: "🚗"},
                    style: 1,
                    custom_id: "intro_interest_automobiles"
                },{
                    type: 2,
                    label: "Fashion",
                    emoji: {name: "👕"},
                    style: 1,
                    custom_id: "intro_interest_fashion"
                },{
                    type: 2,
                    label: "Food",
                    emoji: {name: "🍔"},
                    style: 1,
                    custom_id: "intro_interest_food"
                },{
                    type: 2,
                    label: "Gaming",
                    emoji: {name: "🎮"},
                    style: 1,
                    custom_id: "intro_interest_gaming"
                }]
        },{
            type: 1,
            components: [{
                    type: 2,
                    label: "History",
                    emoji: {name: "🗓️"},
                    style: 1,
                    custom_id: "intro_interest_history"
                },{
                    type: 2,
                    label: "Literature",
                    emoji: {name: "📖"},
                    style: 1,
                    custom_id: "intro_interest_literature"
                },{
                    type: 2,
                    label: "Movies/TV",
                    emoji: {name: "📺"},
                    style: 1,
                    custom_id: "intro_interest_moviestv"
                },{
                    type: 2,
                    label: "Music",
                    emoji: {name: "🎵"},
                    style: 1,
                    custom_id: "intro_interest_music"
                },{
                    type: 2,
                    label: "Nature",
                    emoji: {name: "🌲"},
                    style: 1,
                    custom_id: "intro_interest_nature"
                }
            ]
        },{
            type: 1,
            components: [{
                    type: 2,
                    label: "Photography",
                    emoji: {name: "📷"},
                    style: 1,
                    custom_id: "intro_interest_photography"
                },{
                    type: 2,
                    label: "Sports/Exercise",
                    emoji: {name: "🏃"},
                    style: 1,
                    custom_id: "intro_interest_sports"
                },{
                    type: 2,
                    label: "Technology",
                    emoji: {name: "💻"},
                    style: 1,
                    custom_id: "intro_interest_tech"
                },{
                    type: 2,
                    label: "Done",
                    style: 3,
                    custom_id: "intro_interestdone_done"
                }
            ]
        }]
        }
    });
}

async function addInterestRole(id, detail) {
    let GTV = client.guilds.cache.get('');
    let roleID = roleIDs[detail];
    let role = GTV.roles.cache.get(roleID);
    let member = await GTV.members.fetch(id);
    member.roles.add(role);
    let data = JSON.parse(fs.readFileSync('members.json'))
    let arr = data[id].interests;
    arr.push(roleID);
    updateUserValue(id,"interests",arr);
}

async function removeInterestRole(id, detail) {
    let GTV = client.guilds.cache.get('');
    let roleID = roleIDs[detail];
    let role = GTV.roles.cache.get(roleID);
    let member = await GTV.members.fetch(id);
    member.roles.remove(role);
    let data = JSON.parse(fs.readFileSync('members.json'))
    let arr = data[id].interests;
    console.log(arr);
    arr = arr.filter(function(role) {
        return role !== roleID;
    });
    console.log(arr);
    updateUserValue(id,"interests",arr);
}

async function colorStage(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"What color do you want your name to be?",
        components: [{
            type: 1,
            components: [{
                    type: 2,
                    label: "Deep Purple",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_deeppurple"
                },{
                    type: 2,
                    label: "Hot Pink",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_hotpink"
                },{
                    type: 2,
                    label: "Lavender",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_lavender"
                },{
                    type: 2,
                    label: "Lavender Tea",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_lavendertea"
                },{
                    type: 2,
                    label: "Pretty in Pink",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_prettyinpink"
                }]
        },{
            type: 1,
            components: [{
                    type: 2,
                    label: "Pastel Violet",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_pastelviolet"
                },{
                    type: 2,
                    label: "Sky Blue",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_skyblue"
                },{
                    type: 2,
                    label: "Angel",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_angel"
                },{
                    type: 2,
                    label: "Ocean Blue",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_oceanblue"
                },{
                    type: 2,
                    label: "Tiffany Blue",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_tiffanyblue"
                }
            ]
        },{
            type: 1,
            components: [{
                    type: 2,
                    label: "Cyan",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_cyan"
                },{
                    type: 2,
                    label: "Forest Green",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_forestgreen"
                },{
                    type: 2,
                    label: "Light Green",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_lightgreen"
                },{
                    type: 2,
                    label: "Lemon",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_lemon"
                },{
                    type: 2,
                    label: "Honey",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_honey"
                }
            ]
        },{
            type: 1,
            components: [{
                    type: 2,
                    label: "Flame Orange",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_flameorange"
                },{
                    type: 2,
                    label: "Tangerine",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_tangerine"
                },{
                    type: 2,
                    label: "Mahogany",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_mahogany"
                },{
                    type: 2,
                    label: "Dark Red",
                    emoji: {id: ""},
                    style: 1,
                    custom_id: "intro_color_darkred"
                },{
                    type: 2,
                    label: "None",
                    style: 1,
                    custom_id: "intro_color_none"
                }
            ]
        }]
        }
    });
}

async function altStage(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            content:"Finally, is this your alt account?",
            components: [
                {
                    type:1,
                    components: [
                        {
                            type: 2,
                            label: "Yes",
                            style: 3,
                            custom_id: "intro_alt_yes"
                        },
                        {
                            type: 2,
                            label: "No",
                            style: 4,
                            custom_id: "intro_alt_no"
                        }
                    ]
                }
            ]
        }
    });
}

async function altAccount(id) {
    let GTV = client.guilds.cache.get('');
    let member = await GTV.members.fetch(id);
    member.roles.add('');
}

async function finished(id) {
    let user = await client.users.fetch(id);
    let directmess = await user.createDM();
    client.api.channels(directmess.id).messages.post({
        data: {
            embed: {
                title:"You're all set!",
                description:"Remember to read #read-me and #rules!\n\nA Moderator will look over your introduction soon, and if all looks good you will gain access to the server.\n\nIf you want to change your roles at any time, you can do so [Here]().",
                color:3249999
            } 
        }
    })
    //get data
    let data = JSON.parse(fs.readFileSync('members.json'))
    if (id == '') {
        client.api.channels('').messages.post({
            data: {
                embed: {
                    title:`New Member - ${data[id].name}/${data[id].tag}`,
                    description:`Discord Tag: ${data[id].tag}\nDiscord ID: ${id}\nFirst Name: ${data[id].name}\nReddit Username: ${data[id].redditname}\nAge: ${data[id].age}\nSexual Orientation: ${data[id].sexuality}\nRomantic Orientation: ${data[id].romantic}\nGender Identity: ${data[id].gender}\nPreferred Pronouns: ${data[id].pronoun}\nAlt Account: ${data[id].alt}`
                }, 
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Deny",
                                style: 4,
                                custom_id: "intro_approval_no"
                            }
                        ]
                    
                    }
                ]
            }
        });
    } else {
        client.api.channels('').messages.post({
            data: {
                embed: {
                    title:`New Member - ${data[id].name}/${data[id].tag}`,
                    description:`Discord Tag: ${data[id].tag}\nDiscord ID: ${id}\nFirst Name: ${data[id].name}\nReddit Username: ${data[id].redditname}\nAge: ${data[id].age}\nSexual Orientation: ${data[id].sexuality}\nRomantic Orientation: ${data[id].romantic}\nGender Identity: ${data[id].gender}\nPreferred Pronouns: ${data[id].pronoun}\nAlt Account: ${data[id].alt}`
                }, 
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Approve",
                                style: 3,
                                custom_id: "intro_approval_yes"
                            },
                            {
                                type: 2,
                                label: "Deny",
                                style: 4,
                                custom_id: "intro_approval_no"
                            }
                        ]
                    
                    }
                ]
            }
        });
    }
}

async function userApproved(id) {
    let GTV = await client.guilds.fetch('');
    let member = await GTV.members.fetch(id);
    let general = await client.channels.fetch('');
    if (member.roles.cache.has('') == false ) {
        role = await GTV.roles.fetch('');
        member.roles.add(role);
    }
    if (member.roles.cache.has('') == true ) {
        role = await GTV.roles.fetch('');
        member.roles.remove(role);
    }
    let welcomesent = await general.send(`Everybody welcome ${member} to the server!`);
    welcomesent.react('👋');
}

client.login("");

module.exports = {
    updateUserValue, addRole, previousYes, redditAccCheck, wantSub, redditUserInput, notOnSub, nameStage, sexualityStage, romanticStage, genderStage, pronounStage, regionStage, interestsStage, colorStage, altStage, altAccount, addInterestRole, removeInterestRole, finished, userApproved
};
