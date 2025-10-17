const axios = require("axios");

const API_KEY="S7g48AEgbozuTDhdgE/FpvnerbF7gfEmktlvhQbCqUo62mpgwOfQSQ==";
const BASE_URL="https://api.authsignal.com/v1";

async function sendOTP(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const response = await axios.post(`${BASE_URL}/email/enroll`, {
      email,
      apiKey: API_KEY,
    });
    res.json({ message: 'OTP sent successfully', data: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
}

async function verifyOTP(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'OTP code is required' });

  try {
    const response = await axios.post(`${BASE_URL}/email/verify`, {
      code,
      apiKey: API_KEY,
    });
    if (response.data.isVerified) {
      res.json({ message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
}

module.exports = { sendOTP, verifyOTP };
