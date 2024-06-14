const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/messagePost");
const upload = require('../middleware/multer');
const { OAuth2Client } = require("google-auth-library");
const ID = process.env.VITE_REACT_APP_googleauth;
const client = new OAuth2Client(ID);

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      msg: "Bad request. Please add email and password in the request body",
    });
  }

  try {
    const foundUser = await User.findOne({ email });
    if (foundUser) {
      const isMatch = await foundUser.comparePassword(password);
      if (isMatch) {
        const token = jwt.sign(
          { id: foundUser._id, name: foundUser.name },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );
        return res.status(200).json({ msg: "User logged in", token });
      } else {
        return res.status(400).json({ msg: "Bad password" });
      }
    } else {
      return res.status(400).json({ msg: "Bad credentials" });
    }
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};

// Controller function to handle message posting with optional file upload
const messages = async (req, res) => {
  const { id, username, message } = req.body;

  if (!username || (!message && !req.file)) {
    return res.status(400).json({ msg: 'Please provide both username and message or upload a file' });
  }

  try {
    let image = ''; // Initialize imagePath

    if (req.file) {
      // If file was uploaded, set imagePath to the path where multer saved the file
      image = req.file.path;
    }

    // Create a new Message object
    const newMessage = new Message({ id, username, message, image });

    // Save the new message to the database
    await newMessage.save();

    // Return success response
    res.status(201).json({ msg: 'Message posted successfully!', newMessage });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: 'Error posting message', details: error.message });
  }
};
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({});
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages', details: error.message });
  }
};

const updateMessage = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ msg: 'Please provide a message to update' });
  }

  try {
    const updatedMessage = await Message.findByIdAndUpdate(req.params.id, { message }, { new: true });
    if (!updatedMessage) {
      return res.status(404).json({ msg: 'Message not found' });
    }
    res.status(200).json({ msg: 'Message updated successfully', updatedMessage });
  } catch (error) {
    res.status(500).json({ error: 'Error updating message', details: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    if (!deletedMessage) {
      return res.status(404).json({ msg: 'Message not found' });
    }
    res.status(200).json({ msg: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting message', details: error.message });
  }
};

const dashboard = async (req, res) => {
  const luckyNumber = Math.floor(Math.random() * 100);

  res.status(200).json({
    msg: `Hello, ${req.user.name}`,
    secret: `Here is your authorized data, your lucky number is ${luckyNumber}`,
  });
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching users", error: error.message });
  }
};

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ msg: "Please add all values in the request body" });
  }

  try {
    let foundUser = await User.findOne({ email });
    if (foundUser) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    const newUser = new User({ name: username, email, password });
    await newUser.save();
    res.status(201).json({ msg: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ msg: "Internal Server Error", error: error.message });
  }
};

const userInfo = async (req, res) => {
  try {
    res.status(200).json({
      name: req.user.name,
      email: req.user.email,
      id: req.user.id,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

const googleRegister = async (req, res) => {
  const token = req.body.token;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: ID,
    });

    const payload = ticket.getPayload();
    const { name, email } = payload;

    let foundUser = await User.findOne({ email });

    if (foundUser) {
      const authToken = jwt.sign(
        { id: foundUser._id, name: foundUser.name, email: foundUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      return res.status(200).json({ msg: "User logged in", token: authToken });
    } else {
      foundUser = new User({ name, email });
      await foundUser.save();
      const authToken = jwt.sign(
        { id: foundUser._id, name: foundUser.name, email: foundUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      return res.status(201).json({ msg: "User registered", token: authToken });
    }
  } catch (error) {
    console.error("Google registration error:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
  
};
const searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } }, // Case-insensitive search by name
        { email: { $regex: query, $options: "i" } }, // Case-insensitive search by email
      ],
    });

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Error searching users', details: error.message });
  }
};

const addFriend = async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    const userToAdd = await User.findById(friendId);

    if (!userToAdd) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentUser = await User.findById(userId);

    // Check if the current user already has the user as a friend
    if (currentUser.friends.includes(friendId)) {
      return res.status(400).json({ msg: 'User is already your friend' });
    }

    // Add userId to the current user's friends array
    try{
    currentUser.friends.push(friendId);
  }
    catch(error){
      console.log("error pushing");
    }

    // Save the updated user document
    await currentUser.save();

    res.status(200).json({ msg: `Added user ${friendId} as a friend` });
  } catch (error) {
    console.error('Error adding friend', error);
    res.status(500).json({ error: 'Error adding friend', details: error.message });
  }
};
const fetchFriends = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId).populate('friends', 'name email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Error fetching friends:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  fetchFriends,
};
module.exports = {
  login,
  register,
  dashboard,
  userInfo,
  googleRegister,
  getAllUsers,
  messages,
  getAllMessages,
  updateMessage,
  deleteMessage,
  searchUsers,
  addFriend,
  fetchFriends
};
