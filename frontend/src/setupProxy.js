module.exports = function(app) {
  // Ensure React Router works on refresh
  app.use((req, res, next) => {
    if (!req.url.startsWith('/api') && !req.url.includes('.')) {
      req.url = '/';
    }
    next();
  });
};