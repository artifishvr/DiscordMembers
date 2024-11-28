import { ofetch } from "ofetch";
import { createStorage } from "unstorage";
import cloudflareKVBindingDriver from "unstorage/drivers/cloudflare-kv-binding";

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    const WEBHOOK_URL = env.WEBHOOK;
    const INVITE = env.INVITE;

    const kv = createStorage({
      driver: cloudflareKVBindingDriver({ binding: "DISCORDMEMBERS" }),
    });

    try {
      const prevMemberCount: string | null = await kv.getItem("members");
      const prevGuildData = await kv.getItem("guild");

      const inviteData = await ofetch(
        `https://discord.com/api/v10/invites/${INVITE}?with_counts=true`
      );

      const memberCount = inviteData.approximate_member_count;

      if (prevMemberCount !== null) {
        if (memberCount != prevMemberCount) {
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: `Member count changed to ${memberCount} from ${prevMemberCount}`,
            }),
          });
        } else {
          console.log(`Member count unchanged from ${memberCount}`);
        }
      }

      if (prevGuildData !== null) {
        if (prevGuildData !== inviteData.guild) {
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: `Guild changed to \`\`\`${JSON.stringify(
                inviteData.guild
              )}\`\`\` from \`\`\`${JSON.stringify(prevGuildData)}\`\`\``,
            }),
          });
        }
      }

      await kv.set("members", memberCount);
      await kv.set("guild", inviteData.guild);
    } catch (error) {
      console.error("Error fetching Discord members:", error);
    }
  },
};
