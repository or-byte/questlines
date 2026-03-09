import { Title } from "@solidjs/meta";
import { useSession } from "~/lib/client/auth";
import Button from "~/components/button/Button";
import { createSignal } from "solid-js";

export default function Home() {
  const session = useSession();

  const sendEmail = async (accessToken) => {
    console.log(session());
    const recipient = "czarbdizon@gmail.com";
    const subject = "SolidJS Email";
    const body = "Hello from SolidJS!";

    // 1. Create MIME message
    const message = [
      `To: ${recipient}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      body
    ].join("\n");

    // 2. Base64url encode the message
    const base64Encoded = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 3. Post to Gmail API
    try {
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: base64Encoded }),
        }
      );
      console.log(response);
      
      return await response.json();
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  return (
    <main>
      <Title>Home</Title>
      <h1>Hello, {session().data?.user.name || "Player!"} </h1>
      <Button onClick={sendEmail} class="btn">Send Email</Button>
    </main>
  );
}