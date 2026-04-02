const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // Date filters
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("MMMM d, yyyy");
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISODate();
  });

  // Pass through images in content/blog
  eleventyConfig.addPassthroughCopy({ "content/blog/images": "blog/images" });

  return {
    dir: {
      input: "content/blog",
      output: "blog",
      layouts: "../../_layouts",
      includes: "../../_includes",
      data: "../../_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
