import mongoose from 'mongoose';

export const connectDb = async () => {
  const primaryUri = process.env.MONGO_URI || '';
  const fallbackUri = 'mongodb://127.0.0.1:27017/badmintonshop';

  const connect = async (uri) => {
    try {
      const conn = await mongoose.connect(uri);

      console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
      console.log(`Fail to connect to ${uri}. Error: ${error.message}`);

      return false;
    }

    return true;
  };

  if (!(await connect(primaryUri))) {
    console.log('Attempting to connect to the local database...');

    await connect(fallbackUri);
  }
};
