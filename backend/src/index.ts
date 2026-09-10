import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Chamado TI API is running');
});

// Vercel Functions invoke the exported app directly. The container service
// starts its own HTTP server using the port provided by Vercel.
const isVercelContainer = process.env.VERCEL_CONTAINER_RUNTIME === '1';
if (!process.env.VERCEL || isVercelContainer) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
