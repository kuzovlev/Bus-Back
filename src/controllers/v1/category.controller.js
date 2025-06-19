const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schema
const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['INCOME', 'EXPENSE']),
});

// Get all categories with pagination for the logged-in user
const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      userId: req.user.id, // Filter by logged-in user
    };

    // Add type filter if provided
    if (type) {
      where.type = type;
    }

    // Add search filter if provided
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.category.count({ where });

    // Get categories
    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            incomeExpenses: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving categories',
    });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: {
        id,
        userId: req.user.id, // Ensure category belongs to user
      },
      include: {
        _count: {
          select: {
            incomeExpenses: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving category',
    });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const validatedData = categorySchema.parse(req.body);

    // Check if category with same name and type exists for user
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        type: validatedData.type,
        userId: req.user.id,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name and type already exists',
      });
    }

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId: req.user.id, // Associate with logged-in user
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating category',
    });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = categorySchema.parse(req.body);

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findUnique({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if another category with same name and type exists
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: validatedData.name,
        type: validatedData.type,
        userId: req.user.id,
      },
    });

    if (duplicateCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name and type already exists',
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating category',
    });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists and belongs to user
    const category = await prisma.category.findUnique({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        _count: {
          select: {
            incomeExpenses: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category has associated transactions
    if (category._count.incomeExpenses > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated transactions',
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting category',
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}; 