// services/fund.js
/**
 * 基金数据服务
 * 使用天天基金网公开 API
 */

const config = require('../utils/config.js');
const storage = require('./storage.js');

/**
 * 网络请求封装
 * @param {String} url 请求地址
 * @returns {Promise} 返回响应数据
 */
function request(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * 将时间戳转换为本地日期字符串 (YYYY-MM-DD)
 * @param {Number} timestamp 时间戳
 * @returns {String} 日期字符串
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取基金实时估值
 * @param {String} code 基金代码
 * @returns {Promise} 返回基金估值数据
 */
async function getFundValuation(code) {
  try {
    const url = `${config.API.FUND_GZ}${code}.js`;
    const data = await request(url);
    
    // 解析 JSONP 格式: jsonpgz({...})
    const jsonStr = data.replace(/^jsonpgz\(/, '').replace(/\);?$/, '');
    const result = JSON.parse(jsonStr);
    
    return {
      code: result.fundcode,
      name: result.name,
      nav: result.dwjz, // 单位净值
      navDate: result.jzrq, // 净值日期
      valuation: result.gsz, // 估算值
      valuationRate: result.gszzl, // 估算涨跌幅
      valuationTime: result.gztime, // 估值时间
    };
  } catch (err) {
    console.error(`获取基金 ${code} 估值失败:`, err);
    throw err;
  }
}

/**
 * 批量获取基金估值
 * @param {Array} codes 基金代码数组
 * @param {Boolean} useCache 是否使用缓存，默认 true
 * @returns {Promise} 返回基金估值数组
 */
async function getBatchFundValuation(codes, useCache = true) {
  if (!codes || codes.length === 0) {
    return [];
  }
  
  const cacheKey = `batch_valuation_${codes.join('_')}`;
  
  try {
    // 检查缓存
    if (useCache) {
      const cached = storage.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // 并发请求所有基金估值
    const promises = codes.map(code => 
      getFundValuation(code).catch(err => {
        console.error(`获取基金 ${code} 估值失败:`, err);
        return null; // 失败时返回 null
      })
    );
    
    const results = await Promise.all(promises);
    
    // 过滤掉失败的请求
    const funds = results.filter(item => item !== null);
    
    // 缓存结果
    if (useCache && funds.length > 0) {
      storage.setCache(cacheKey, funds, config.CACHE_TIME.VALUATION);
    }
    
    return funds;
  } catch (err) {
    console.error('批量获取基金估值失败:', err);
    throw err;
  }
}

/**
 * 搜索基金
 * @param {String} keyword 搜索关键词
 * @returns {Promise} 返回搜索结果数组
 */
async function searchFund(keyword) {
  if (!keyword || !keyword.trim()) {
    return [];
  }
  
  try {
    const url = `${config.API.FUND_SEARCH}?m=1&key=${encodeURIComponent(keyword)}`;
    const data = await request(url);
    
    // API 返回格式: { Datas: [...], ErrCode: 0, ... }
    if (data.Datas && Array.isArray(data.Datas)) {
      return data.Datas.map(item => {
        // 兼容两种返回格式
        if (typeof item === 'string') {
          // 字符串格式: "004814,中欧红利优享混合A,混合型,zhoglhyxhhA"
          const parts = item.split(',');
          return {
            code: parts[0] || '', // 基金代码
            name: parts[1] || '', // 基金名称
            type: parts[2] || '', // 基金类型
            pinyin: parts[3] || '', // 拼音
          };
        } else if (typeof item === 'object' && item !== null) {
          // 对象格式
          return {
            code: item.CODE || item.code || item.FCODE || '',
            name: item.NAME || item.name || item.SHORTNAME || '',
            type: item.TYPE || item.type || item.FTYPE || '',
            pinyin: item.PINYIN || item.pinyin || '',
          };
        }
        return null;
      }).filter(item => item !== null && item.code !== '');
    }
    
    return [];
  } catch (err) {
    console.error('搜索基金失败:', err);
    throw err;
  }
}

/**
 * 获取基金历史净值
 * @param {String} code 基金代码
 * @param {Number} page 页码，默认 1
 * @param {Number} pageSize 每页数量，默认 20
 * @returns {Promise} 返回历史净值对象，包含 LSJZList 数组
 */
async function getFundHistory(code, page = 1, pageSize = 20) {
  try {
    const url = `${config.API.FUND_HISTORY}?callback=jQuery&fundCode=${code}&pageIndex=${page}&pageSize=${pageSize}&startDate=&endDate=`;
    const data = await request(url);
    
    // 解析 JSONP 格式
    const jsonStr = data.replace(/^jQuery\(/, '').replace(/\);?$/, '');
    const result = JSON.parse(jsonStr);
    
    if (result.Data && result.Data.LSJZList) {
      const LSJZList = result.Data.LSJZList.map(item => ({
        FSRQ: item.FSRQ, // 净值日期
        DWJZ: item.DWJZ, // 单位净值
        LJJZ: item.LJJZ, // 累计净值
        JZZZL: item.JZZZL, // 日涨跌幅
        SGZT: item.SGZT, // 申购状态
        SHZT: item.SHZT, // 赎回状态
      }));
      return { LSJZList };
    }
    
    return { LSJZList: [] };
  } catch (err) {
    console.error(`获取基金 ${code} 历史净值失败:`, err);
    // 如果历史净值接口失败，尝试从详情接口获取
    try {
      const detail = await getFundDetail(code);
      if (detail.netWorthTrend && detail.netWorthTrend.length > 0) {
        const LSJZList = detail.netWorthTrend.slice(0, pageSize).map(item => ({
          FSRQ: formatDate(item.x),
          DWJZ: item.y,
          JZZZL: item.equityReturn,
        }));
        return { LSJZList };
      }
    } catch (detailErr) {
      console.error('从详情接口获取历史净值也失败:', detailErr);
    }
    return { LSJZList: [] };
  }
}

/**
 * 获取基金详情
 * @param {String} code 基金代码
 * @returns {Promise} 返回基金详情数据
 */
async function getFundDetail(code) {
  try {
    const url = `${config.API.FUND_DETAIL}pingzhongdata/${code}.js`;
    const data = await request(url);
    
    // 解析 JavaScript 变量格式
    const extractVar = (varName) => {
      const regex = new RegExp(`var\\s+${varName}\\s*=\\s*"([^"]*)"`, 'i');
      const match = data.match(regex);
      return match ? match[1] : '';
    };
    
    const extractArrayVar = (varName) => {
      const regex = new RegExp(`var\\s+${varName}\\s*=\\s*(\\[.*?\\]);`, 's');
      const match = data.match(regex);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (e) {
          console.error(`解析 ${varName} 失败:`, e);
          return [];
        }
      }
      return [];
    };
    
    // 提取基本信息
    const name = extractVar('fS_name');
    const fundCode = extractVar('fS_code');
    const sourceRate = extractVar('fund_sourceRate');
    const rate = extractVar('fund_Rate');
    const discount = extractVar('fund_discount');
    
    // 提取收益率
    const returnRate1m = extractVar('syl_1y'); // 近一月
    const returnRate3m = extractVar('syl_3y'); // 近三月
    const returnRate6m = extractVar('syl_6y'); // 近六月
    const returnRate1y = extractVar('syl_1n'); // 近一年
    const returnRate3y = extractVar('syl_3n'); // 近三年
    const returnRateSinceEstablish = extractVar('syl_ln'); // 成立来
    
    // 提取净值走势数据
    const netWorthTrend = extractArrayVar('Data_netWorthTrend');
    
    // 提取基金经理信息
    const fundManagerData = extractArrayVar('Data_currentFundManager');
    
    // 提取持仓股票
    const stockCodes = extractArrayVar('stockCodes');
    
    // 获取最新估值
    let valuation = '';
    let valuationRate = '';
    let nav = '';
    let navDate = '';
    
    try {
      const valuationData = await getFundValuation(code);
      valuation = valuationData.valuation;
      valuationRate = valuationData.valuationRate;
      nav = valuationData.nav;
      navDate = valuationData.navDate;
    } catch (err) {
      console.error('获取估值失败，使用历史净值:', err);
      // 如果获取估值失败，使用净值走势的最后一个值
      if (netWorthTrend && netWorthTrend.length > 0) {
        const latest = netWorthTrend[netWorthTrend.length - 1];
        nav = latest.y;
        navDate = formatDate(latest.x);
      }
    }
    
    return {
      code: fundCode || code,
      name: name,
      nav: nav,
      navDate: navDate,
      valuation: valuation,
      valuationRate: valuationRate,
      sourceRate: sourceRate,
      rate: rate,
      discount: discount,
      returnRate1m: returnRate1m,
      returnRate3m: returnRate3m,
      returnRate6m: returnRate6m,
      returnRate1y: returnRate1y,
      returnRate3y: returnRate3y,
      returnRateSinceEstablish: returnRateSinceEstablish,
      netWorthTrend: netWorthTrend,
      fundManager: fundManagerData,
      stockCodes: stockCodes,
    };
  } catch (err) {
    console.error(`获取基金 ${code} 详情失败:`, err);
    throw err;
  }
}

/**
 * 获取基金排行
 * @param {String} fundType 基金类型，默认 'all'
 * @param {String} sortType 排序类型，默认 'zzf'
 * @param {Number} page 页码，默认 1
 * @param {Number} pageSize 每页数量，默认 50
 * @returns {Promise} 返回基金排行数据
 */
async function getFundRank(fundType = 'all', sortType = 'zzf', page = 1, pageSize = 50) {
  try {
    // 检查缓存
    const cacheKey = `rank_${fundType}_${sortType}_${page}_${pageSize}`;
    const cached = storage.getCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    const url = `${config.API.FUND_RANK}?op=ph&dt=kf&ft=${fundType}&rs=&gs=0&sc=${sortType}&st=desc&sd=&ed=&qdii=&tabSubtype=,,,,,&pi=${page}&pn=${pageSize}&dx=1`;
    const data = await request(url);
    
    // 解析返回数据，格式为: var rankData = [...];
    const match = data.match(/var\s+rankData\s*=\s*(\[.*?\]);/s);
    if (!match) {
      return [];
    }
    
    const rankData = JSON.parse(match[1]);
    const funds = rankData.map(item => {
      const parts = item.split(',');
      return {
        code: parts[0], // 基金代码
        name: parts[1], // 基金名称
        nav: parts[4], // 单位净值
        navDate: parts[3], // 净值日期
        dayRate: parts[6], // 日涨跌幅
        weekRate: parts[7], // 近1周
        monthRate: parts[8], // 近1月
        month3Rate: parts[9], // 近3月
        month6Rate: parts[10], // 近6月
        yearRate: parts[11], // 近1年
        year3Rate: parts[12], // 近3年
        thisYearRate: parts[13], // 今年来
        sinceEstablishRate: parts[14], // 成立来
      };
    });
    
    // 缓存数据
    storage.setCache(cacheKey, funds, config.CACHE_TIME.RANK);
    
    return funds;
  } catch (err) {
    console.error('获取基金排行失败:', err);
    // 如果排行接口失败，返回空数组而不是抛出错误
    return [];
  }
}

/**
 * 计算持仓收益
 * @param {Number} shares 持有份额
 * @param {Number} cost 成本价
 * @param {Number} currentNav 当前净值
 * @returns {Object} 返回收益计算结果
 */
function calculateProfit(shares, cost, currentNav) {
  const sharesNum = parseFloat(shares) || 0;
  const costNum = parseFloat(cost) || 0;
  const navNum = parseFloat(currentNav) || 0;
  
  if (sharesNum <= 0 || costNum <= 0 || navNum <= 0) {
    return {
      marketValue: 0, // 市值
      costValue: 0, // 成本
      profit: 0, // 收益金额
      profitRate: 0, // 收益率
    };
  }
  
  const marketValue = sharesNum * navNum; // 当前市值
  const costValue = sharesNum * costNum; // 总成本
  const profit = marketValue - costValue; // 收益金额
  const profitRate = ((navNum - costNum) / costNum * 100).toFixed(2); // 收益率
  
  return {
    marketValue: marketValue.toFixed(2),
    costValue: costValue.toFixed(2),
    profit: profit.toFixed(2),
    profitRate: profitRate,
  };
}

module.exports = {
  getFundValuation,
  getBatchFundValuation,
  searchFund,
  getFundHistory,
  getFundDetail,
  getFundRank,
  calculateProfit,
};
