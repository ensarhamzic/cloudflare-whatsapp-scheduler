export interface Env {
  SENDER_BASE_URL: string;
  SENDER_BEARER_TOKEN: string;
}

export default {
  async scheduled(_ctl: ScheduledController, env: Env): Promise<void> {
    const url =
      (env.SENDER_BASE_URL ?? "").replace(/\/$/, "") + "/send-message";
    if (!env.SENDER_BEARER_TOKEN || !url) {
      throw new Error("Missing env: SENDER_BASE_URL or SENDER_BEARER_TOKEN");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.SENDER_BEARER_TOKEN}`,
        },
        body: JSON.stringify({ ping: "from sender-cron worker" }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await res.text().catch(() => "");
      if (!res.ok)
        throw new Error(`HTTP ${res.status}: ${text?.slice(0, 200)}`);

      console.log("[SENDER] OK", res.status, text.slice(0, 200));
    } catch (err: any) {
      clearTimeout(timeout);
      console.error("[SENDER] FAIL", err?.message || String(err));
      throw err;
    }
  },
};
