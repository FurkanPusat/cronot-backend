const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const auth = require('../middleware/auth');

// Get all boards
router.get('/', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const boards = await Board.find({ projectId });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new board
router.post('/', auth, async (req, res) => {
  const board = new Board({
    title: req.body.title,
    projectId: req.body.projectId,
    tasks: req.body.tasks
  });

  try {
    const newBoard = await board.save();
    res.status(201).json(newBoard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a board
router.put('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (req.body.title) board.title = req.body.title;
    if (req.body.backgroundColor) board.backgroundColor = req.body.backgroundColor;

    const updatedBoard = await board.save();
    res.json(updatedBoard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a board
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Add a member to a board
router.post('/:id/addMember', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (!board.members.includes(req.body.userId)) {
      board.members.push(req.body.userId);
      await board.save();
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
