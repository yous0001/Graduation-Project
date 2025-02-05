export const getDocumentByName = (model) => {
    return async (req, res, next) => {
        const { name } = req.body;
        if (name) {
        const document = await model.findOne({ name });
        if (document) {
            return next(
            new Error(
                `${model.modelName} Document not found`,
                404,
                `${model.modelName} Document not found`
            )
            );
        }
        }
        next();
    };
};
