import axios from "axios";
const backendUrl = process.env.REACT_APP_API_URL;

export const getStatus = async () => {
  return axios
    .post(`${backendUrl}/status`)
    .then((response) => {
      if (response.status === 200) {
        return true;
      }
      return false;
    })
    .catch((error) => {
      console.error(error);
      return false;
    });
};

export const testScraper = async (url, actions) => {
  return axios
    .post(`${backendUrl}/test-scraper`, {
      url,
      actions,
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      return false;
    });
};

export const pushToWordpress = async (url, actions) => {
  return axios
    .post(`${backendUrl}/push-to-wordpress`, {
      url,
      actions,
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      return false;
    });
};

export const scrapeAll = async () => {
  return axios
    .post(`${backendUrl}/scrape-all`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      return false;
    });
};
