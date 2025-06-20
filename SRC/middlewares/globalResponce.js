export const globalResponse = (err, req, res, next) => {
    if (err) {
        // console.log(err);
        res.status(err['cause'] || 500).json({
            success:false,
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack
        })
        next()
    }
}
