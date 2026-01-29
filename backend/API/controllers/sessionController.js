const Session = require('../../models/Session');
const { v4: uuidv4 } = require('uuid');

const createSession = async (req, res) => {
  try {
    const { doubtId, instructorId } = req.body;
    
    const session = await Session.create({
      doubtId,
      studentId: req.user._id,
      instructorId,
      roomId: uuidv4()
    });

    await session.populate(['doubtId', 'studentId', 'instructorId'], 'title name');
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const filter = req.user.role === 'instructor' 
      ? { instructorId: req.user._id }
      : { studentId: req.user._id };

    const sessions = await Session.find(filter)
      .populate(['doubtId', 'studentId', 'instructorId'], 'title name')
      .sort({ startedAt: -1 });
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    session.status = 'completed';
    session.endedAt = new Date();
    session.duration = Math.floor((session.endedAt - session.startedAt) / 1000);
    await session.save();
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { createSession, getSessions, endSession };