const mongoose = require('mongoose');
require('dotenv').config(); // if you're using environment variables for the MongoDB URI

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to MongoDB');

  // Create the unique index
  try {
    await mongoose.connection.collection('messages').createIndex(
      { senderId: 1, receiverId: 1, text: 1, createdAt: 1 },
      { unique: true }
    );
    console.log('Unique index created successfully');
  } catch (error) {
    console.error('Error creating unique index:', error);
  } finally {
    mongoose.connection.close();
  }
}).catch(error => console.error('MongoDB connection error:', error));
