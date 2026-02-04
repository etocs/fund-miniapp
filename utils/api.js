// utils/api.js
/**
 * API 接口封装
 */

const config = require('./config.js');
const util = require('./util.js');

/**
 * 发起网络请求
 * @param {Object} options 请求参数
 * @returns {Promise} 请求结果
 */
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header || {
        'content-type': 'application/json',
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * GET 请求
 * @param {String} url URL
 * @param {Object} data 参数
 * @returns {Promise} 请求结果
 */
function get(url, data = {}) {
  // 将参数拼接到 URL
  const params = Object.keys(data)
    .map(key => `${key}=${encodeURIComponent(data[key])}`)
    .join('&');
  
  const fullUrl = params ? `${url}?${params}` : url;
  
  return request({
    url: fullUrl,
    method: 'GET',
  });
}

/**
 * POST 请求
 * @param {String} url URL
 * @param {Object} data 参数
 * @returns {Promise} 请求结果
 */
function post(url, data = {}) {
  return request({
    url,
    method: 'POST',
    data,
  });
}

/**
 * 获取基金实时估值
 * @param {String} fundCode 基金代码
 * @returns {Promise} 估值数据
 */
function getFundValuation(fundCode) {
  const url = `${config.API.FUND_GZ}${fundCode}.js`;
  return get(url).then(data => {
    // JSONP 格式，需要解析
    return util.parseJSONP(data);
  });
}

/**
 * 搜索基金
 * @param {String} keyword 关键词
 * @returns {Promise} 搜索结果
 */
function searchFund(keyword) {
  return get(config.API.FUND_SEARCH, {
    m: 1,
    key: keyword,
  }).then(data => {
    // 解析返回的数据
    if (typeof data === 'string') {
      const parsed = util.parseJSONP(data);
      return parsed ? parsed.Datas || [] : [];
    }
    return data.Datas || [];
  });
}

/**
 * 获取历史净值
 * @param {String} fundCode 基金代码
 * @param {Number} pageIndex 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise} 历史净值数据
 */
function getFundHistory(fundCode, pageIndex = 1, pageSize = 20) {
  return get(config.API.FUND_HISTORY, {
    fundCode,
    pageIndex,
    pageSize,
    startDate: '',
    endDate: '',
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
  return get(config.API.FUND_RANK, {
    op: 'ph',
    dt: 'kf',
    ft: fundType,
    rs: '',
    gs: 0,
    sc: sortType,
    st: 'desc',
    pi: pageIndex,
    pn: pageSize,
    v: Math.random(),
  }).then(data => {
    // 解析返回的 JSONP 数据
    if (typeof data === 'string') {
      // 提取数据部分
      const match = data.match(/var rankData = \{(.*?)\};/s);
      if (match) {
        try {
          const jsonStr = '{' + match[1] + '}';
          // 这是一个简化的解析，实际可能需要更复杂的处理
          const dataMatch = data.match(/datas:\[(.*?)\],/s);
          if (dataMatch) {
            const items = dataMatch[1].split('],[').map(item => {
              const fields = item.replace(/[\[\]"]/g, '').split(',');
              return {
                code: fields[0],
                name: fields[1],
                type: fields[3],
                nav: fields[4],
                accNav: fields[5],
                dayGrowth: fields[6],
                weekGrowth: fields[7],
                monthGrowth: fields[8],
                threeMonthGrowth: fields[9],
                sixMonthGrowth: fields[10],
                yearGrowth: fields[11],
              };
            });
            return items;
          }
        } catch (e) {
          console.error('排行数据解析失败', e);
        }
      }
    }
    return [];
  });
}

module.exports = {
  request,
  get,
  post,
  getFundValuation,
  searchFund,
  getFundHistory,
  getFundRank,
};
