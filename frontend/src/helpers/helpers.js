export const formatDate = (raw) => {
  const { seconds, nanoseconds } = raw;
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month < 10 ? "0" + month : month}-${
    day < 10 ? "0" + day : day
  }`;
};
