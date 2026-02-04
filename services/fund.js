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
      fundcode: result.fundcode, // 保留原始字段名
      code: result.fundcode, // 同时提供 code 字段兼容
      name: result.name,
      dwjz: result.dwjz, // 单位净值（原始字段名）
      gsz: result.gsz, // 估算值（原始字段名）
      gszzl: result.gszzl, // 估算涨跌幅（原始字段名）
      gztime: result.gztime, // 估值时间（原始字段名）
      jzrq: result.jzrq, // 净值日期（原始字段名）
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
 * @param {Array} funds 基金数组（可以是字符串代码或对象）
 * @param {Boolean} useCache 是否使用缓存，默认 true
 * @returns {Promise} 返回基金估值数组
 */
async function getBatchFundValuation(funds, useCache = true) {
  if (!funds || funds.length === 0) {
    return [];
  }
  
  // 提取基金代码
  const codes = funds.map(f => typeof f === 'string' ? f : (f.fundcode || f.code));
  
  const cacheKey = `batch_valuation_${codes.join('_')}`;
  
  try {
    // 检查缓存
    if (useCache) {
      const cached = storage.getCache(cacheKey);
      if (cached) {
        // 合并缓存数据与持仓信息
        return cached.map(item => {
          const fund = funds.find(f => {
            const code = typeof f === 'string' ? f : (f.fundcode || f.code);
            return code === item.fundcode;
          });
          
          if (typeof fund === 'object' && fund.shares) {
            // 计算盈亏
            const profitData = calculateProfit(fund.shares, fund.cost, item.gsz);
            return { ...item, ...fund, ...profitData };
          }
          return item;
        });
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
    const valuations = results.filter(item => item !== null);
    
    // 缓存结果
    if (useCache && valuations.length > 0) {
      storage.setCache(cacheKey, valuations, config.CACHE_TIME.VALUATION);
    }
    
    // 合并持仓信息和计算盈亏
    const fundList = valuations.map(item => {
      const fund = funds.find(f => {
        const code = typeof f === 'string' ? f : (f.fundcode || f.code);
        return code === item.fundcode;
      });
      
      if (typeof fund === 'object' && fund.shares) {
        // 计算盈亏
        const profitData = calculateProfit(fund.shares, fund.cost, item.gsz);
        return { ...item, ...fund, ...profitData };
      }
      return item;
    });
    
    return fundList;
  } catch (err) {
    console.error('批量获取基金估值失败:', err);
    throw err;
  }
}

/**
 * 搜索基金
 * @param {String} keyword 搜索关键词（当前仅支持基金代码精确搜索）
 * @returns {Promise} 返回搜索结果数组
 */
async function searchFund(keyword) {
  if (!keyword || !keyword.trim()) {
    return [];
  }
  
  try {
    // 使用估值接口搜索单个基金（按代码精确搜索）
    // 由于搜索 API 实际返回 JSONP 格式，这里直接使用估值接口按基金代码查询
    const url = `${config.API.FUND_GZ}${keyword}.js`;
    const data = await request(url);
    
    // 解析 JSONP 格式: jsonpgz({...})
    const jsonStr = data.replace(/^jsonpgz\(/, '').replace(/\);?$/, '');
    const result = JSON.parse(jsonStr);
    
    // 如果成功获取到基金信息，返回数组
    if (result && result.fundcode) {
      return [{
        fundcode: result.fundcode, // 保留原始字段名
        code: result.fundcode, // 同时提供 code 字段兼容
        name: result.name,
        nav: result.dwjz,
        navDate: result.jzrq,
        gsz: result.gsz,  // 估算值
        gszzl: result.gszzl,  // 估算涨跌幅
        gztime: result.gztime,  // 估值时间
      }];
    }
    
    return [];
  } catch (err) {
    console.error('搜索基金失败:', err);
    // 搜索失败时返回空数组而不是抛出错误，避免页面崩溃
    return [];
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
      // 使用更精确的正则，匹配到分号结束
      // 匹配格式: var varName = [...] 或 var varName = {...}
      // 正则说明：
      // - var\s+${varName}\s*=\s* : 匹配变量声明
      // - ([\[\{][\s\S]*?) : 捕获以 [ 或 { 开头的数组/对象内容（非贪婪）
      // - \s*;(?=\s*(?:var|/\*|$)) : 匹配分号，后面跟着下一个var、注释或结尾（向前查找）
      const regex = new RegExp(`var\\s+${varName}\\s*=\\s*([\\[\\{][\\s\\S]*?)\\s*;(?=\\s*(?:var|/\\*|$))`, 'm');
      const match = data.match(regex);
      if (match) {
        try {
          // 清理可能的尾部空白
          let jsonStr = match[1].trim();
          return JSON.parse(jsonStr);
        } catch (e) {
          console.warn(`解析 ${varName} 失败:`, e.message);
          // 根据变量名类型返回默认值：Manager相关返回数组，其他返回对象
          return varName.includes('Manager') ? [] : {};
        }
      }
      // 根据变量名类型返回默认值
      return varName.includes('Manager') ? [] : {};
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
    
    // 提取复杂数据
    const netWorthTrend = extractArrayVar('Data_netWorthTrend');
    const fundManagerData = extractArrayVar('Data_currentFundManager');
    const assetAllocation = extractArrayVar('Data_assetAllocation');
    const performanceEvaluation = extractArrayVar('Data_performanceEvaluation');
    
    // 获取最新估值
    let valuationData = {};
    try {
      valuationData = await getFundValuation(code);
    } catch (err) {
      console.warn('获取估值失败，使用历史数据');
    }
    
    return {
      fundcode: fundCode || code,
      code: fundCode || code,
      name: name,
      dwjz: valuationData.dwjz || '',
      gsz: valuationData.gsz || '',
      gszzl: valuationData.gszzl || '',
      gztime: valuationData.gztime || '',
      nav: valuationData.nav || valuationData.dwjz || '',
      navDate: valuationData.navDate || valuationData.jzrq || '',
      valuation: valuationData.valuation || valuationData.gsz || '',
      valuationRate: valuationData.valuationRate || valuationData.gszzl || '',
      valuationTime: valuationData.valuationTime || valuationData.gztime || '',
      sourceRate: sourceRate,
      rate: rate,
      returnRate1m: returnRate1m,
      returnRate3m: returnRate3m,
      returnRate6m: returnRate6m,
      returnRate1y: returnRate1y,
      netWorthTrend: netWorthTrend,
      fundManager: fundManagerData,
      assetAllocation: assetAllocation,
      performanceEvaluation: performanceEvaluation,
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
