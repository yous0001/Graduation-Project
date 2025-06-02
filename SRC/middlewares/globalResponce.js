export const globalResponse = (err, req, res, next) => {
    if (err) {
        // console.log(err);
        res.status(err['cause'] || 500).json({
            message: 'Catch error',
            error_msg: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack
        })
        next()
    }
}
