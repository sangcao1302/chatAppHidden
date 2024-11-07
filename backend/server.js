require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message'); // Import the Message model

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));

// Track active users by socket ID
const activeUsers = {};

// User signup route
// User signup route
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, age, location, gender } = req.body;
    const parsedAge = Number(age);
    if (isNaN(parsedAge)) {
      return res.status(400).json({ message: 'Age must be a valid number' });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Gender must be either male or female' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      age: parsedAge,
      location,
      gender // Save gender in the database
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
});


// User login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '60d' });
    res.json({ message: 'Login successful', token, userId: user._id });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Message schema with unique index
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ senderId: 1, receiverId: 1, text: 1, createdAt: 1 }, { unique: true });


app.post('/api/messages', async (req, res) => {
  const { senderId, receiverId, text } = req.body;

  const existingMessage = await Message.findOne({
    senderId,
    receiverId,
    text,
    createdAt: { $gt: new Date(Date.now() - 60000) } // 1 minute timeframe
  });

  if (existingMessage) {
    return res.status(400).send('Duplicate message detected');
  }

  const message = new Message({ senderId, receiverId, text });

  try {
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      res.status(400).send('Duplicate message detected');
    } else {
      res.status(500).send('Server error');
    }
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ timestamp: 1 }); // Sort by timestamp for chronological order
    res.json(messages);
  } catch (error) {
    res.status(500).send('Error fetching messages');
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user login via socket
  socket.on('login', async (userId) => {
    activeUsers[socket.id] = userId;
    await User.findByIdAndUpdate(userId, { online: true, isSeekingMatch: false });
    console.log(`User ${userId} logged in with socket ID ${socket.id}`);
  });

  // Start chat and find a match
  // Start chat and find a match
socket.on('startChat', async () => {
  const userId = activeUsers[socket.id];
  if (!userId) {
    return socket.emit('error', 'User is not logged in');
  }

  await User.findByIdAndUpdate(userId, { isSeekingMatch: true });
  const currentUser = await User.findById(userId);

  if (!currentUser) {
    return socket.emit('error', 'Current user not found');
  }

  const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';

  const availableUsers = await User.find({
    _id: { $ne: userId },
    online: true,
    isSeekingMatch: true,
    location: currentUser.location,
    age: { $gte: currentUser.age - 5, $lte: currentUser.age + 5 },
    gender: oppositeGender // Ensure gender is opposite to the current user
  });

  const matchedUser = availableUsers.length ? availableUsers[0] : null;

  if (matchedUser) {
    await User.findByIdAndUpdate(matchedUser._id, { isSeekingMatch: false, matchedUser: userId });
    await User.findByIdAndUpdate(userId, { isSeekingMatch: false, matchedUser: matchedUser._id });

    const matchedUserSocketId = Object.keys(activeUsers).find(
      (key) => activeUsers[key] === matchedUser._id.toString()
    );

    if (matchedUserSocketId) {
      socket.emit('matchedUser', { username: matchedUser.username, id: matchedUser._id });
      io.to(matchedUserSocketId).emit('matchedUser', { username: currentUser.username, id: currentUser._id });
    }
  } else {
    socket.emit('waiting');
  }
});

  socket.on('message', async (message) => {
    const { text, receiverId, senderId } = message;
    // Save the message to MongoDB only if it doesn't already exist


    // Attempt to send the message to the receiver if they are online
    const receiverSocketId = Object.keys(activeUsers).find(key => activeUsers[key] === receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('message', { text, receiverId, senderId  });
        console.log(`Message sent to ${receiverId}`);
    }
});



  socket.on('endChat', async () => {
    const userId = activeUsers[socket.id];
    if (!userId) {
      return socket.emit('error', 'User is not logged in');
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return socket.emit('error', 'Current user not found');
    }

    const matchedUserId = currentUser.matchedUser;

    if (matchedUserId) {
      const matchedUser = await User.findById(matchedUserId);
      if (matchedUser) {
        const matchedUserSocketId = Object.keys(activeUsers).find(
          (key) => activeUsers[key] === matchedUserId.toString()
        );

        try {
          await Message.deleteMany({
            $or: [
              { senderId: userId, receiverId: matchedUserId },
              { senderId: matchedUserId, receiverId: userId }
            ]
          });
          console.log(`Messages between ${userId} and ${matchedUserId} deleted.`);
        } catch (error) {
          console.error('Error deleting messages:', error);
          socket.emit('error', 'Error deleting messages');
        }

        await User.findByIdAndUpdate(userId, { matchedUser: null, isSeekingMatch: false });
        await User.findByIdAndUpdate(matchedUserId, { matchedUser: null, isSeekingMatch: false });

        socket.emit('chatEnded', { message: 'You have ended the chat and messages were cleared.' });
        if (matchedUserSocketId) {
          io.to(matchedUserSocketId).emit('chatEnded', { message: 'The chat was ended by your match and messages were cleared.' });
        }
      }
    } else {
      socket.emit('chatEnded', { message: 'No active chat to end.' });
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    const userId = activeUsers[socket.id];
    if (userId) {
      delete activeUsers[socket.id];
      const currentUser = await User.findByIdAndUpdate(userId, { online: false, inactive: true });
      console.log(`User ${userId} marked as inactive`);
    }
  });

  // Handle user login via socket (for reconnection as well)
  socket.on('login', async (userId) => {
    activeUsers[socket.id] = userId;
    await User.findByIdAndUpdate(userId, { online: true });

    const currentUser = await User.findById(userId);
    if (currentUser.matchedUser) {
      const matchedUserId = currentUser.matchedUser;
      const matchedUser = await User.findById(matchedUserId);

      if (matchedUser) {
        socket.emit('matchedUser', { username: matchedUser.username, id: matchedUser._id });

        const matchedUserSocketId = Object.keys(activeUsers).find(
          (key) => activeUsers[key] === matchedUserId.toString()
        );

        if (matchedUserSocketId) {
          io.to(matchedUserSocketId).emit('matchedUser', { username: currentUser.username, id: userId });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
