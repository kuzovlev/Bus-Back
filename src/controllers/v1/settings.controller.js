const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Define upload path
const uploadPath = path.join(__dirname, '../../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Validation schema
const settingSchema = z.object({
  keyName: z.string().min(1, 'Key name is required'),
  value: z.string().min(1, 'Value is required'),
  type: z.enum(['TEXT', 'IMAGE', 'JSON', 'BOOLEAN', 'NUMBER']),
});

// File filter for image uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
  }
};

// Get all settings with pagination and search
const getAllSettings = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const [settings, total] = await Promise.all([
      prisma.setting.findMany({
        where: {
          OR: [
            { keyName: { contains: search, mode: 'insensitive' } },
            { value: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.setting.count({
        where: {
          OR: [
            { keyName: { contains: search, mode: 'insensitive' } },
            { value: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Settings retrieved successfully',
      data: {
        settings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting settings',
      error: error.message,
    });
  }
};

// Get setting by ID
const getSettingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const setting = await prisma.setting.findUnique({
      where: { id },
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Setting retrieved successfully',
      data: setting,
    });
  } catch (error) {
    console.error('Error getting setting:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting setting',
      error: error.message,
    });
  }
};

// Get setting by key name
const getSettingByKey = async (req, res) => {
  try {
    const { keyName } = req.params;
    
    const setting = await prisma.setting.findUnique({
      where: { keyName },
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Setting retrieved successfully',
      data: setting,
    });
  } catch (error) {
    console.error('Error getting setting:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting setting',
      error: error.message,
    });
  }
};

// Create or update setting
const createSetting = async (req, res) => {
  try {
    const { keyName, type } = req.body;
    let { value } = req.body;

    // Validate required fields
    if (!keyName || !type) {
      return res.status(400).json({
        success: false,
        message: 'Key name and type are required',
      });
    }

    // Handle file upload for IMAGE type
    if (type === 'IMAGE' && req.file) {
      // If updating, check for existing file to delete
      const existingSetting = await prisma.setting.findUnique({
        where: { keyName },
      });

      if (existingSetting?.type === 'IMAGE' && existingSetting.value) {
        const oldFilePath = path.join(uploadPath, existingSetting.value);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Use the uploaded file name as the value
      value = req.file.filename;
    }

    // Create or update setting
    const setting = await prisma.setting.upsert({
      where: { keyName },
      update: {
        value,
        type,
      },
      create: {
        keyName,
        value,
        type,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Setting created/updated successfully',
      data: setting,
    });
  } catch (error) {
    console.error('Error creating/updating setting:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating/updating setting',
      error: error.message,
    });
  }
};

// Update setting
const updateSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyName, value, type } = req.body;

    const existingSetting = await prisma.setting.findUnique({
      where: { id },
    });

    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    // Handle file upload for IMAGE type
    if (type === 'IMAGE' && req.file) {
      // Delete old image if exists
      if (existingSetting.type === 'IMAGE' && existingSetting.value) {
        const oldFilePath = path.join(uploadPath, existingSetting.value);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const setting = await prisma.setting.update({
        where: { id },
        data: {
          value: req.file.filename,
          type: 'IMAGE',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Setting updated successfully',
        data: setting,
      });
    }

    // Validate input for non-file settings
    const validatedData = settingSchema.parse({
      keyName,
      value,
      type,
    });

    // Update setting
    const setting = await prisma.setting.update({
      where: { id },
      data: {
        keyName: validatedData.keyName,
        value: validatedData.value,
        type: validatedData.type,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting,
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating setting',
      error: error.message,
    });
  }
};

// Delete setting
const deleteSetting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const setting = await prisma.setting.findUnique({
      where: { id },
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    // If it's an image, delete the file
    if (setting.type === 'IMAGE' && setting.value) {
      const filePath = path.join(uploadPath, setting.value);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the setting from database
    await prisma.setting.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting setting',
      error: error.message,
    });
  }
};

module.exports = {
  getAllSettings,
  getSettingById,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting,
}; 