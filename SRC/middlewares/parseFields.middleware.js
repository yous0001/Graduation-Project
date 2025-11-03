export function parseFieldsMiddleware(fields) {
  return (req, res, next) => {
    try {
      fields.forEach((field) => {
        if (req.body[field]) {
          req.body[field] = JSON.parse(req.body[field]);
        }
      });
      next();
    } catch {
      res
        .status(400)
        .json({ error: `Invalid JSON format in fields: ${fields}` });
    }
  };
}
