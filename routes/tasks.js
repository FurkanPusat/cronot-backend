const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Task oluşturma
router.post('/tasks', auth, async (req, res) => {
  console.log('Received task creation request with data:', req.body); // Gelen veriyi logla

  const { title, description, startDate, endDate, color, tag, assignedTo, boardId, projectId } = req.body;

  console.log('Received task creation request with data:', req.body); // Gelen veriyi logla

  try {
    const newTask = new Task({ title, description, startDate, endDate, color, tag, assignedTo, boardId, projectId });
    const savedTask = await newTask.save();

    // Board güncelleme: yeni task ID'sini tasks array'ine ekleyin
    await Board.findByIdAndUpdate(boardId, { $push: { tasks: savedTask._id } });

    console.log('Task created successfully:', savedTask); // Başarılı oluşturmayı logla
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    console.log('Received task update request with data:', req.body); // Gelen veriyi logla

    // Task'i güncelle
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.startDate = req.body.startDate || task.startDate;
    task.endDate = req.body.endDate || task.endDate;
    task.color = req.body.color || task.color;
    task.tag = req.body.tag || task.tag;
    task.assignedTo = req.body.assignedTo || task.assignedTo; // Assignee güncellemesi

    const updatedTask = await task.save();
    console.log('Task updated successfully:', updatedTask); // Başarılı güncellemeyi logla
    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.remove();
    console.log('Task deleted successfully:', task); // Başarılı silmeyi logla
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get tasks by boardId
router.get('/board/:boardId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ boardId: req.params.boardId });
    console.log('Fetched tasks for board:', tasks); // Başarılı çekmeyi logla
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});


// Create a new task with title only
router.post('/title-only', auth, async (req, res) => {
  const { title, boardId, projectId } = req.body;

  const task = new Task({
    title,
    description: '',
    startDate: null,
    endDate: null,
    color: '',
    tag: null,
    assignedTo: null,
    boardId,
    projectId
  });

  try {
    const newTask = await task.save();
    await Board.findByIdAndUpdate(boardId, { $push: { tasks: newTask._id } }); // Board güncellemesi
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err.message);
    res.status(400).json({ message: err.message });
  }
});




module.exports = router;
