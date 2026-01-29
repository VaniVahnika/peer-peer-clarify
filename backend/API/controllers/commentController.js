const Comment = require('../../models/Comments');
const Doubt = require('../../models/Doubt');
const Notification = require('../../models/Notification');

const addComment = async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { content } = req.body;

    const comment = await Comment.create({
      doubtId,
      userId: req.user._id,
      content
    });

    await Doubt.findByIdAndUpdate(doubtId, { $inc: { commentsCount: 1 } });

    await comment.populate('userId', 'name role');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { doubtId } = req.params;

    const comments = await Comment.find({ doubtId, isDeleted: false })
      .populate('userId', 'name role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { addComment, getComments };