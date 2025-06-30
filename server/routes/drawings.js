const express = require('express');
const Drawing = require('../models/Drawing');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/drawings/:sessionId
// @desc    Save or update drawing data
// @access  Private
router.post('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { data } = req.body;

    console.log('[Drawings API] Save request for session:', sessionId, 'User:', req.user?.email, 'Elements count:', data?.length || 0);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Find existing drawing or create new one
    let drawing = await Drawing.findOne({ sessionId });

    if (drawing) {
      // Update existing drawing
      drawing.data = data;
      drawing.updatedAt = new Date();
      
      // Add user to the drawing if not already present
      if (!drawing.users.includes(req.user._id)) {
        drawing.users.push(req.user._id);
      }
      
      await drawing.save();
    } else {
      // Create new drawing
      drawing = new Drawing({
        sessionId,
        data: data || [],
        createdBy: req.user._id,
        users: [req.user._id]
      });
      
      await drawing.save();
    }

    res.json({
      success: true,
      message: 'Drawing saved successfully',
      data: {
        drawing: {
          sessionId: drawing.sessionId,
          data: drawing.data,
          updatedAt: drawing.updatedAt,
          userCount: drawing.users.length
        }
      }
    });

  } catch (error) {
    console.error('Save drawing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving drawing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/drawings/:sessionId
// @desc    Retrieve existing drawing for a session
// @access  Private
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('[Drawings API] Get request for session:', sessionId, 'User:', req.user?.email);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const drawing = await Drawing.findOne({ sessionId })
      .populate('createdBy', 'username email')
      .populate('users', 'username email');

    if (!drawing) {
      return res.status(404).json({
        success: false,
        message: 'Drawing not found for this session'
      });
    }

    // Add current user to the drawing if not already present
    if (!drawing.users.some(user => user._id.toString() === req.user._id.toString())) {
      drawing.users.push(req.user._id);
      await drawing.save();
    }

    res.json({
      success: true,
      data: {
        drawing: {
          sessionId: drawing.sessionId,
          data: drawing.data,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
          createdBy: drawing.createdBy,
          users: drawing.users,
          metadata: drawing.metadata
        }
      }
    });

  } catch (error) {
    console.error('Get drawing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving drawing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/drawings
// @desc    Get all drawings for the current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const drawings = await Drawing.find({
      $or: [
        { createdBy: req.user._id },
        { users: req.user._id }
      ]
    })
    .populate('createdBy', 'username email')
    .select('sessionId metadata createdAt updatedAt createdBy users')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Drawing.countDocuments({
      $or: [
        { createdBy: req.user._id },
        { users: req.user._id }
      ]
    });

    res.json({
      success: true,
      data: {
        drawings: drawings.map(drawing => ({
          sessionId: drawing.sessionId,
          metadata: drawing.metadata,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
          createdBy: drawing.createdBy,
          userCount: drawing.users.length,
          isOwner: drawing.createdBy._id.toString() === req.user._id.toString()
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get drawings list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving drawings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/drawings/:sessionId
// @desc    Delete a drawing (only owner can delete)
// @access  Private
router.delete('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const drawing = await Drawing.findOne({ sessionId });

    if (!drawing) {
      return res.status(404).json({
        success: false,
        message: 'Drawing not found'
      });
    }

    // Check if user is the owner
    if (drawing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can delete this drawing'
      });
    }

    await Drawing.findOneAndDelete({ sessionId });

    res.json({
      success: true,
      message: 'Drawing deleted successfully'
    });

  } catch (error) {
    console.error('Delete drawing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting drawing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
