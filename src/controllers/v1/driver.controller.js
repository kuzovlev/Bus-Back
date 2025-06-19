const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');
const { driverSchema, driverUpdateSchema } = require('../../schemas/driver.schema');
const fs = require('fs').promises;

// Get all drivers with pagination
const getAllDrivers = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    try {
        const where = {
            vendorId: req.user.id,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { licenseNumber: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const drivers = await prisma.driver.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        });

        const totalCount = await prisma.driver.count({ where });

        return res.json({
            success: true,
            data: {
                drivers,
                pagination: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: Number(page),
                },
            },
        });
    } catch (error) {
        console.error('Error in getAllDrivers:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get driver by ID
const getDriverById = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user.id;

        const driver = await prisma.driver.findFirst({
            where: { id, vendorId },
            include: {
                assignedVehicle: {
                    select: {
                        id: true,
                        vehicleName: true,
                        vehicleNumber: true,
                    },
                },
            },
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        res.json({
            success: true,
            data: { driver },
        });
    } catch (error) {
        console.error('Error in getDriverById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver',
            error: error.message,
        });
    }
};

// Create new driver
const createDriver = async (req, res) => {
    try {
        const vendorId = req.user.id;
        
        // Validate input
        const validatedData = await driverSchema.parseAsync(req.body);

        // Handle file uploads with proper paths
        const driverPhoto = req.files?.driverPhoto?.[0] ? `/uploads/${req.files.driverPhoto[0].filename}` : null;
        const driverLicenseBack = req.files?.driverLicenseBack?.[0] ? `/uploads/${req.files.driverLicenseBack[0].filename}` : null;
        const driverLicenseFront = req.files?.driverLicenseFront?.[0] ? `/uploads/${req.files.driverLicenseFront[0].filename}` : null;
        const password = "12345678";

        // Create record
        const driver = await prisma.driver.create({
            data: {
                ...validatedData,
                vendorId,
                driverPhoto,
                driverLicenseBack,
                driverLicenseFront,
                password,
            },
        });

        res.status(201).json({
            success: true,
            data: { driver },
            message: 'Driver created successfully',
        });
    } catch (error) {
        console.error('Error in createDriver:', error);
        
        // Clean up uploaded files if validation fails
        if (req.files) {
            Object.values(req.files).forEach(async (files) => {
                if (files?.[0]?.path) {
                    try {
                        await fs.unlink(files[0].path);
                    } catch (unlinkError) {
                        console.error('Error deleting file:', unlinkError);
                    }
                }
            });
        }

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors,
            });
        }

        // Handle unique constraint violations
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: `A driver with this ${error.meta.target[0]} already exists`,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create driver',
            error: error.message,
        });
    }
};

// Update driver
const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user.id;

        // Validate input with context
        const validatedData = await driverUpdateSchema.parseAsync(req.body, {
            ctx: { driverId: id }
        });

        // Check if driver exists and belongs to vendor
        const existingDriver = await prisma.driver.findFirst({
            where: { id, vendorId },
        });

        if (!existingDriver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        // Handle file uploads with proper paths
        const updateData = {
            ...validatedData,
        };

        if (req.files?.driverPhoto?.[0]) {
            updateData.driverPhoto = `/uploads/${req.files.driverPhoto[0].filename}`;
            // Delete old photo if exists
            if (existingDriver.driverPhoto) {
                await fs.unlink(`public${existingDriver.driverPhoto}`).catch(console.error);
            }
        }
        if (req.files?.driverLicenseBack?.[0]) {
            updateData.driverLicenseBack = `/uploads/${req.files.driverLicenseBack[0].filename}`;
            if (existingDriver.driverLicenseBack) {
                await fs.unlink(`public${existingDriver.driverLicenseBack}`).catch(console.error);
            }
        }
        if (req.files?.driverLicenseFront?.[0]) {
            updateData.driverLicenseFront = `/uploads/${req.files.driverLicenseFront[0].filename}`;
            if (existingDriver.driverLicenseFront) {
                await fs.unlink(`public${existingDriver.driverLicenseFront}`).catch(console.error);
            }
        }

        // Update record
        const driver = await prisma.driver.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: { driver },
            message: 'Driver updated successfully',
        });
    } catch (error) {
        console.error('Error in updateDriver:', error);

        // Clean up uploaded files if validation fails
        if (req.files) {
            Object.values(req.files).forEach(async (files) => {
                if (files?.[0]?.path) {
                    try {
                        await fs.unlink(files[0].path);
                    } catch (unlinkError) {
                        console.error('Error deleting file:', unlinkError);
                    }
                }
            });
        }

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors,
            });
        }

        // Handle unique constraint violations
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: `A driver with this ${error.meta.target[0]} already exists`,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update driver',
            error: error.message,
        });
    }
};

// Delete driver
const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorId = req.user.id;

        // Check if driver exists and belongs to vendor
        const existingDriver = await prisma.driver.findFirst({
            where: { id, vendorId },
        });

        if (!existingDriver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found',
            });
        }

        // Delete record
        await prisma.driver.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Driver deleted successfully',
        });
    } catch (error) {
        console.error('Error in deleteDriver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete driver',
            error: error.message,
        });
    }
};

// Get vehicles for dropdown
const getVehiclesForDropdown = async (req, res) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { userId: req.user.id },
            select: {
                id: true,
                vehicleName: true,
                vehicleNumber: true,
            },
        });

        res.json({
            success: true,
            data: { vehicles },
        });
    } catch (error) {
        console.error('Error in getVehiclesForDropdown:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles',
            error: error.message,
        });
    }
};

module.exports = {
    getAllDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver,
    getVehiclesForDropdown,
}; 