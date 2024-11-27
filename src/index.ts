import { load } from "cheerio";

interface Env {
  DISCORDMEMBERS: KVNamespace;
  WEBHOOK: string;
  INVITE: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    const WEBHOOK_URL = env.WEBHOOK;

    const prevMemberCount = await env.DISCORDMEMBERS.get("members");
    try {
      const response = await fetch(env.INVITE);
      const html = await response.text();

      const $ = load(html);

      const description = $('meta[name="description"]').attr("content");

      const memberMatch = description?.match(/(\d+)\s+members/);

      if (!memberMatch) {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `No match found.`,
          }),
        });
        throw new Error("No member count found");
      }
      const memberCount = memberMatch ? memberMatch[1] : "0";

      if (prevMemberCount !== null) {
        if (memberCount != prevMemberCount) {
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: `member count changed to ${memberCount} <@532053122017787924>`,
            }),
          });
        } else {
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: `member count unchanged: ${memberCount}`,
            }),
          });
        }
      }

      // Store in KV
      await env.DISCORDMEMBERS.put("members", memberCount);
    } catch (error) {
      console.error("Error fetching Discord members:", error);
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `i failed.`,
        }),
      });
    }
  },
};
