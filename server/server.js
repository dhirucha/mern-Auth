import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import cookieParser from 'cookie-parser';
import connectToDB from './config/db.js';
import authRouter from './routes/authRoutes.js';


const app = express();
const PORT = process.env.PORT || 5000;

connectToDB();


app.use(express.json());
app.use(cors({
    credentials: true,
}));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Api is working');
});

app.use('/api/auth', authRouter)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



