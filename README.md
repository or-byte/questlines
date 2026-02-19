# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## PayMongo Webhook (using NGROK)

Payment providers like PayMongo require a public HTTPS URL for webhooks.
ngrok creates a secure a public tunnel:
```
https://abc123.ngrok-free.app
```
that forwards to:
```
http://localhost:3000
```

### Setup
1. Install:
```bash
npm install -g ngrok
```
2. Authenticate:
```bash
ngrok config add-authtoken YOUR_TOKEN
```
3. Start tunnnel:
```bash
ngrok http 3000
```
You'll see:
```bash
Forwarding https://abc123.ngrok-free.app -> http://localhost:3000
```
4. In PayMongo Dashboard -> Webhooks:
```
https://abc123.ngrok-free.app/api/webhooks/paymongo
```
This matches the API route.

### Full Local Testing Flow
1. User checksout
2. PayMongo checkout page opens
3. User completes payment
4. PayMongo sends webhook -> ngrok URL
5. ngrok forwards -> localhost
6. SolidJS webhook updates DB

### Debugging Tips
You can view ngrok requests in:
```
http://127.0.0.1:4040
```
You can:
- Inspect request body
- Replay webhook
- See response status

### Production Notes
Do NOT use ngrok in production.

Instead:
- Use real HTTPS domain
- Configure webhook there

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
