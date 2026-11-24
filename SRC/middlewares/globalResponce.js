export const globalResponse = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    if (err) {
        const rawStatus = typeof err.cause === 'number' ? err.cause : (err.statusCode || err.status || 500);
        const statusCode = rawStatus >= 100 && rawStatus <= 599 ? rawStatus : 500;
        return res.status(statusCode).json({
            success: false,
            message: err.message || "Internal server error",
            stack: process.env.NODE_ENV === 'production' ? null : err.stack
        });
    }
    next();
};
