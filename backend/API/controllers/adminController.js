const User = require('../../models/User');

const getPendingInstructors = async (req, res) => {
  try {
    const instructors = await User.find({
      role: 'instructor',
      isVerified: false
    }).select('-password').lean();

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const verifyInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (action === 'approve') {
      await User.findByIdAndUpdate(instructorId, { isVerified: true });
      res.json({ msg: 'Instructor approved successfully' });
    } else if (action === 'reject') {
      await User.findByIdAndDelete(instructorId);
      res.json({ msg: 'Instructor application rejected' });
    } else {
      res.status(400).json({ msg: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor', isVerified: true });
    const pendingVerifications = await User.countDocuments({ role: 'instructor', isVerified: false });

    res.json({
      totalStudents,
      totalInstructors,
      pendingVerifications
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getAllInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor', isVerified: true }).select('-password').lean();
    res.json(instructors);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ msg: 'Instructor removed successfully' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  getPendingInstructors,
  verifyInstructor,
  getDashboardStats,
  getAllInstructors,
  deleteInstructor
};