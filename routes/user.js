const express = require('express');
const router = express.Router();
const multer = require('../middleware/multer'); // Import multer middleware
const authMiddleware = require('../middleware/auth');
const {
  login,
  register,
  dashboard,
  googleRegister,
  getAllUsers,
  userInfo,
  messages,
  getAllMessages,
  updateMessage,
  deleteMessage,
  searchUsers,
  addFriend,
  fetchFriends
} = require('../controllers/user');

// Public Routes
router.post('/login', login);
router.post('/gregister', googleRegister);
router.post('/register', register);
router.get('/users', getAllUsers);
router.get('/users/search', searchUsers);

// Authenticated Routes
router.get('/dashboard', authMiddleware, dashboard);
router.get('/userInfo', authMiddleware, userInfo);
router.post('/messages', authMiddleware, multer.single('image'), messages);
router.get('/messages', authMiddleware, getAllMessages);
router.put('/messages/:id', authMiddleware, updateMessage);
router.delete('/messages/:id', authMiddleware, deleteMessage);
// router.post('/users/friends/add', authMiddleware, addFriend);
router.post('/users/friends/add',addFriend);
router.get('/users/friends/:userId', authMiddleware, fetchFriends);

module.exports = router;
