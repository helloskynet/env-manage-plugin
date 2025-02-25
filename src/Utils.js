class Utils {
  /**
   * 去除具有相同 name 和 port 组合的环境配置重复项
   * @param {Array} envList - 环境配置列表
   * @returns {Array} - 去重后的环境配置列表
   */
  static removeEnvDuplicates = (envList) => {
    const uniqueMap = new Map();
    const result = [];

    envList.forEach((item) => {
      const key = `${item.name}-${item.port}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        result.push(item);
      }
    });

    return result;
  };

/**
 * 转化列表为 Map
 * @param {*} list 
 * @param {*} keyGenerator 
 * @returns 
 */
  static generateMap(list, keyGenerator) {
    return list.reduce((map, item) => {
        map[keyGenerator(item)] = item;
        return map;
    }, {});
}
}

module.exports = Utils;