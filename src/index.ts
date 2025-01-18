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
      driver: cloudflareKVBindingDriver({ binding: env.DISCORDMEMBERS }),
    });

    try {
      const prevMemberCount: number | null = await kv.getItem("members");

      const inviteData = await ofetch(
        `https://discord.com/api/v10/invites/${INVITE}?with_counts=true`
      );

      const memberCount: number = inviteData.approximate_member_count;

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
          await kv.set("members", memberCount);
        } else {
          console.log(`Member count unchanged from ${memberCount}`);
        }
      }
    } catch (error: any) {
      console.error("Error fetching Discord members:", error);
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `Error fetching Discord members ${error}`,
        }),
      });
    }
  },
};
