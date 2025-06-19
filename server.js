const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { PORT } = require('./src/config/dotenv');

async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

startServer(); 