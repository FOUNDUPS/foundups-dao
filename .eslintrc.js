module.exports = {
  ignorePatterns: ['coverage/'],
  env: {
    es2021: true,
    mocha: true
  },
  extends: [
    'standard'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      babelrc: false,
      configFile: false
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
  }
}
