const dns = require('dns');
const mongoose = require('mongoose');

const PUBLIC_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not configured');
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    const isSrvDnsError =
      uri.startsWith('mongodb+srv://') &&
      error?.code === 'ECONNREFUSED' &&
      error?.message?.includes('querySrv');

    if (!isSrvDnsError) {
      console.error('❌ DB connection error:', error.message);
      process.exit(1);
    }

    try {
      dns.setServers(PUBLIC_DNS_SERVERS);
      await mongoose.connect(uri);
      console.log('✅ MongoDB Atlas connected successfully');
    } catch (retryError) {
      console.error('❌ DB connection error after DNS fallback:', retryError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
