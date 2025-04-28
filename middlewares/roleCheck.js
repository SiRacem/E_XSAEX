exports.isAdmin = (req, res, next) => {
    // يفترض أن verifyAuth قد أضاف req.user
    if (req.user && req.user.userRole === 'Admin') {
        console.log(`Role check: User ${req.user._id} is Admin. Proceeding.`);
        next(); // المستخدم أدمن، اسمح بالمرور
    } else {
        console.warn(`Role check failed: User ${req.user?._id} Role: ${req.user?.userRole}. Access denied.`);
        res.status(403).json({ msg: 'Forbidden: Access restricted to Administrators.' });
    }
};