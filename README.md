# discord member tracker

<a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=workers,discord,pnpm" />
</a>

Works without a bot, runs on cloudflare workers. Uses a KV store to store the member count, and a cron trigger.

## Environment Variables

- `WEBHOOK`: Webhook URL to post to
- `INVITE`: Invite ID (don't include discord.gg/)
