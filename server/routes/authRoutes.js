import express from 'express';
import { isAuthenticated, login, logout, register, resetPassword, sendResetOtp, verifyEmail, verifyOtp } from '../controllers/authControllers.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, verifyOtp);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.post('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);





export default authRouter;