// Role-based middleware functions

const isAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking admin role',
    });
  }
};

const isVendor = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (user.role !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vendor role required.',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking vendor role',
    });
  }
};

const isAdminOrVendor = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (user.role !== 'ADMIN' && user.role !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Vendor role required.',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking admin/vendor role',
    });
  }
};

const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error checking role permissions',
      });
    }
  };
};

module.exports = {
  isAdmin,
  isVendor,
  isAdminOrVendor,
  hasRole
}; 