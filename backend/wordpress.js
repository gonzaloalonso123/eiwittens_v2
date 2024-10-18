const axios = require("axios");
const fs = require("fs");

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;
const APPLICATION_PASSWORD = process.env.WORDPRESS_APPLICATION_PASSWORD;
const BACKUP_URL = "./backup/backup.json";

const authString = Buffer.from(`gonzalo:${APPLICATION_PASSWORD}`).toString(
  "base64"
);

const createPost = async (post) => {
  try {
    const response = await axios.post(WORDPRESS_API_URL, post, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });
  } catch (error) {
    console.error("Error creating post:", error.message);
  }
};

const deletePost = async (postId) => {
  try {
    const response = await axios.delete(`${WORDPRESS_API_URL}/${postId}`, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

const getAllPosts = async () => {
  let allPosts = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get(
        `${WORDPRESS_API_URL}?per_page=100&page=${page}`
      );
      const posts = response.data;
      if (posts.length === 0) break;

      allPosts = allPosts.concat(posts);
      page++;
    } catch (error) {
      break;
    }
  }

  return allPosts;
};

const deleteAllPosts = async () => {
  const posts = await getAllPosts();
  console.log(`Total posts fetched: ${posts.length}`);

  for (const post of posts) {
    if (post.author === 2) {
      await deletePost(post.id);
    }
  }
};

const makeBackUp = async () => {
  const posts = await getAllPosts();
  fs.writeFileSync(
    BACKUP_URL,
    JSON.stringify(
      posts.filter((p) => p.author != 2),
      null,
      2
    )
  );
};

module.exports = {
  createPost,
  deletePost,
  getAllPosts,
  deleteAllPosts,
  makeBackUp,
};
