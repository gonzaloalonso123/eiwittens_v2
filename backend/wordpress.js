const axios = require("axios");

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;
const APPLICATION_PASSWORD = process.env.WORDPRESS_APPLICATION_PASSWORD;

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
    console.error("Error deleting post:", error.message);
  }
};

const getAllPosts = async () => {
  try {
    const response = await axios.get(`${WORDPRESS_API_URL}?per_page=100`);
    return response.data;
  } catch (error) {
    console.error("Error getting all posts:", error.message);
  }
};

const deleteAllPosts = async () => {
  const posts = await getAllPosts();
  posts.forEach(async (post) => {
    if (post.author === 2) {
      await deletePost(post.id);
    }
  });
};

module.exports = {
  createPost,
  deletePost,
  getAllPosts,
  deleteAllPosts,
};
