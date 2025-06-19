const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');

// Validation schema
const incomeExpenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  transactionDate: z.string().transform((str) => new Date(str)),
});

// Get all income/expenses with pagination
const getAllIncomeExpenses = async (req, res) => {
  const { page = 1, limit = 10, search = "", type = "ALL" } = req.query;

  try {
    const where = {
      userId: req.user.id,
      ...(type !== "ALL" && { category: { type } }), // Only add category filter if type is not "ALL"
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { category: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const incomeExpenses = await prisma.incomeExpense.findMany({
      where,
      include: {
        category: true,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const totalCount = await prisma.incomeExpense.count({ where });

    return res.json({
      success: true,
      data: {
        incomeExpenses,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: Number(page),
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllIncomeExpenses:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get income/expense by ID
// backend/src/controllers/v1/income-expense.controller.js
const getIncomeExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const incomeExpense = await prisma.incomeExpense.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!incomeExpense) {
      return res.status(404).json({
        success: false,
        message: 'Income/Expense not found',
      });
    }

    res.json({
      success: true,
      data: { incomeExpense },
    });
  } catch (error) {
    console.error('Error in getIncomeExpenseById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income/expense',
      error: error.message,
    });
  }
};

// Create new income/expense
const createIncomeExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Validate input
    const validatedData = incomeExpenseSchema.parse(req.body);

    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: { id: validatedData.categoryId, userId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Create record
    const incomeExpense = await prisma.incomeExpense.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { incomeExpense },
      message: 'Income/Expense created successfully',
    });
  } catch (error) {
    console.error('Error in createIncomeExpense:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create income/expense',
      error: error.message,
    });
  }
};

// Update income/expense
const updateIncomeExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate input
    const validatedData = incomeExpenseSchema.parse(req.body);

    // Check if record exists and belongs to user
    const existingRecord = await prisma.incomeExpense.findFirst({
      where: { id, userId },
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Income/Expense not found',
      });
    }

    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: { id: validatedData.categoryId, userId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Update record
    const incomeExpense = await prisma.incomeExpense.update({
      where: { id },
      data: validatedData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { incomeExpense },
      message: 'Income/Expense updated successfully',
    });
  } catch (error) {
    console.error('Error in updateIncomeExpense:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update income/expense',
      error: error.message,
    });
  }
};

// Delete income/expense
const deleteIncomeExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if record exists and belongs to user
    const existingRecord = await prisma.incomeExpense.findFirst({
      where: { id, userId },
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Income/Expense not found',
      });
    }

    // Delete record
    await prisma.incomeExpense.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Income/Expense deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteIncomeExpense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete income/expense',
      error: error.message,
    });
  }
};

module.exports = {
  getAllIncomeExpenses,
  getIncomeExpenseById,
  createIncomeExpense,
  updateIncomeExpense,
  deleteIncomeExpense,
}; 