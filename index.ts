import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import userRoutes from './routes/userroute';
import MongoDB from './db';



const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', userRoutes);

// MongoDB connection
MongoDB.connect()

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));