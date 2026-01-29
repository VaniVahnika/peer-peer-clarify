const Doubt = require('../../models/Doubt');

const createDoubt = async (req, res) => {
  try {
    const { title, description, domain, codeSnippet } = req.body;
    
    const doubt = await Doubt.create({
      title,
      description,
      domain,
      codeSnippet,
      studentId: req.user._id
    });

    await doubt.populate('studentId', 'name');
    res.status(201).json(doubt);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getDoubts = async (req, res) => {
  try {
    const { domain, status } = req.query;
    const filter = { isDeleted: false };
    
    if (domain) filter.domain = domain;
    if (status) filter.status = status;

    const doubts = await Doubt.find(filter)
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(doubts);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getDoubtById = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
      .populate('studentId', 'name');
    
    if (!doubt || doubt.isDeleted) {
      return res.status(404).json({ msg: 'Doubt not found' });
    }
    
    res.json(doubt);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const updateDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    
    if (!doubt || doubt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    Object.assign(doubt, req.body);
    await doubt.save();
    
    res.json(doubt);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = { createDoubt, getDoubts, getDoubtById, updateDoubt };