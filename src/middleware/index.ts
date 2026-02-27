import { createMiddleware } from "@solidjs/start/middleware";
import { auth } from "~/lib/auth";
import { redirect } from "@solidjs/router";

export default createMiddleware({
  onRequest: async (event) => {
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });

    const user = session?.user;
    const pathname = new URL(event.request.url).pathname;

    if (pathname.endsWith("/admin") && user.role !== "ADMIN") {
      const base = pathname.replace("/admin", "");
      console.log("redirecting...")
      return redirect(base);
    }
  },
});