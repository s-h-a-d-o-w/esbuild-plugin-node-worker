export default {
  "**/*.{mjs,js,ts}": "eslint --cache --cache-strategy content",
  "**/*.ts": () => "tsc",
};
