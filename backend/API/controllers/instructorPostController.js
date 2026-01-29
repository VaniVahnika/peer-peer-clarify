const InstructorPost = require('../../models/InstructorPost');

const createPost = async (req, res) => {
  try {
    const { title, content, domain, tags } = req.body;
    
    const post = await InstructorPost.create({
      instructorId: req.user._id,
      title,
      content,
      domain,
      tags
    });

    await post.populate('instructorId', 'name');
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { domain } = req.query;
    const filter = { isDeleted: false };
    
    if (domain) filter.domain = domain;

    const posts = await InstructorPost.find(filter)
      .populate('instructorId', 'name rating')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { createPost, getPosts };