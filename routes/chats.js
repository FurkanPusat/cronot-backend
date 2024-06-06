const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Chat = require('../models/Chat');
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');

router.use(auth);

// Kanal oluşturma
router.post('/create-channel', async (req, res) => {
  try {
    const { channelName, organizationId, userId } = req.body;

    const newChannel = new Channel({
      name: channelName,
      organization: organizationId,
      members: [userId],
    });

    await newChannel.save();
    res.status(201).json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel', error });
  }
});

// Kanalları alma
router.get('/organization/:organizationId/channels', async (req, res) => {
  const { organizationId } = req.params;
  console.log(`Fetching channels for organization: ${organizationId}`);

  try {
    const channels = await Channel.find({ organization: organizationId });
    res.json(channels);
  } catch (error) {
    console.error(`Error fetching channels: ${error.message}`);
    res.status(500).json({ message: 'Error fetching channels', error });
  }
});

// Kanala kullanıcı ekleme
router.post('/:channelId/add-member', async (req, res) => {
  const { userId } = req.body;
  const { channelId } = req.params;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      console.error('Channel not found');
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (!channel.members.includes(userId)) {
      channel.members.push(userId);
      await channel.save();
    }

    res.json(channel);
  } catch (error) {
    console.error(`Error adding member to channel: ${error.message}`);
    res.status(500).json({ message: 'Error adding member to channel', error });
  }
});

// Mesaj gönderme
router.post('/:channelId/send', async (req, res) => {
  try {
    const { message, organizationId } = req.body;
    const { channelId } = req.params;

    console.log('Received message request:');
    console.log('channelId:', channelId);
    console.log('message:', message);
    console.log('organizationId:', organizationId);

    if (!message) {
      console.error('Validation error: Message content is required');
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (!organizationId) {
      console.error('Validation error: Organization ID is required');
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const newMessage = new Chat({
      channel: channelId,
      user: req.user._id,
      message,
      organization: organizationId
    });

    await newMessage.save();
    const populatedMessage = await Chat.findById(newMessage._id).populate('user', 'username');
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error });
  }
});


// Kanal mesajlarını getirme
router.get('/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID' });
    }

    const messages = await Chat.find({ channel: channelId })
      .populate('user', 'username')
      .populate('organization', 'name');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

module.exports = router;
