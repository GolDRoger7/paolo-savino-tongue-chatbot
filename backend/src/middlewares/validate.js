/**
 * Middleware di validazione generici basati su zod.
 * Ricevono uno schema e validano rispettivamente body o params, restituendo
 * un 400 con i dettagli se la validazione fallisce.
 */

function formatIssues(error) {
  return error.issues.map((i) => ({
    field: i.path.join(".") || "body",
    message: i.message,
  }));
}

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Dati della richiesta non validi.",
      details: formatIssues(result.error),
    });
  }
  req.validatedBody = result.data;
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({
      error: "Parametri non validi.",
      details: formatIssues(result.error),
    });
  }
  req.validatedParams = result.data;
  next();
};

module.exports = { validateBody, validateParams };
