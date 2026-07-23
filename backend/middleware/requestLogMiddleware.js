const RequestLog = require('../models/RequestLog');

const requestLogger = (req, res, next) => {
  // Flag to be set when a cache is hit
  req.cacheHit = false;

  const originalSend = res.send;
  res.send = function (body) {
    res.locals.bodyLength = body ? Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body)) : 0;
    return originalSend.apply(this, arguments);
  };

  res.on('finish', async () => {
    // Only log API calls, exclude admin requests to avoid self-logging analytics
    const urlPath = req.originalUrl.split('?')[0];
    if (!req.originalUrl.startsWith('/api') || urlPath.includes('/admin/analytics') || urlPath.includes('/admin/logs')) {
      return;
    }

    try {
      const bandwidthBytes = parseInt(res.get('Content-Length')) || res.locals.bodyLength || 0;
      const isCached = req.cacheHit || res.locals.cacheHit || false;

      await RequestLog.create({
        url: urlPath,
        method: req.method,
        statusCode: res.statusCode,
        bandwidthBytes,
        cached: isCached,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('[RequestLogger Error] Failed to save log:', err.message);
    }
  });

  next();
};

module.exports = requestLogger;
