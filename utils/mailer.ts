import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendWelcomeEMail(
    recipient: string,
    subject: string,
    content: string,
) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject,
        html: content,
    };

    return transporter.sendMail(mailOptions);
}

export async function sendNewsletterEmail(
    recipients: string[],
    subject: string,
    content: string
) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipients,
        subject,
        html: content,
    };

    return transporter.sendMail(mailOptions);
}
