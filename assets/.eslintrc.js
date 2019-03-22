module.exports = {
  extends: "airbnb-base",
  env: {
    browser: true
  },
  globals: {
    L: true,
    self: true
  },
  rules: {
    "linebreak-style": ["error", "windows"],
    "no-unused-vars": ["warn"]
  }
};
