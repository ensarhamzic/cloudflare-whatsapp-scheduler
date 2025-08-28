export interface Env {
  PINGER_BASE_URL: string;
  PINGER_BASIC_USER: string;
  PINGER_BASIC_PASS: string;
}

function basicAuth(user: string, pass: string) {
  return "Basic " + btoa(`${user}:${pass}`);
}

export default {
  async scheduled(_ctl: ScheduledController, env: Env): Promise<void> {
    const url = (env.PINGER_BASE_URL ?? "").replace(/\/$/, "") + "/";
    if (!env.PINGER_BASIC_USER || !env.PINGER_BASIC_PASS || !url) {
      throw new Error(
        "Missing env: PINGER_BASE_URL, PINGER_BASIC_USER, PINGER_BASIC_PASS"
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: basicAuth(
            env.PINGER_BASIC_USER,
            env.PINGER_BASIC_PASS
          ),
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
