# ConversationRelay - Dify AI Sample

Using https://dify.ai/ as the Agent Builder with ConversationRelay. This code-sample uses [conversationrelay-bridge npmjs package](https://www.npmjs.com/package/@twilio-forward/conversationrelay-bridge).

## Getting Started

For local development, make sure you have Node and [ngrok](https://ngrok.com/downloads/mac-os) installed.

### Setting up local environment

1) Clone this repo
2) Run `npm install`. Then `cp .env.example .env` and set up the variables. We will get the Flowise values from the next step
3) Modify `handlers/twiml.ts` to change the default greeting message or any other changes you want to ConversationRelay. All available attributes can be found on [TwiML™ Voice: <ConversationRelay>](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay)
4) Run `npm run dev` to start the dev server. Expose your local server to the internet using `ngrok http 8080`
5) Visit Twilio Console page to purchase a number. Then configure the Incoming Webhook to point to `ngrokDomain/twiml`

## Getting Started (Dify)

1) Visit [https://dify.ai/](https://dify.ai/) and sign up for an account
2) Create a new Chatflow and configure it as you see fit.
3) Click on your avatar in the top right corner and select `Settings` then `Model Provider`. Setup the model(s) you want to use and provide the their API keys.
4) Go back to home page and select `Tools` from the top menu bar. Search for `Twilio` and select `Send Message`. Set up the credentials for your Twilio account.
5) Go to `Studio` from the top menu and create click `Create from blank` and select `Chatflow`. Give it a name and description.
6) Delete the `LLM` component. Add a `node` using `+` and select `Agent`. Connect `Start -> Agent -> Answer`.
7) Select `Start` and add a custom `input field`. Choose `Short Text` and set the name as `from` and mark it as `required`.
8) Select `Agent`:
    8.1) For `Agentic Strategy`, select `Agent -> ReAct`
    8.2) For `Model`, choose your favorite model from the dropdown.
    8.3) Add `Twilio - Send Message` to the list of available tools.
    8.4) Add a friendly instruction for the system prompt.
    8.5) Inside the `Query` add the following:
    ```
    Query: {{start.sys.query}}
    Customer Number: {{start.x.from}}
    ConversationId: {{start.sys.conversation_id}}
    ```
    8.6) Enable `memory`
9) Now `publish` your changes.
10) Select `API Access` from the left panel, and click on `API Key` on the top right corner. Create a new service key and save it to `.env` as `DIF_API_KEY`.

You are now ready to call your number!

## Deployment

We suggest using [Fly.IO](https://fly.io/) to host your application. It supports long-running WebSocket connections and is free (when you signup, you have to add your credit card, but you can deploy free servers for testing purposes).

This repo includes the cofiguration for easily deploying the application to Fly.IO. All the configurations are located in the `fly.toml` file.

1) Sign up for [Fly.IO](https://fly.io/) and install/setup the [CLI](https://fly.io/docs/flyctl/).
2) Create a new Fly App: `fly apps create cr-dify`
3) Grab the domain name of your newly created Fly app and update your local `.env` with the `DOMAIN` value.
3) Setup the secrets: `fly secrets import < .env`
4) Deploy the application: `fly deploy`
5) View the logs: `fly logs`

You can now set the Incoming Webhook of your Twilio number to point to `DOMAIN/twiml`.
