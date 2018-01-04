/**
 * Source map filter. This is temporary solution until we can do this at higher layer. This should only be applied to
 * static file to prevent filter out other file unintentionally
 *
 * @param next
 */
function applySourceMapFilter(next) {
  return (req, res) => {
    if(process.env.SOURCE_MAP_ENABLED !== true && process.env.SOURCE_MAP_ENABLED !== 'true') {
      let p = req.url.path;
      if(p.endsWith('.map') || p.endsWith('.map.gz')) return res().code(404);
    }
    next(req, res);
  };
}

export default applySourceMapFilter;
