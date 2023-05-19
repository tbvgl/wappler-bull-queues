exports.handler = function(app) {
    app.use((req, res, next) => {
        res.locals.forwardedHeaders = req.headers;
        res.locals.forwardedSession = req.session;
        next();
    });
};