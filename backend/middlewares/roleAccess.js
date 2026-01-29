const roleAcess = (...roles) => {
    return (req, res, next) => {

        const user = req.user || req.session?.user;
        if (!user)
            return res.status(401).json({ msg: "Unauthorized" });

        const role = user.role;

        if (!roles.includes(role)) {
            console.log(`[RoleAccess] Denied: UserRole=${role}, Allowed=${roles}`);
            return res.status(403).json({ msg: 'Access denied: Insufficient permissions' });
        }
        console.log(`[RoleAccess] Granted. User: ${user._id} (${role}) -> Route requires: ${JSON.stringify(roles)}`);
        next();
    }
}

module.exports = roleAcess;