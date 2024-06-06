const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Middleware'i içe aktarın
const nodemailer = require('nodemailer');

// Tüm rotalara auth middleware'ini ekleyin
router.use(auth);

router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get a single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Create a new project
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  const project = new Project({
    name,
    description,
    createdBy: req.user.id,
    members: [req.user.id], // Projeyi oluşturanı otomatik olarak üyeler arasına ekleyin
    createdAt: new Date()
  });

  try {
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.members = req.body.members || project.members;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Organizasyon projelerini getirme
router.get('/organization/:organizationId', auth, async (req, res) => {
  const { organizationId } = req.params;

  try {
    const projects = await Project.find({ organization: organizationId });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error });
  }
});


// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      console.error(`Project not found with id: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.deleteOne({ _id: req.params.id }); // Silme işlemi için deleteOne kullanılıyor
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Error deleting project:', err); // Hatanın detaylarını loglayın
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Kullanıcı davet etme
router.post('/:id/invite', async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Kullanıcıya davetiye gönder
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
      }
    });

    const inviteLink = `http://localhost:3000/register?projectId=${project._id}&email=${email}`;

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Project Invitation',
      text: `You have been invited to join the project. Click the link to join: ${inviteLink}`
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

// Kullanıcı projeye katıldığında üyeliği ekleme
router.post('/:id/join', async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    const user = await User.findOne({ email });

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Kullanıcıyı projeye ekle
    project.members.push(user._id);
    await project.save();

    res.json({ message: 'User added to project successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Kullanıcıları projeye ekleme
router.post('/:id/addMember', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!project.members.includes(user.id)) {
      project.members.push(user.id);
      await project.save();
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
