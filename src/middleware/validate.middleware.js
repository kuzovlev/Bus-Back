const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: error.errors,
      },
    });
  }
};

module.exports = { validateRequest }; 