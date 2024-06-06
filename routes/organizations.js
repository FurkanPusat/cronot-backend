// routes/organizations.js

const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Tüm rotalara auth middleware'ini ekleyin
router.use(auth);

router.post('/create', auth, async (req, res) => {
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

// Organizasyona kullanıcı ekleme
router.post('/add-member', auth, async (req, res) => {
  const { organizationId, userId } = req.body;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!organization.members.includes(userId)) {
      organization.members.push(userId);
      await organization.save();
    }

    res.status(200).json({ message: 'User added to organization', organization });
  } catch (error) {
    res.status(500).json({ message: 'Error adding user to organization', error });
  }
});

// Kullanıcıya davetiye gönder
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const organization = await Organization.findById(req.params.id);
    if (!organization) return res.status(404).json({ message: 'Organization not found' });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const inviteLink = `http://localhost:3000/register?organizationId=${organization._id}&email=${email}`;

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Organization Invitation',
      text: `You have been invited to join the organization. Click the link to join: ${inviteLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Email sent: ' + info.response);
      res.json({ message: 'Invitation sent successfully' });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:organizationId/members', auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.organizationId);
    if (!organization) {
      return res.status(404).json({ msg: 'Organization not found' });
    }

    const members = await User.find({ _id: { $in: organization.members } });
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
