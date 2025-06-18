const express = require('express');
const router = express.Router();
const {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  deleteHabit,
  updateProgress,
  getHabitStats
} = require('../controllers/habitController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Stats endpoint should be before the ID parameter routes
router.get('/stats', getHabitStats);

router
  .route('/')
  .post(createHabit)
  .get(getHabits);

router
  .route('/:id')
  .get(getHabit)
  .put(updateHabit)
  .delete(deleteHabit);

router
  .route('/:id/progress')
  .post(updateProgress);

module.exports = router;
