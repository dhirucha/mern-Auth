import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { json, text } from "express";

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


export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

    if(!userId || !otp){
      return res.json({ success: false, message: "Missing Details!"})
    }

    try {

      const user = await userModel.findById(userId);

      if(!user){
        return res,json({success: false, message: "user not found"})
      }

      if(user.verifyOtp = '' || user.verifyOtp !== otp ){
        return res.json({ success: false, message: "Invalid otp"})

      }

      if(user.verifyOtpExpiredAt < Date.now()){
        return res.json({ success: false, message: "otp expired!"})

      }

      user.isAccountVerified = true;
      user.verifyOtp = '';
      user.verifyOtpExpiredAt = 0;

      await user.save();

      return res.json({success: true, message: "Email verified successfully"})
      
    } catch (error) {
      return res.json({ success: false, message: error.message})

    }
}


export const isAuthenticated = async (req, res) =>{
    try {

      return res.json({success: true})
      
    } catch (error) {
       res.json({ success: false, message: error.message})

    }
}


//send password reset otp
export const sendResetOtp = async (req, res) => {
  const {email} = req.body;

  if(!email){
    return res.json({success: false, message: "Email is required"})
  }
  try {

    const user = await userModel.findOne({email});
    if(!user){
      return res.json({success: false, message: "user not found"})
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpiredAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password reset otp",
            text: `Your otp: ${otp} to reset password`
        };

        await transporter.sendMail(mailOption);

        return res.json({success: true, message: "OTP sent to your email"})

    
  } catch (error) {
    return res.json({success: false, message: error.message})
  }
}

//reset user password 
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;

    if(!email || !otp || !newPassword){
      return res.json({success: false, message: "Email, otp and new password required"})
    }

    try {

      const user = await userModel.findOne({email});

      if(!user){
        return res.json({success: false, message: "user not found"});

      }

      if(user.resetOtp === '' || user.resetOtp !== otp){
        return res.json({success: false, message: "invalid otp"});
      }

      if(user.resetOtpExpiredAt < Date.now()){
        return res.json({success: false, message: "otp expired"});
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      user.resetOtp = '';
      user.resetOtpExpiredAt = 0;

      await user.save();

      return res.json({success: true, message: 'password has been reset successfully'});

    } catch (error) {
      return res.json({success: true, message: error.message})
    }
}