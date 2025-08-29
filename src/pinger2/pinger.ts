export interface Env {
  PINGER_BASE_URL: string;
  PINGER_BEARER_TOKEN: string;
}

export default {
  async scheduled(_ctl: ScheduledController, env: Env): Promise<void> {
    const url = (env.PINGER_BASE_URL ?? "").replace(/\/$/, "") + "/ping";
    if (!env.PINGER_BEARER_TOKEN || !url) {
      throw new Error("Missing env: PINGER_BASE_URL or PINGER_BEARER_TOKEN");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.PINGER_BEARER_TOKEN}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await res.text().catch(() => "");
      if (!res.ok)
        throw new Error(`HTTP ${res.status}: ${text?.slice(0, 200)}`);

      console.log("[PINGER] OK", res.status, text.slice(0, 200));
    } catch (err: any) {
      clearTimeout(timeout);
      console.error("[PINGER] FAIL", err?.message || String(err));
      throw err;
    }
  },
};
