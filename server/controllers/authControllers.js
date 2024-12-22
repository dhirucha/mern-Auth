import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { text } from "express";

import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing details!" });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      res.json({ success: false, message: "user already exixts!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPassword });
    await user.save(); 

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome",
        text: `Welcome! Your Account has been created with email id: ${email}`
    }

    await transporter.sendMail(mailOptions);

    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.json({
      success: false,
      message: "email or password required!",
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid email",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({success: true, message: "logged out"})

  } catch (error) {
    return res.json({ success: true, message: error.message });
  }
};

//send verification email to user's mail
export const verifyOtp = async (req, res) => {
    try {

        const { userId } = req.body;

        const user = await userModel.findById(userId);

        if(user.isAccountVerified){
            return res.json({success: true, message: "Account already verified"})
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Acount verification otp",
            text: `Your otp: ${otp} to verify your account`
        }

        await transporter.sendMail(mailOption);

        res.json({success: true, message: "Verification otp sent to email"})
        
    } catch (error) {
         res.json({success: false, message: error.message}); 
    }
}
