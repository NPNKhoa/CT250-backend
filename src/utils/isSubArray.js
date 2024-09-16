const isSubArray = (arr, parentArr) => {
  if (!Array.isArray(arr) || !Array.isArray(parentArr)) {
    return false;
  }

  return arr.every((element) => parentArr.includes(element));
};

export default isSubArray;
