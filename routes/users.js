const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const Organization = require('../models/Organization');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, avatar, phoneNumber, bio } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      avatar,
      phoneNumber,
      bio
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login request received:', req.body);

  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('User does not exist');
      return res.status(400).json({ msg: 'User does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Invalid credentials');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Kullanıcı profili almak için rota
router.get('/profile', auth, async (req, res) => {
  console.log('Profile request received for user ID:', req.user.id);
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});

// Kullanıcı profili güncellemek için rota
router.post('/update-profile', auth, async (req, res) => {
  const { firstName, lastName, phone, bio, avatar } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.bio = bio;
    user.avatar = avatar;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Tüm kullanıcıları fetch etme
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Kullanıcının organizasyonunu kontrol etme
router.get('/check-organization', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('organization');
    if (user.organization) {
      res.json({ hasOrganization: true, organization: user.organization });
    } else {
      res.json({ hasOrganization: false });
    }
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).send('Server error');
  }
});

// Organizasyon oluşturma
router.post('/create-organization', auth, async (req, res) => {
  const { name } = req.body;

  try {
    const userId = req.user.id;
    const organization = new Organization({ name, owner: userId, members: [userId] });
    await organization.save();

    const user = await User.findById(userId);
    user.organization = organization._id;
    await user.save();

    res.status(201).json({ organization });
  } catch (error) {
    console.error('Error creating organization:', error.message);
    res.status(500).json({ message: 'Error creating organization', error });
  }
});

// Organizasyona kullanıcı ekleme ve oluşturma
router.post('/add-user', auth, async (req, res) => {
  const { name, email, password, avatar, phoneNumber, bio, organizationId } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      avatar,
      phoneNumber,
      bio,
      organization: organizationId
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Organizasyona kullanıcı ekle
    const organization = await Organization.findById(organizationId);
    organization.members.push(user._id);
    await organization.save();

    res.status(201).json({ msg: 'User created and added to organization', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// Kullanıcıyı ID ile getirme
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
