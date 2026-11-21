const { ValidationError } = require("../errors/AppError");

function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const details = [];
    for (const [location, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[location]);
      if (result.success) validated[location] = result.data;
      else for (const issue of result.error.issues) {
        const fields = issue.code === "unrecognized_keys"
          ? issue.keys : [issue.path.join(".")];
        for (const field of fields) {
          details.push({ location, field, message: issue.message });
        }
      }
    }
    if (details.length) return next(new ValidationError(details));
    req.validated = validated;
    next();
  };
}
module.exports = validate;
