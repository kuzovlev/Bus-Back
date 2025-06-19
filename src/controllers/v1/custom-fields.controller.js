const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

// Validation schema
const customFieldSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  customFields: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      throw new Error('Invalid JSON format for customFields');
    }
  }),
});

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/custom/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Get all custom fields with pagination and search
const getAllCustomFields = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.customField.count({ where });

    // Get custom fields with pagination
    const customFields = await prisma.customField.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      message: 'Custom fields retrieved successfully',
      data: {
        customFields,
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
      message: error.message || 'Error retrieving custom fields',
    });
  }
};

// Get custom field by ID
const getCustomFieldById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customField = await prisma.customField.findUnique({
      where: { id },
    });
    
    if (!customField) {
      return res.status(404).json({
        success: false,
        message: 'Custom field not found',
      });
    }

    // Handle customFields parsing safely
    let parsedCustomFields = [];
    try {
      // Check if customFields is already an object/array
      if (typeof customField.customFields === 'string') {
        parsedCustomFields = JSON.parse(customField.customFields);
      } else if (Array.isArray(customField.customFields)) {
        parsedCustomFields = customField.customFields;
      } else if (typeof customField.customFields === 'object') {
        parsedCustomFields = [customField.customFields];
      }
    } catch (parseError) {
      console.error('Error parsing customFields:', parseError);
      parsedCustomFields = [];
    }
    
    res.json({
      success: true,
      message: 'Custom field retrieved successfully',
      data: {
        ...customField,
        customFields: parsedCustomFields,
      },
    });
  } catch (error) {
    console.error('Error in getCustomFieldById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving custom field',
    });
  }
};

// Create custom field
const createCustomField = async (req, res) => {
  const uploadMiddleware = upload.any();

  try {
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const validatedData = customFieldSchema.parse(req.body);
    
    // Process images in custom fields
    let imageIndex = 0;
    const updatedFields = validatedData.customFields.map(field => {
      if (field.type === 'image' && req.files[imageIndex]) {
        const imagePath = `custom/${req.files[imageIndex].filename}`;
        imageIndex++;
        return { ...field, imagePath };
      }
      return field;
    });

    const customField = await prisma.customField.create({
      data: {
        name: validatedData.name,
        customFields: updatedFields,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Custom field created successfully',
      data: customField,
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
      message: error.message || 'Error creating custom field',
    });
  }
};

// Update custom field
const updateCustomField = async (req, res) => {
  const uploadMiddleware = upload.any();

  try {
    // Handle file upload
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const { id } = req.params;
    const { name, customFields } = req.body;

    // Safely parse the customFields
    let parsedFields;
    try {
      parsedFields = JSON.parse(customFields);
      if (!Array.isArray(parsedFields)) {
        throw new Error('Custom fields must be an array');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custom fields format',
      });
    }

    // Find the custom field
    const customField = await prisma.customField.findUnique({
      where: { id },
    });

    if (!customField) {
      return res.status(404).json({
        success: false,
        message: 'Custom field not found',
      });
    }

    // Process the fields and handle file uploads
    let imageIndex = 0;
    const updatedFields = parsedFields.map((field) => {
      if (field.type === 'image') {
        if (req.files && req.files[imageIndex]) {
          // Handle new file upload
          const file = req.files[imageIndex];
          const imagePath = `custom/${file.filename}`;
          imageIndex++;

          // Delete old image if it exists
          if (field.imagePath) {
            try {
              const oldPath = path.join('uploads', field.imagePath);
              if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
              }
            } catch (error) {
              console.error('Error deleting old image:', error);
            }
          }

          return { ...field, imagePath };
        } else {
          // Keep existing image path
          return field;
        }
      }
      return field;
    });

    // Update the custom field
    const updatedCustomField = await prisma.customField.update({
      where: { id },
      data: {
        name,
        customFields: updatedFields,
      },
    });

    res.json({
      success: true,
      message: 'Custom field updated successfully',
      data: updatedCustomField,
    });
  } catch (error) {
    console.error('Error in updateCustomField:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating custom field',
    });
  }
};

// Delete custom field
const deleteCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customField = await prisma.customField.findUnique({
      where: { id },
    });

    if (!customField) {
      return res.status(404).json({
        success: false,
        message: 'Custom field not found',
      });
    }

    // Delete associated images
    // const fields = JSON.parse(customField.customFields);
    // for (const field of fields) {
    //   if (field.type === 'image' && field.imagePath) {
    //     await fs.unlink(path.join('public/uploads', field.imagePath)).catch(console.error);
    //   }
    // }

    await prisma.customField.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Custom field deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting custom field',
    });
  }
};

// Get custom fields by name
const getCustomFieldByName = async (req, res) => {
  const { name } = req.params;
  try {
    const customFields = await prisma.customField.findMany({
      where: { name }
    });

    if (!customFields || customFields.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Custom fields not found'
      });
    }

    // Parse customFields for each model
    const parsedFields = customFields.map(field => {
      try {
        const customFieldsData = typeof field.customFields === 'string' 
          ? JSON.parse(field.customFields)
          : field.customFields;

        return {
          ...field,
          customFields: customFieldsData
        };
      } catch (parseError) {
        console.error('Error parsing customFields:', parseError);
        return {
          ...field,
          customFields: []
        };
      }
    });

    // Transform the response data
    let transformedData;
    
    // Check if there's only a single item
    if (parsedFields.length === 1) {
      const singleItem = parsedFields[0];
      const mappedFields = {};

      // Map the customFields directly into a single object
      if (Array.isArray(singleItem.customFields)) {
        singleItem.customFields.forEach((field) => {
          mappedFields[field.key] = field.type === "image" ? field.imagePath : field.value;
        });
      }

      transformedData = mappedFields; // Single object
    } else {
      // Handle multiple items
      transformedData = parsedFields.map((item) => {
        const mappedFields = {};
        if (Array.isArray(item.customFields)) {
          item.customFields.forEach((field) => {
            mappedFields[field.key] = field.type === "image" ? field.imagePath : field.value;
          });
        }
        return mappedFields;
      });
    }

    return res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error("Error retrieving custom fields by name:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllCustomFields,
  getCustomFieldById,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getCustomFieldByName,
}; 