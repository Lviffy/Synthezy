const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern Mongoose doesn't need these options, but keeping for compatibility
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    
    // Log successful connection details
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // In development, provide more details
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
      console.log('📝 Make sure MongoDB is running on:', process.env.MONGODB_URI);
      console.log('💡 You can start MongoDB with: mongod --dbpath /path/to/your/db');
    }
    
    process.exit(1);
  }
};

// Function to check database connection status
const checkDBConnection = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[state],
    isConnected: state === 1
  };
};

module.exports = { 
  connectDB, 
  checkDBConnection 
};
