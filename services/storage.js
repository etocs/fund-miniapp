// services/storage.js
/**
 * 本地存储服务
 */

/**
 * 存储键名常量
 */
const KEYS = {
  FAVORITES: 'favorites', // 自选基金列表
  SEARCH_HISTORY: 'searchHistory', // 搜索历史
  POSITIONS: 'positions', // 持仓记录
  CACHE_PREFIX: 'cache_', // 缓存前缀
};

/**
 * 获取自选基金列表
 * @returns {Array} 基金代码列表
 */
function getFavorites() {
  try {
    return wx.getStorageSync(KEYS.FAVORITES) || [];
  } catch (e) {
    console.error('获取自选基金失败', e);
    return [];
  }
}

/**
 * 保存自选基金列表
 * @param {Array} favorites 基金代码列表
 * @returns {Boolean} 是否成功
 */
function setFavorites(favorites) {
  try {
    wx.setStorageSync(KEYS.FAVORITES, favorites);
    return true;
  } catch (e) {
    console.error('保存自选基金失败', e);
    return false;
  }
}

/**
 * 添加自选基金
 * @param {String|Object} fund 基金代码或基金对象
 * @returns {Boolean} 是否成功
 */
function addFavorite(fund) {
  const favorites = getFavorites();
  
  // 兼容两种传参方式：字符串代码或对象
  const fundCode = typeof fund === 'string' ? fund : (fund.fundcode || fund.code);
  const fundName = typeof fund === 'object' ? fund.name : '';
  const shares = typeof fund === 'object' ? (fund.shares || 0) : 0;
  const cost = typeof fund === 'object' ? (fund.cost || 0) : 0;
  
  if (!fundCode) {
    console.error('基金代码为空', fund);
    return false;
  }
  
  // 检查是否已存在
  const existingIndex = favorites.findIndex(f => {
    const code = typeof f === 'string' ? f : (f.fundcode || f.code);
    return code === fundCode;
  });
  
  if (existingIndex === -1) {
    // 添加新的自选基金
    favorites.unshift({
      fundcode: fundCode,
      name: fundName,
      shares: parseFloat(shares) || 0,
      cost: parseFloat(cost) || 0,
      addTime: Date.now(),
    });
    return setFavorites(favorites);
  }
  return true;
}

/**
 * 删除自选基金
 * @param {String} fundCode 基金代码
 * @returns {Boolean} 是否成功
 */
function removeFavorite(fundCode) {
  const favorites = getFavorites();
  const newFavorites = favorites.filter(item => {
    const code = typeof item === 'string' ? item : (item.fundcode || item.code);
    return code !== fundCode;
  });
  return setFavorites(newFavorites);
}

/**
 * 检查是否已自选
 * @param {String} fundCode 基金代码
 * @returns {Boolean} 是否已自选
 */
function isFavorite(fundCode) {
  const favorites = getFavorites();
  return favorites.some(item => {
    const code = typeof item === 'string' ? item : (item.fundcode || item.code);
    return code === fundCode;
  });
}

/**
 * 根据基金代码查找自选
 * @param {String} fundCode 基金代码
 * @returns {Object|null} 自选对象，如果不存在则返回null
 */
function getFavoriteByCode(fundCode) {
  const favorites = getFavorites();
  return favorites.find(item => {
    const code = typeof item === 'string' ? item : (item.fundcode || item.code);
    return code === fundCode;
  }) || null;
}

/**
 * 更新持仓信息
 * @param {String} fundcode 基金代码
 * @param {Number} shares 持有份额
 * @param {Number} cost 成本价
 * @returns {Boolean} 是否成功
 */
function updateHolding(fundcode, shares, cost) {
  const favorites = getFavorites();
  const index = favorites.findIndex(item => {
    const code = typeof item === 'string' ? item : (item.fundcode || item.code);
    return code === fundcode;
  });
  
  if (index === -1) return false;
  
  // 如果是字符串格式，转换为对象格式
  if (typeof favorites[index] === 'string') {
    favorites[index] = {
      fundcode: favorites[index],
      name: '',
      shares: parseFloat(shares) || 0,
      cost: parseFloat(cost) || 0,
      addTime: Date.now(),
    };
  } else {
    favorites[index].shares = parseFloat(shares) || 0;
    favorites[index].cost = parseFloat(cost) || 0;
  }
  
  return setFavorites(favorites);
}

/**
 * 获取搜索历史
 * @returns {Array} 搜索关键词列表
 */
function getSearchHistory() {
  try {
    return wx.getStorageSync(KEYS.SEARCH_HISTORY) || [];
  } catch (e) {
    console.error('获取搜索历史失败', e);
    return [];
  }
}

/**
 * 保存搜索历史
 * @param {Array} history 搜索关键词列表
 * @returns {Boolean} 是否成功
 */
