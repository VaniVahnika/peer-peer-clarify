const SessionRequest = require('../../models/SessionRequest');
const User = require('../../models/User');
const Notification = require('../../models/Notification');

const createRequest = async (req, res) => {
  try {
    const { doubtId, instructorId, message, subject } = req.body;
    console.log(`[SessionReq] Create: User=${req.user._id}, Inst=${instructorId}, Doubt=${doubtId}, Subject=${subject}`);

    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor' || !instructor.isVerified) {
      return res.status(400).json({ msg: 'Invalid or unverified instructor' });
    }

    const request = await SessionRequest.create({
      doubtId,
      studentId: req.user._id,
      instructorId,
      message,
      subject
    });

    await request.populate([
      { path: 'doubtId', select: 'title domain' },
      { path: 'studentId', select: 'name' },
      { path: 'instructorId', select: 'name' }
    ]);

    // Notification Logic
    const notification = await Notification.create({
      recipient: instructorId,
      message: `New session request from ${req.user.name} for "${subject || 'Doubt'}"`,
      type: 'info',
      relatedId: request._id
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${instructorId}`).emit('new-notification', notification);
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getRequests = async (req, res) => {
  try {
    // 1. Auto-Expiration Logic (Lazy Check)
    const cutoffTime = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago

    // Find all PENDING requests older than cutoff
    const expiredRequests = await SessionRequest.find({
      status: 'pending',
      requestedAt: { $lt: cutoffTime }
    });

    if (expiredRequests.length > 0) {
      const expiredIds = expiredRequests.map(r => r._id);
      const instructorIdsToOffline = [...new Set(expiredRequests.map(r => r.instructorId.toString()))];

      // DELETE requests instead of updating status
      await SessionRequest.deleteMany({ _id: { $in: expiredIds } });
      console.log(`[AutoExpire] Deleted ${expiredRequests.length} expired requests.`);

      // Set Instructors Offline
      if (instructorIdsToOffline.length > 0) {
        await User.updateMany(
          { _id: { $in: instructorIdsToOffline } },
          { statusForSession: 'offline' }
        );
        console.log(`[AutoExpire] Set ${instructorIdsToOffline.length} instructors offline due to timeout.`);
      }
    }

    // 2. Fetch Active Requests
    const filter = req.user.role === 'instructor'
      ? { instructorId: req.user._id }
      : { studentId: req.user._id };

    const requests = await SessionRequest.find(filter)
      .populate({ path: 'doubtId', select: 'title domain' })
      .populate({ path: 'studentId' })
      .populate({ path: 'instructorId', select: 'name' })
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("GetRequests Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const request = await SessionRequest.findById(req.params.id)
      .populate({ path: 'doubtId', select: 'title domain description codeSnippet' })
      .populate({ path: 'studentId', select: 'name' })
      .populate({ path: 'instructorId', select: 'name' });

    if (!request) {
      return res.status(404).json({ msg: 'Session Request not found' });
    }

    // Access control: Only allowed if user is student or instructor of this request
    const isParticipant =
      request.studentId._id.toString() === req.user._id.toString() ||
      request.instructorId._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      console.log(`[GetReqById] Access Denied: User=${req.user._id}, Student=${request.studentId._id}, Inst=${request.instructorId._id}`);
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error("GetRequestById Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await SessionRequest.findById(req.params.id);

    if (!request || request.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    if (status === 'accepted') {
      const notification = await Notification.create({
        recipient: request.studentId,
        message: `Your session request for "${request.subject || request.doubtId?.title || 'Doubt Session'}" has been accepted by ${req.user.name}!`,
        type: 'success',
        relatedId: request._id
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${request.studentId._id}`).emit('new-notification', notification);
      }
    }

    // Update status
    request.status = status;
    if (status) request.respondedAt = new Date();
    await request.save();

    if (status === 'completed') {
      const student = await User.findById(request.studentId);
      const instructor = await User.findById(request.instructorId);
      const { duration } = req.body; // Expect duration in minutes

      if (student) {
        student.sessionsAttended = (student.sessionsAttended || 0) + 1;
        await student.save();
      }
      if (instructor) {
        instructor.sessionsTaken = (instructor.sessionsTaken || 0) + 1;
        if (duration && !isNaN(duration)) {
          instructor.minutesTaught = (instructor.minutesTaught || 0) + Number(duration);
        }
        await instructor.save();
      }
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const request = await SessionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Verify instructor
    if (request.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Notification Logic for Decline
    const notification = await Notification.create({
      recipient: request.studentId,
      message: `Your session request for "${request.subject || 'Doubt Session'}" was declined by ${req.user.name}.`,
      type: 'warning',
      relatedId: null // Request is deleted, so no link
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${request.studentId}`).emit('new-notification', notification);
    }

    await SessionRequest.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Request declined and deleted' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { createRequest, getRequests, getRequestById, updateRequest, deleteRequest };