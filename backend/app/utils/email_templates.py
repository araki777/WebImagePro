def generate_contact_email_html(contact) -> str:
    return f"""
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
      <h2 style="color: #0070f3;">📩 お問い合わせが届きました</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="font-weight: bold; padding: 6px 0;">👤 名前:</td>
          <td style="padding: 6px 0;">{contact.name}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 6px 0;">✉️ メール:</td>
          <td style="padding: 6px 0;">{contact.email}</td>
        </tr>
      </table>

      <hr style="margin: 20px 0;" />

      <p style="font-weight: bold;">💬 メッセージ:</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
        {contact.message.replace(chr(10), '<br />')}
      </div>

      <hr style="margin: 30px 0;" />

      <p style="font-size: 12px; color: #888;">
        このメールは自動送信されています。返信する場合は上記のメールアドレスをご利用ください。
      </p>
    </div>
    """ 