const Job = require('../models/jobModel');
const logActivity = require('../middleware/auditMiddleware');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.status(200).json(jobs);
  } catch (err) {
    console.error('SERVER ERROR IN GET JOBS:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = async (req, res) => {
  try {
    console.log('CREATING JOB WITH DATA:', req.body);
    const job = await Job.create({ ...req.body, created_by: req.user.id });
    await logActivity(req, 'CREATE', 'JOB', `Created job: ${job.title}`);
    res.status(201).json(job);
  } catch (err) {
    console.error('SERVER ERROR IN CREATE JOB:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private/Admin
const updateJob = async (req, res) => {
  try {
    const job = await Job.update(req.params.id, req.body);
    await logActivity(req, 'UPDATE', 'JOB', `Updated job: ${job.title}`);
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
const deleteJob = async (req, res) => {
  try {
    await Job.delete(req.params.id);
    await logActivity(req, 'DELETE', 'JOB', `Deleted job ID: ${req.params.id}`);
    res.status(200).json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
