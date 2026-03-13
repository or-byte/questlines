import { createMiddleware } from "@solidjs/start/middleware";
import { auth } from "~/lib/server/auth";
import { redirect } from "@solidjs/router";

export default createMiddleware({
  onRequest: async (event) => {
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });

    const user = session?.user;
    const pathname = new URL(event.request.url).pathname;

    // Check if any segment of the path includes "/admin"
    if (pathname.includes("/admin") && user?.role !== "ADMIN") {
      console.log("Redirecting non-admin user from:", pathname);
      const base = pathname.split("/admin")[0] || "/";
      return redirect(base);
    }
  },
});