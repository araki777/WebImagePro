import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateContactEmailHTML({
  subject,
  message,
  name,
  email,
}: {
  subject: string;
  message: string;
  name: string;
  email: string;
}) {
  return `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
      <h2 style="color: #0070f3;">📩 お問い合わせが届きました</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="font-weight: bold; padding: 6px 0;">👤 名前:</td>
          <td style="padding: 6px 0;">${name}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 6px 0;">✉️ メール:</td>
          <td style="padding: 6px 0;">${email}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 6px 0;">📌 件名:</td>
          <td style="padding: 6px 0;">${subject}</td>
        </tr>
      </table>

      <hr style="margin: 20px 0;" />

      <p style="font-weight: bold;">💬 メッセージ:</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
        ${message.replace(/\n/g, "<br />")}
      </div>

      <hr style="margin: 30px 0;" />

      <p style="font-size: 12px; color: #888;">
        このメールは自動送信されています。返信する場合は上記のメールアドレスをご利用ください。
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { to, subject, message, from, name, email } = body;

  if (!to || !subject || !message || !from || !name || !email) {
    return NextResponse.json(
      { success: false, message: "すべての項目を入力してください。" },
      { status: 400 }
    );
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(to)) {
    return NextResponse.json(
      { success: false, message: "有効なメールアドレスを入力してください。" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: [to],
      subject: subject,
      html: generateContactEmailHTML({ subject, message, name, email }),
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: "メール送信に失敗しました", error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "送信成功", data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "予期しないエラー", error },
      { status: 500 }
    );
  }
}
