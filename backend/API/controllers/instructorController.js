const Session = require('../../models/Session');
const Feedback = require('../../models/Feedback');
const User = require('../../models/User');

const getInstructorsByDomain = async (req, res) => {
  try {
    const { domain } = req.query;

    const filter = {
      role: 'instructor',
      isVerified: true,
      statusForSession: 'online'
    };

    if (domain) {
      filter.domains = { $in: [domain] };
    }

    const instructors = await User.find(filter)
      .select('name domains rating totalRatings statusForSession')
      .sort({ rating: -1 })
      .lean();

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const updateInstructorStatus = async (req, res) => {
  try {
    const { statusForSession } = req.body;
    console.log(`[UpdateStatus] Request from ${req.user._id}. New Status: ${statusForSession}`);

    const normalizedStatus = statusForSession.toLowerCase();
    await User.findByIdAndUpdate(req.user._id, { statusForSession: normalizedStatus });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('instructor-status-change', {
        instructorId: req.user._id,
        status: normalizedStatus,
        name: req.user.name
      });
    }

    res.json({ msg: 'Status updated successfully', status: normalizedStatus });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // 1. Total Sessions (Completed)
    const instructor = await User.findById(instructorId);
    if (!instructor) return res.status(404).json({ msg: 'Instructor not found' });

    const totalSessions = instructor.sessionsTaken || 0;

    // 2. Total Hours
    const totalHours = Math.round(((instructor.minutesTaught || 0) / 60) * 10) / 10;

    // 3. Average Rating & Recent Feedback
    // Find feedback where toUserId is the instructor
    const feedbacks = await Feedback.find({ toUserId: instructorId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'sessionId',
        populate: { path: 'studentId', select: 'name' }
      });

    // Calculate Average
    let avgRating = 0;
    if (feedbacks.length > 0) {
      const totalRating = feedbacks.reduce((acc, fb) => {
        // Average of the 3 sub-ratings
        const entryAvg = (fb.ratings.clarity + fb.ratings.interaction + fb.ratings.satisfaction) / 3;
        return acc + entryAvg;
      }, 0);
      avgRating = (totalRating / feedbacks.length).toFixed(1);
    }

    // Format Recent Feedback
    const recentFeedback = feedbacks.slice(0, 5).map(fb => ({
      id: fb._id,
      rating: Math.round((fb.ratings.clarity + fb.ratings.interaction + fb.ratings.satisfaction) / 3),
      comment: fb.message,
      studentName: fb.sessionId?.studentId?.name || 'Anonymous'
    }));

    res.json({
      totalSessions,
      totalHours,
      avgRating,
      recentFeedback,
      currentStatus: req.user.statusForSession || 'offline'
    });

  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ msg: 'Failed to fetch stats' });
  }
};

module.exports = { getInstructorsByDomain, updateInstructorStatus, getInstructorStats };