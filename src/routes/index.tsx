import { Title } from "@solidjs/meta";
import { useSession } from "~/lib/client/auth";

export default function Home() {
  const session = useSession();

  return (
    <main>
      <Title></Title>
      <h1>Hello, {session().data?.user.name || "Player!"} </h1>

    </main>
  );
}
