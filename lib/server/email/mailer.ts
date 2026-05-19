import nodemailer from "nodemailer"

// إنشاء transporter للبريد الإلكتروني
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})


export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationLink: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "تحقق من بريدك الإلكتروني - Play Square",
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>مرحباً ${firstName}!</h2>
          <p>شكراً لتسجيلك في Play Square.</p>
          <p>لإكمال تسجيل حسابك، يرجى الضغط على الرابط أدناه:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #FF3B3F; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            تحقق من البريد الإلكتروني
          </a>
          <p>أو انسخ واللصق هذا الرابط في متصفحك:</p>
          <p>${verificationLink}</p>
          <p style="color: #999; font-size: 12px;">ينتهي صلاحية هذا الرابط بعد 24 ساعة.</p>
        </div>
      `,
    }

    console.log('[Mailer] Attempting to send verification email to:', email);
    await transporter.sendMail(mailOptions)
    console.log('[Mailer] Verification email sent successfully to:', email);
    return true
  } catch (error) {
    console.error("[Mailer] Error sending verification email:", error)
    return false
  }
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  provider: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `مرحباً بك في Play Square - ${provider === "google" ? "Google" : "Email"}`,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>مرحباً ${firstName}!</h2>
          <p>تم إنشاء حسابك بنجاح في Play Square.</p>
          <p>يمكنك الآن البدء في استخدام تطبيقنا والتمتع بجميع المزايا.</p>
          <p style="color: #999; font-size: 12px;">هذا البريد الإلكتروني تم إرساله تلقائياً. يرجى عدم الرد عليه.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}

export async function sendJoinRequestEmail(
  email: string,
  firstName: string,
  requesterName: string,
  teamName: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `طلب انضمام جديد إلى فريقك - ${teamName}`,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>مرحباً ${firstName}!</h2>
          <p>لقد تلقيت طلب انضمام جديد من <strong>${requesterName}</strong> إلى فريقك <strong>${teamName}</strong>.</p>
          <p>يرجى تسجيل الدخول إلى التطبيق لمراجعة الطلب وقبوله أو رفضه.</p>
          <p style="color: #999; font-size: 12px;">هذا البريد الإلكتروني مرسل تلقائياً.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Error sending join request email:", error)
    return false
  }
}

export async function sendJoinRequestResponseEmail(
  email: string,
  firstName: string,
  teamName: string,
  accepted: boolean
): Promise<boolean> {
  try {
    const subject = accepted
      ? `تم قبول طلب الانضمام إلى ${teamName}`
      : `تم رفض طلب الانضمام إلى ${teamName}`
    const message = accepted
      ? `تهانينا ${firstName}! لقد تم قبول طلبك للانضمام إلى فريق ${teamName}. يمكنك الآن الدخول إلى التطبيق والانضمام إلى الفريق.`
      : `مرحباً ${firstName}. نأسف لإبلاغك أن طلبك للانضمام إلى فريق ${teamName} قد تم رفضه. يمكنك تجربة طلب الانضمام إلى فريق آخر.`

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>${accepted ? 'تمت الموافقة!' : 'طلب مرفوض'}</h2>
          <p>${message}</p>
          <p style="color: #999; font-size: 12px;">هذا البريد الإلكتروني مرسل تلقائياً.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Error sending join request response email:", error)
    return false
  }
}
