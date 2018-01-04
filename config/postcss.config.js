module.exports = ({ file, options, env }) => {

  let plugins = [
    require('postcss-cssnext')({ warnForDuplicates: false }),
    require('postcss-flexibility'),
  ];

  if(env.NODE_ENV === 'production')
    plugins.push(require('cssnano'));

  return { plugins };

};
