// services/fund.js
/**
 * 基金数据服务
 */

const api = require('../utils/api.js');
const storage = require('./storage.js');
const config = require('../utils/config.js');

/**
 * 获取基金实时估值（带缓存）
 * @param {String} fundCode 基金代码
 * @param {Boolean} useCache 是否使用缓存
 * @returns {Promise} 估值数据
 */
function getFundValuation(fundCode, useCache = true) {
  const cacheKey = `valuation_${fundCode}`;
  
  // 尝试从缓存获取
  if (useCache) {
    const cached = storage.getCache(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
  }
  
  // 从接口获取
  return api.getFundValuation(fundCode).then(data => {
    if (data) {
      // 保存到缓存
      storage.setCache(cacheKey, data, config.CACHE_TIME.VALUATION);
    }
    return data;
  });
}

/**
 * 批量获取基金实时估值
 * @param {Array} fundCodes 基金代码列表
 * @param {Boolean} useCache 是否使用缓存
 * @returns {Promise} 估值数据列表
 */
function getBatchFundValuation(fundCodes, useCache = true) {
  const promises = fundCodes.map(code => {
    return getFundValuation(code, useCache).catch(err => {
      console.error(`获取基金 ${code} 估值失败`, err);
      return null;
    });
  });
  
  return Promise.all(promises).then(results => {
    // 过滤掉失败的请求
    return results.filter(item => item !== null);
  });
}

/**
 * 搜索基金
 * @param {String} keyword 关键词
 * @returns {Promise} 搜索结果
 */
function searchFund(keyword) {
  if (!keyword || !keyword.trim()) {
    return Promise.resolve([]);
  }
  
  return api.searchFund(keyword).then(results => {
    // 格式化搜索结果
    return results.map(item => {
      const parts = item.split(',');
      return {
        code: parts[0],
        name: parts[1],
        type: parts[2],
        pinyin: parts[3],
      };
    });
  }).catch(err => {
    console.error('搜索基金失败', err);
    return [];
  });
}

/**
 * 获取基金历史净值
 * @param {String} fundCode 基金代码
 * @param {Number} pageIndex 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise} 历史净值数据
 */
function getFundHistory(fundCode, pageIndex = 1, pageSize = 20) {
  const cacheKey = `history_${fundCode}_${pageIndex}_${pageSize}`;
  
  // 尝试从缓存获取
  const cached = storage.getCache(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }
  
  // 从接口获取
  return api.getFundHistory(fundCode, pageIndex, pageSize).then(data => {
    if (data && data.Data) {
      // 保存到缓存
      storage.setCache(cacheKey, data.Data, config.CACHE_TIME.DETAIL);
      return data.Data;
    }
    return {
      LSJZList: [],
      TotalCount: 0,
    };
  }).catch(err => {
    console.error('获取历史净值失败', err);
    return {
      LSJZList: [],
      TotalCount: 0,
    };
  });
}

/**
 * 获取基金排行
 * @param {String} fundType 基金类型
 * @param {String} sortType 排序类型
 * @param {Number} pageIndex 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise} 排行数据
 */
function getFundRank(fundType = 'all', sortType = 'zzf', pageIndex = 1, pageSize = 50) {
  const cacheKey = `rank_${fundType}_${sortType}_${pageIndex}_${pageSize}`;
  
  // 尝试从缓存获取
  const cached = storage.getCache(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }
  
  // 从接口获取
  return api.getFundRank(fundType, sortType, pageIndex, pageSize).then(data => {
    if (data && data.length > 0) {
      // 保存到缓存
      storage.setCache(cacheKey, data, config.CACHE_TIME.RANK);
    }
    return data || [];
  }).catch(err => {
    console.error('获取基金排行失败', err);
    return [];
  });
}

/**
 * 获取基金详情
 * @param {String} fundCode 基金代码
 * @returns {Promise} 基金详情数据
 */
function getFundDetail(fundCode) {
  // 这里需要解析基金详情页面，实际项目中可能需要后端支持
  // 目前返回估值数据作为基础信息
  return getFundValuation(fundCode).then(data => {
    if (!data) {
      throw new Error('获取基金信息失败');
    }
    
    return {
      code: data.fundcode,
      name: data.name,
      nav: data.dwjz, // 单位净值
      navDate: data.jzrq, // 净值日期
      valuation: data.gsz, // 估值
      valuationTime: data.gztime, // 估值时间
      dayGrowth: data.gszzl, // 日涨跌幅
      // 以下字段需要从详情页解析或后端提供
      type: '混合型',
      company: '',
      manager: '',
      establishDate: '',
      scale: '',
      accNav: '', // 累计净值
    };
  });
}

/**
 * 计算持仓收益
 * @param {Number} shares 持有份额
 * @param {Number} cost 成本价
 * @param {Number} currentNav 当前净值
 * @returns {Object} 收益数据 { marketValue, profit, profitRate }
 */
function calculateProfit(shares, cost, currentNav) {
  if (!shares || !cost || !currentNav) {
    return {
      marketValue: 0,
      profit: 0,
      profitRate: 0,
    };
  }
  
  const marketValue = shares * currentNav; // 当前市值
  const costValue = shares * cost; // 成本
  const profit = marketValue - costValue; // 收益
  const profitRate = (profit / costValue) * 100; // 收益率
  
  return {
    marketValue,
    profit,
    profitRate,
  };
}

module.exports = {
  getFundValuation,
  getBatchFundValuation,
  searchFund,
  getFundHistory,
  getFundRank,
  getFundDetail,
  calculateProfit,
};
