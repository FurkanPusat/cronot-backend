const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  title: {
    type: String,
    ref: "title",
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  backgroundColor: { // Yeni alan
    type: String,
    default: '#ffffff'
  }
});

module.exports = mongoose.model('Board', BoardSchema);
