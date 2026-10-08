const { DateTime } = require("luxon");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  const isRealPost = (post) => post.data.layout !== "redirect.njk";

  eleventyConfig.addCollection("post", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("content/blog/*.md")
      .filter(isRealPost)
      .sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addCollection("postTerraLuz", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("content/blog/*.md")
      .filter((post) => isRealPost(post) && post.data.property === "terra-luz")
      .sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addCollection("postCozyCactus", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("content/blog/*.md")
      .filter((post) => isRealPost(post) && post.data.property === "cozy-cactus")
      .sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addCollection("postSundune", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("content/blog/*.md")
      .filter((post) => isRealPost(post) && ["ps-retreat", "the-sundune"].includes(post.data.property))
      .sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addCollection("postGeneral", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("content/blog/*.md")
      .filter(
        (post) =>
          isRealPost(post) &&
          (!post.data.property || ["all", "indio-properties"].includes(post.data.property))
      )
      .sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("MMMM d, yyyy");
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISODate();
  });

  // Portrait/square photos get .portrait (max-height 560px, centered) per the Image Sizing Rule.
  eleventyConfig.addTransform("portraitImages", (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return content.replace(/<img\b[^>]*>/g, (tag) => {
      const w = +(/\bwidth="(\d+)"/.exec(tag) || [])[1];
      const h = +(/\bheight="(\d+)"/.exec(tag) || [])[1];
      if (!w || !h || h < w * 0.72) return tag;
      const c = h >= w * 0.9 ? "portrait" : "squarish";
      return /\bclass="/.test(tag) ? tag.replace(/\bclass="/, `class="${c} `) : tag.replace("<img", `<img class="${c}"`);
    });
  });

  eleventyConfig.addPassthroughCopy({ "content/blog/images": "images" });
  eleventyConfig.addPassthroughCopy({ "content/blog/videos": "videos" });

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
