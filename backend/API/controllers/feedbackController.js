const Feedback = require('../../models/Feedback');
const User = require('../../models/User');

const submitFeedback = async (req, res) => {
  try {
    const { sessionId, ratings, message, toUserId } = req.body;
    const from = req.user.role === 'instructor' ? 'instructor' : 'student';

    const feedback = await Feedback.create({
      sessionId,
      from,
      toUserId,
      ratings,
      message
    });

    // Update instructor rating if feedback is from student
    if (from === 'student') {
      if (!toUserId) {
        throw new Error('Target user ID (toUserId) is required');
      }

      const instructor = await User.findById(toUserId);
      if (!instructor) {
        throw new Error(`Instructor/User not found with ID: ${toUserId}`);
      }

      if (!ratings || typeof ratings.clarity !== 'number') {
        throw new Error('Invalid ratings format');
      }

      const avgRating = (ratings.clarity + ratings.interaction + ratings.satisfaction) / 3;

      const newTotalRatings = (instructor.totalRatings || 0) + 1;
      const currentRating = instructor.rating || 0;
      const newRating = ((currentRating * (instructor.totalRatings || 0)) + avgRating) / newTotalRatings;

      await User.findByIdAndUpdate(toUserId, {
        rating: newRating,
        totalRatings: newTotalRatings
      });
    }

    res.status(201).json(feedback);
  } catch (error) {
    console.error("Feedback Submission Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'You have already submitted feedback for this session.' });
    }
    res.status(500).json({ msg: error.message });
  }
};

const getFeedback = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const feedback = await Feedback.find({ sessionId })
      .populate('toUserId', 'name');

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { submitFeedback, getFeedback };