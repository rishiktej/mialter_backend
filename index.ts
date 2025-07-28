import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import userRoutes from './routes/userroute';
import MongoDB from './db';
import adminrouter from './routes/adminroute';



const app = express();
const PORT = process.env.PORT || 443;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/', userRoutes);
app.use('/admin/', adminrouter)

// MongoDB connection
MongoDB.connect()

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));