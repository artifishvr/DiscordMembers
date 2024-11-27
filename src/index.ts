import { load } from "cheerio";

export default {
  async scheduled(env: Env) {
    const WEBHOOK_URL = env.WEBHOOK;

    const prevMemberCount = await env.DISCORDMEMBERS.get("members");
    try {
      const html = await fetch(env.INVITE).then((res) => res.text());

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
