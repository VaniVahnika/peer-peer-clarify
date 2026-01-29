const Roadmap = require('../../models/Roadmap');
const UserProgress = require('../../models/UserProgress');

const getRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ isActive: true }).select('title slug description nodes');
    // Basic info for listing
    const response = roadmaps.map(r => ({
      id: r._id,
      slug: r.slug,
      name: r.title,
      description: r.description,
      totalNodes: r.nodes.length
    }));
    res.json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getRoadmap = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`[getRoadmap] Request for slug: ${slug}`);
    const roadmap = await Roadmap.findOne({ slug });
    console.log(`[getRoadmap] Found:`, roadmap ? roadmap._id : 'null');

    if (!roadmap) {
      return res.status(404).json({ msg: 'Roadmap not found' });
    }

    let progress = await UserProgress.findOne({ userId: req.user.id, roadmapId: roadmap._id });

    if (!progress) {
      // Initialize progress if not exists
      progress = await UserProgress.create({
        userId: req.user.id,
        roadmapId: roadmap._id,
        completedNodeIds: [],
        currentNodeId: roadmap.nodes[0]?.id || null, // Start with first node
        status: 'not-started'
      });
    }

    // Combine static roadmap data with user progress
    const nodesWithStatus = roadmap.nodes.map(node => {
      const isCompleted = progress.completedNodeIds.includes(node.id);
      const isCurrent = progress.currentNodeId === node.id;
      // Rules: 
      // 1. Completed nodes are "completed"
      // 2. The Current node is "in-progress" (unlocked)
      // 3. Any node NOT completed and NOT current is "locked"

      let status = 'locked';
      if (isCompleted) status = 'completed';
      else if (isCurrent) status = 'in-progress';

      return {
        ...node.toObject(),
        status
      };
    });

    res.json({
      id: roadmap._id,
      slug: roadmap.slug,
      title: roadmap.title,
      description: roadmap.description,
      progress: progress.progressPercentage,
      nodes: nodesWithStatus
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { slug, nodeId } = req.body;

    const roadmap = await Roadmap.findOne({ slug });
    if (!roadmap) return res.status(404).json({ msg: 'Roadmap not found' });

    const progress = await UserProgress.findOne({ userId: req.user.id, roadmapId: roadmap._id });
    if (!progress) return res.status(404).json({ msg: 'Progress not initiated' });

    // Prevent re-completing
    if (progress.completedNodeIds.includes(nodeId)) {
      return res.json(progress);
    }

    // Mark done
    progress.completedNodeIds.push(nodeId);

    // Calculate next node
    const currentNodeIndex = roadmap.nodes.findIndex(n => n.id === nodeId);
    let nextNodeId = null;

    if (currentNodeIndex !== -1 && currentNodeIndex < roadmap.nodes.length - 1) {
      nextNodeId = roadmap.nodes[currentNodeIndex + 1].id;
    }

    // Update current pointer
    progress.currentNodeId = nextNodeId;

    // Update %
    progress.progressPercentage = Math.round((progress.completedNodeIds.length / roadmap.nodes.length) * 100);
    progress.status = progress.progressPercentage === 100 ? 'completed' : 'in-progress';

    await progress.save();

    res.json({
      msg: 'Progress updated',
      progress: progress.progressPercentage,
      completedNodeIds: progress.completedNodeIds,
      currentNodeId: progress.currentNodeId
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getUserProgress = async (req, res) => {
  // Already handled via getRoadmap usually, or list overview
  // Implementation can act as a summary dashboard
  try {
    const progress = await UserProgress.find({ userId: req.user.id }).populate('roadmapId', 'title slug');
    res.json(progress);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports = { getRoadmaps, getRoadmap, updateProgress, getUserProgress };