// send.js
import axios from "axios";
import { text } from "express";

export const sendOtp = async (req, res) => {
  const { otp } = req.body;
  const mobile = 8944057306;

  if (!mobile || !otp) return res.status(400).json({ message: "Missing fields" });

  try {
    const payload = {
      messaging_product: "whatsapp",
      to: `91${mobile}`,
      type: "template",
      template: {
        name: "otp",
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
                { type: "text", text: otp },
                { type: "text", text: "10"}
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
                { type: "text", text: otp },
            ]
          }
        ],
      },
    };

    saveOtp(mobile, otp);

    await axios.post(
      `https://graph.facebook.com/${process.env.META_API_V}/${process.env.WP_BUSINESS_NO}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.WP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.error("OTP send error", error.response?.data || error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// controllers/verifyotp.js
const otpStore = new Map(); // In-memory store

export const saveOtp = (mobile, otp, ttlMinutes = 10) => {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  otpStore.set(mobile, { otp, expiresAt });
};

export const checkOtp = (req, res) => {
  const { mobile, otp } = req.body;

  const record = otpStore.get(mobile);
  if (!record)
    return res.status(400).json({ message: "No OTP found for this number" });

  const isExpired = Date.now() > record.expiresAt;
  const isMatch = otp === record.otp;

  if (isExpired) {
    otpStore.delete(mobile);
    return res.status(400).json({ message: "OTP expired" });
  }

  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  otpStore.delete(mobile); // consume OTP
  return res.status(200).json({ message: "OTP verified", success: true });
};

// Export store function to be used in sendOtp.js
export { otpStore };
