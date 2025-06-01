import express, { json } from 'express';
const app = express()
const port = 3000

app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.get('/auth/slack', (req, res) => {
    const scopes = "channels:read"
    res.redirect(
        `https://slack.com/oauth/v2/authorize?client_id=${slack - client - id}&user_scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(slack - redirect - uri)}`
    )
})


app.get('/auth/slack/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', 'slack-client-id');
        params.append('client_secret', 'slack-client-secret');
        params.append('redirect_uri', 'slack-redirect-uri');

        const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if(tokenResponse.data.ok){
            const accessToken= tokenResponse.data.authed_user.access_token;
            
            const channelResponse = await fetch("https://slack.com/api/conversations.list",{
                headers:{
                    'Authorization': `Bearer ${accessToken}`
                },
            })

            if(channelResponse.data.ok){
                const channels = channelResponse.data.channels
                .map((channel)=>channel.name)
                .join(", ");

                res.send("Auth successful")

            } else{
                res.status(500).send("error getting channels")
            }

        } else{
            res.sendStatus(500)
        }
        
    } catch(error){
        res.status(500).send("error")
    }
})


// Find conversation ID using the conversations.list method
async function findConversation(name) {
    try {
        // Call the conversations.list method using the built-in WebClient
        const result = await fetch('https://slack.com/api/conversations.list', {
            method: "GET",
            headers: {
                'Authorization': 'Bearer xoxb-9003827509328-8973596284547-55U8ZY07gLVJOXzTiA7N8Uhq'
            }
        })

        if (!result.ok) {
            const errorText = await result.text(); // or response.json() if server sends JSON error
            throw new Error(`HTTP error! Status: ${result.status}, Details: ${errorText}`);
        }

        const data = await result.json()
        let conversationId
        for (const channel of data.channels) {
            if (channel.name === name) {
                conversationId = channel.id;

                // Print result
                console.log("Found conversation ID: " + conversationId);
                return conversationId;
                // break;
            }
        }
    }
    catch (error) {
        console.error(error);
    }
}



//get conversation history
async function getMessage(channel, ts) {
    try {
        // const channel = await findConversation("bot-messages");

        const request = await fetch('https://slack.com/api/conversations.history', {
            method: "POST",
            headers: {
                'Authorization': 'Bearer xoxp-9003827509328-9003830613648-8982917109154-c16ad3e4bfa92619122f11ddb0430c6c',
                'Content-type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                'channel': channel,
                'latest': ts,
                'limit': 1,
                'inclusive': true
            })
        })

        if (!request.ok) {
            const errorText = await response.text(); // or response.json() if server sends JSON error
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data = await request.json();
        console.log(data.messages[0].text);

        return data.messages[0].text;

    } catch (error) {
        console.error("Error: ", error)
    }
}

async function sendMessage(message) {
    try {

        const response = await fetch('https://hooks.slack.com/services/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', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                'text': "message"
            })
        })

        if (!response.ok) {
            const errorText = await response.text(); // or response.json() if server sends JSON error
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        console.log("Message sent!")

    } catch (error) {
        console.error("Error: ", error)
    }
}

//send the message at the same time the next day
async function scheduleMessage(channel, text) {
    try {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const tomorrow = now + 86400;
        const temp = now + 100

        const response = await fetch('https://slack.com/api/chat.scheduleMessage', {
            method: "POST",
            headers: {
                'Authorization': 'Bearer xoxp-9003827509328-9003830613648-8982917109154-c16ad3e4bfa92619122f11ddb0430c6c',
                'Content-type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                'channel': channel,
                'post_at': temp,
                'text': text
            })
        })

        if (!response.ok) {
            const errorText = await response.text(); // or response.json() if server sends JSON error
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }
        else {
            const data = await response.json();
            console.log(data)
            console.log("message scheduled!")
        }
    } catch (error) {
        console.error("schedule error:: ", error);
    }
}


async function deleteMessage(channel, ts) {
    try {
        const response = await fetch('https://slack.com/api/chat.delete', {
            method: "POST",
            headers: {
                'Authorization': 'Bearer xoxp-9003827509328-9003830613648-8982917109154-c16ad3e4bfa92619122f11ddb0430c6c',
                'Content-type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                'channel': channel,
                'ts': ts
            })
        })

        if (!response.ok) {
            const errorText = await response.text(); // or response.json() if server sends JSON error
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data = await response.json();
        console.log("message deleted!")
    } catch (error) {
        console.error("Delete error:: ", error);
    }
}

async function updateMessage(channel, ts, text) {
    try {
        const response = await fetch('https://slack.com/api/chat.update', {
            method: "POST",
            headers: {
                'Authorization': 'Bearer xoxb-9003827509328-8973596284547-55U8ZY07gLVJOXzTiA7N8Uhq',
                'Content-type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                'channel': channel,
                'ts': ts,
                'text': text
            })
        })

        if (!response.ok) {
            const errorText = await response.text(); // or response.json() if server sends JSON error
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }
        else {
            const data = await response.json();
            console.log(data)
            console.log("message updated!")
        }
    } catch (error) {
        console.error("Update error:: ", error);
    }

}


app.post('/get-message', async (req, res) => {
    const data = req.body
    const channel = await findConversation(data.channel)
    const message = await getMessage(channel, data.ts)

    res.send({ message: message })
})

app.get('/send-message', (req, res) => {
    const message = req.body
    sendMessage(message)
    res.sendStatus(200)
})

app.post('/delete-message', async (req, res) => {
    const data = req.body
    const channel = await findConversation(data.channel)
    await deleteMessage(channel, data.ts)
    res.sendStatus(200)
})

app.post('/schedule-message', async (req, res) => {
    const data = req.body
    const channel = await findConversation(data.channel)
    await scheduleMessage(channel, data.text)
    res.sendStatus(200)
})

app.post('/update-message', async (req, res) => {
    const data = req.body
    const channel = await findConversation(data.channel)
    await updateMessage(channel, data.ts, data.text)
    res.sendStatus(200)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
