import { ofetch } from "ofetch";

export default {
  async scheduled(env: Env) {
    const WEBHOOK_URL = env.WEBHOOK;
    const INVITE = env.INVITE;

    try {
      const prevMemberCount = await env.DISCORDMEMBERS.get("members");
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

      await env.DISCORDMEMBERS.put("members", memberCount);
    } catch (error) {
      console.error("Error fetching Discord members:", error);
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `Error fetching Discord members: ${error}`,
        }),
      });
    }
  },
};