function setSearchHistory(history) {
  try {
    wx.setStorageSync(KEYS.SEARCH_HISTORY, history);
    return true;
  } catch (e) {
    console.error('保存搜索历史失败', e);
    return false;
  }
}

/**
 * 添加搜索历史
 * @param {String} keyword 搜索关键词
 * @returns {Boolean} 是否成功
 */
function addSearchHistory(keyword) {
  if (!keyword || !keyword.trim()) return false;
  
  let history = getSearchHistory();
  // 移除已存在的相同关键词
  history = history.filter(item => item !== keyword);
  // 添加到开头
  history.unshift(keyword);
  // 最多保存 20 条
  if (history.length > 20) {
    history = history.slice(0, 20);
  }
  return setSearchHistory(history);
}

/**
 * 清空搜索历史
 * @returns {Boolean} 是否成功
 */
function clearSearchHistory() {
  return setSearchHistory([]);
}

/**
 * 获取持仓记录
 * @returns {Object} 持仓记录对象，键为基金代码
 */
function getPositions() {
  try {
    return wx.getStorageSync(KEYS.POSITIONS) || {};
  } catch (e) {
    console.error('获取持仓记录失败', e);
    return {};
  }
}

/**
 * 保存持仓记录
 * @param {Object} positions 持仓记录对象
 * @returns {Boolean} 是否成功
 */
function setPositions(positions) {
  try {
    wx.setStorageSync(KEYS.POSITIONS, positions);
    return true;
  } catch (e) {
    console.error('保存持仓记录失败', e);
    return false;
  }
}

/**
 * 获取单个基金的持仓记录
 * @param {String} fundCode 基金代码
 * @returns {Object|null} 持仓记录
 */
function getPosition(fundCode) {
  const positions = getPositions();
  return positions[fundCode] || null;
}

/**
 * 保存单个基金的持仓记录
 * @param {String} fundCode 基金代码
 * @param {Object} position 持仓记录 { shares, cost }
 * @returns {Boolean} 是否成功
 */
function setPosition(fundCode, position) {
  const positions = getPositions();
  positions[fundCode] = position;
  return setPositions(positions);
}

/**
 * 删除单个基金的持仓记录
 * @param {String} fundCode 基金代码
 * @returns {Boolean} 是否成功
 */
function removePosition(fundCode) {
  const positions = getPositions();
  delete positions[fundCode];
  return setPositions(positions);
}

/**
 * 设置缓存
 * @param {String} key 缓存键
 * @param {Any} data 缓存数据
 * @param {Number} expire 过期时间（毫秒）
 * @returns {Boolean} 是否成功
 */
function setCache(key, data, expire = 0) {
  try {
    const cacheKey = KEYS.CACHE_PREFIX + key;
    const cacheData = {
      data,
      expire: expire > 0 ? Date.now() + expire : 0,
    };
    wx.setStorageSync(cacheKey, cacheData);
    return true;
  } catch (e) {
    console.error('设置缓存失败', e);
    return false;
  }
}

/**
 * 获取缓存
 * @param {String} key 缓存键
 * @returns {Any|null} 缓存数据，如果过期或不存在则返回 null
 */
function getCache(key) {
  try {
    const cacheKey = KEYS.CACHE_PREFIX + key;
    const cacheData = wx.getStorageSync(cacheKey);
    
    if (!cacheData) return null;
    
    // 检查是否过期
    if (cacheData.expire > 0 && Date.now() > cacheData.expire) {
      // 删除过期缓存
      wx.removeStorageSync(cacheKey);
      return null;
    }
    
    return cacheData.data;
  } catch (e) {
    console.error('获取缓存失败', e);
    return null;
  }
}

/**
 * 删除缓存
 * @param {String} key 缓存键
 * @returns {Boolean} 是否成功
 */
function removeCache(key) {
  try {
    const cacheKey = KEYS.CACHE_PREFIX + key;
    wx.removeStorageSync(cacheKey);
    return true;
  } catch (e) {
    console.error('删除缓存失败', e);
    return false;
  }
}

/**
 * 清空所有缓存
 * @returns {Boolean} 是否成功
 */
function clearCache() {
  try {
    const info = wx.getStorageInfoSync();
    const keys = info.keys || [];
    
    keys.forEach(key => {
      if (key.startsWith(KEYS.CACHE_PREFIX)) {
        wx.removeStorageSync(key);
      }
    });
    
    return true;
  } catch (e) {
    console.error('清空缓存失败', e);
    return false;
  }
}

module.exports = {
  // 自选基金
  getFavorites,
  setFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  getFavoriteByCode,
  updateHolding,
  
  // 搜索历史
  getSearchHistory,
  setSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  
  // 持仓记录
  getPositions,
  setPositions,
  getPosition,
  setPosition,
  removePosition,
  
  // 缓存
  setCache,
  getCache,
  removeCache,
  clearCache,
};
