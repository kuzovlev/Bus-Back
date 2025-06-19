const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const {
  getAllIncomeExpenses,
  getIncomeExpenseById,
  createIncomeExpense,
  updateIncomeExpense,
  deleteIncomeExpense,
} = require('../../controllers/v1/income-expense.controller');

// All routes require authentication
router.use(isAuthenticated);

// Routes
router.get('/', getAllIncomeExpenses);
router.get('/:id', getIncomeExpenseById);
router.post('/', createIncomeExpense);
router.put('/:id', updateIncomeExpense);
router.delete('/:id', deleteIncomeExpense);

module.exports = router; 