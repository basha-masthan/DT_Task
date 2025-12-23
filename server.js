const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { connectDB, getDB, closeDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Collection name
const COLLECTION_NAME = 'events';

// Connect to MongoDB
connectDB();

// Helper function to get collection
const getCollection = () => {
  const db = getDB();
  return db.collection(COLLECTION_NAME);
};

// API Routes

// GET /api/v3/app/events?id=:event_id - Get event by ID
app.get('/api/v3/app/events', async (req, res) => {
  try {
    const { id, type, limit, page } = req.query;
    const collection = getCollection();

    // If id is provided, return specific event
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }
      
      const event = await collection.findOne({ _id: new ObjectId(id) });
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.json(event);
    }

    // If type=latest is provided, return paginated latest events
    if (type === 'latest') {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 5;
      const skip = (pageNum - 1) * limitNum;

      // Get events sorted by schedule (latest first)
      const events = await collection
        .find({})
        .sort({ schedule: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      const total = await collection.countDocuments({});

      return res.json({
        events,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalEvents: total,
          limit: limitNum
        }
      });
    }

    // Return all events if no filters
    const events = await collection.find({}).toArray();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v3/app/events - Create event
app.post('/api/v3/app/events', upload.single('image'), async (req, res) => {
  try {
    const collection = getCollection();

    // Build event object from request body
    const eventData = {
      type: 'event',
      uid: req.body.uid ? parseInt(req.body.uid) : 18, // Default user id as per spec
      name: req.body.name,
      tagline: req.body.tagline,
      schedule: req.body.schedule ? new Date(req.body.schedule) : new Date(),
      description: req.body.description,
      moderator: req.body.moderator,
      category: req.body.category,
      sub_category: req.body.sub_category,
      rigor_rank: req.body.rigor_rank ? parseInt(req.body.rigor_rank) : 0,
      attendees: req.body.attendees ? JSON.parse(req.body.attendees) : [],
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add image path if file was uploaded
    if (req.file) {
      eventData.files = {
        image: `/uploads/${req.file.filename}`
      };
    }

    // Insert the event (schema-less - accepts any fields)
    const result = await collection.insertOne(eventData);

    res.status(201).json({
      message: 'Event created successfully',
      event_id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v3/app/events/:id - Update event
app.put('/api/v3/app/events/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const collection = getCollection();

    // Check if event exists
    const existingEvent = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Build update object from request body
    const updateData = {
      updated_at: new Date()
    };

    // Add fields that are provided in the request
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.tagline) updateData.tagline = req.body.tagline;
    if (req.body.schedule) updateData.schedule = new Date(req.body.schedule);
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.moderator) updateData.moderator = req.body.moderator;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.sub_category) updateData.sub_category = req.body.sub_category;
    if (req.body.rigor_rank) updateData.rigor_rank = parseInt(req.body.rigor_rank);
    if (req.body.uid) updateData.uid = parseInt(req.body.uid);
    if (req.body.attendees) updateData.attendees = JSON.parse(req.body.attendees);

    // Add image path if new file was uploaded
    if (req.file) {
      updateData.files = {
        image: `/uploads/${req.file.filename}`
      };
    }

    // Update the event
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes made to the event' });
    }

    res.json({
      message: 'Event updated successfully',
      event_id: id
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v3/app/events/:id - Delete event
app.delete('/api/v3/app/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const collection = getCollection();

    // Delete the event
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event deleted successfully',
      event_id: id
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== NUDGE API ROUTES ====================

// Collection name for nudges
const NUDGE_COLLECTION_NAME = 'nudges';

// Helper function to get nudge collection
const getNudgeCollection = () => {
  const db = getDB();
  return db.collection(NUDGE_COLLECTION_NAME);
};

// GET /api/v3/app/nudges?id=:nudge_id - Get nudge by ID
app.get('/api/v3/app/nudges', async (req, res) => {
  try {
    const { id, event_id, type, limit, page } = req.query;
    const collection = getNudgeCollection();

    // If id is provided, return specific nudge
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid nudge ID' });
      }
      
      const nudge = await collection.findOne({ _id: new ObjectId(id) });
      if (!nudge) {
        return res.status(404).json({ error: 'Nudge not found' });
      }
      return res.json(nudge);
    }

    // If event_id is provided, return all nudges for that event
    if (event_id) {
      if (!ObjectId.isValid(event_id)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }
      
      const nudges = await collection.find({ event_id: new ObjectId(event_id) }).toArray();
      return res.json({
        nudges,
        total: nudges.length
      });
    }

    // If type=latest is provided, return paginated latest nudges
    if (type === 'latest') {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Get nudges sorted by send_time (latest first)
      const nudges = await collection
        .find({})
        .sort({ send_time: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      const total = await collection.countDocuments({});

      return res.json({
        nudges,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalNudges: total,
          limit: limitNum
        }
      });
    }

    // Return all nudges if no filters
    const nudges = await collection.find({}).toArray();
    res.json({
      nudges,
      total: nudges.length
    });
  } catch (error) {
    console.error('Error fetching nudges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v3/app/nudges - Create nudge
app.post('/api/v3/app/nudges', upload.fields([{ name: 'cover_image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), async (req, res) => {
  try {
    const collection = getNudgeCollection();

    // Build nudge object from request body
    const nudgeData = {
      type: 'nudge',
      uid: req.body.uid ? parseInt(req.body.uid) : 18,
      title: req.body.title,
      event_id: req.body.event_id ? new ObjectId(req.body.event_id) : null,
      send_time: req.body.send_time ? new Date(req.body.send_time) : new Date(),
      description: req.body.description,
      invitation_line: req.body.invitation_line,
      status: req.body.status || 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add cover_image path if file was uploaded
    if (req.files && req.files['cover_image']) {
      nudgeData.cover_image = `/uploads/${req.files['cover_image'][0].filename}`;
    }

    // Add icon path if file was uploaded
    if (req.files && req.files['icon']) {
      nudgeData.icon = `/uploads/${req.files['icon'][0].filename}`;
    }

    // Insert the nudge (schema-less - accepts any fields)
    const result = await collection.insertOne(nudgeData);

    res.status(201).json({
      message: 'Nudge created successfully',
      nudge_id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating nudge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v3/app/nudges/:id - Update nudge
app.put('/api/v3/app/nudges/:id', upload.fields([{ name: 'cover_image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid nudge ID' });
    }

    const collection = getNudgeCollection();

    // Check if nudge exists
    const existingNudge = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingNudge) {
      return res.status(404).json({ error: 'Nudge not found' });
    }

    // Build update object from request body
    const updateData = {
      updated_at: new Date()
    };

    // Add fields that are provided in the request
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.event_id) updateData.event_id = new ObjectId(req.body.event_id);
    if (req.body.send_time) updateData.send_time = new Date(req.body.send_time);
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.invitation_line) updateData.invitation_line = req.body.invitation_line;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.uid) updateData.uid = parseInt(req.body.uid);

    // Add cover_image path if new file was uploaded
    if (req.files && req.files['cover_image']) {
      updateData.cover_image = `/uploads/${req.files['cover_image'][0].filename}`;
    }

    // Add icon path if new file was uploaded
    if (req.files && req.files['icon']) {
      updateData.icon = `/uploads/${req.files['icon'][0].filename}`;
    }

    // Update the nudge
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes made to the nudge' });
    }

    res.json({
      message: 'Nudge updated successfully',
      nudge_id: id
    });
  } catch (error) {
    console.error('Error updating nudge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v3/app/nudges/:id - Delete nudge
app.delete('/api/v3/app/nudges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid nudge ID' });
    }

    const collection = getNudgeCollection();

    // Delete the nudge
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Nudge not found' });
    }

    res.json({
      message: 'Nudge deleted successfully',
      nudge_id: id
    });
  } catch (error) {
    console.error('Error deleting nudge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Event API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await closeDB();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    await closeDB();
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
