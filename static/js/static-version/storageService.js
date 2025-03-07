/**
 * 本地存储服务 - 提供保存和加载数据的功能
 */

/**
 * 将数据保存到本地存储
 * @param {string} key - 存储的键名
 * @param {any} data - 要存储的数据
 */
export function saveToLocalStorage(key, data) {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    console.log(`数据已保存到本地存储 [${key}]`);
    return true;
  } catch (error) {
    console.error(`保存数据到本地存储失败 [${key}]:`, error);
    return false;
  }
}

/**
 * 从本地存储加载数据
 * @param {string} key - 存储的键名
 * @returns {any|null} 加载的数据，失败则返回null
 */
export function loadFromLocalStorage(key) {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      console.log(`本地存储中没有数据 [${key}]`);
      return null;
    }
    const data = JSON.parse(serializedData);
    console.log(`数据已从本地存储加载 [${key}]`);
    return data;
  } catch (error) {
    console.error(`从本地存储加载数据失败 [${key}]:`, error);
    return null;
  }
}

/**
 * 从本地存储删除数据
 * @param {string} key - 存储的键名
 */
export function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    console.log(`数据已从本地存储删除 [${key}]`);
    return true;
  } catch (error) {
    console.error(`从本地存储删除数据失败 [${key}]:`, error);
    return false;
  }
}

/**
 * 清空本地存储
 */
export function clearLocalStorage() {
  try {
    localStorage.clear();
    console.log("本地存储已清空");
    return true;
  } catch (error) {
    console.error("清空本地存储失败:", error);
    return false;
  }
}
