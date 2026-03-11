let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();

  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000 - 60000;

  return cachedToken;
}

export const sendConfirmationEmail = async (
  recipient: string,
  subject: string,
  data: {
    transactionId: number,
    startTime: Date,
    endTime: Date,
    venue: string
  }) => {
  const accessToken = await getAccessToken();

  const body = `
      <html>
        <body style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
          <div style="max-width:600px; margin:auto; background:white; border-radius:8px; padding:30px;">
            
            <h2 style="color:#2c7be5; margin-top:0;">Booking Confirmed 🎉</h2>

            <p>Hello,</p>

            <p>Your booking has been <strong>successfully confirmed</strong>. Here are your booking details:</p>

            <table style="width:100%; border-collapse:collapse; margin-top:15px;">
              <tr>
                <td style="padding:8px 0; color:#555;"><strong>Transaction ID</strong></td>
                <td style="padding:8px 0;">#${data.transactionId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#555;"><strong>Date</strong></td>
                <td style="padding:8px 0;">${data.startTime.toLocaleString()} - ${data.endTime.toLocaleString()} </td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#555;"><strong>Host</strong></td>
                <td style="padding:8px 0;">${data.venue}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#555;"><strong>Status</strong></td>
                <td style="padding:8px 0; color:green;"><strong>PAID</strong></td>
              </tr>
            </table>

            <p style="margin-top:25px;">
              If you have any questions, feel free to reply to this email.
            </p>

            <hr style="margin:30px 0; border:none; border-top:1px solid #eee;"/>

            <p style="font-size:12px; color:#888;">
              This is an automated confirmation email.
            </p>

          </div>
        </body>
      </html>
      `;

  const message = [
    `To: ${recipient}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    body
  ].join("\n");

  const base64Encoded = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

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

    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
  }
};