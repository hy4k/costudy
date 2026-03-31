# Browserbase Function

Serverless browser automation deployed to [Browserbase](https://browserbase.com).

## Setup

Credentials are in `.env` (not committed). You need:

- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`

## Develop locally

```bash
npm run dev
```

Server runs at http://127.0.0.1:14113. Test with:

```bash
curl -X POST http://127.0.0.1:14113/v1/functions/browserbase-function/invoke \
  -H "Content-Type: application/json" \
  -d '{"params": {"url": "https://news.ycombinator.com"}}'
```

## Deploy

```bash
npm run publish
```

Save the Function ID from the output to invoke the deployed function via the Browserbase API.

## Invoke deployed function

```bash
# Start
curl -X POST "https://api.browserbase.com/v1/functions/YOUR_FUNCTION_ID/invoke" \
  -H "Content-Type: application/json" \
  -H "x-bb-api-key: $BROWSERBASE_API_KEY" \
  -d '{"params": {"url": "https://example.com"}}'

# Poll for result (use the invocation id from the response)
curl "https://api.browserbase.com/v1/functions/invocations/INVOCATION_ID" \
  -H "x-bb-api-key: $BROWSERBASE_API_KEY"
```
