/**
 * 获取基金实时估值
 * @param {String} code 基金代码
 * @returns {Promise<Object>} 基金估值信息
 */
function getFundValuation(code) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `http://fundgz.1234567.com.cn/js/${code}.js`,
      method: 'GET',
      success: (res) => {
        try {
          // 解析 JSONP 格式: jsonpgz({...})
          const jsonStr = res.data.replace(/^jsonpgz\(/, '').replace(/\)$/, '');
          const data = JSON.parse(jsonStr);
          
          resolve({
            code: data.fundcode,
            name: data.name,
            navDate: data.jzrq,
            nav: data.dwjz,
            valuation: data.gsz,
            valuationChange: data.gszzl,
            valuationTime: data.gztime,
          });
        } catch (err) {
          console.error('解析基金估值数据失败', err);
          reject(err);
        }
      },
      fail: (err) => {
        console.error('获取基金估值失败', err);
        reject(err);
      },
    });
  });
}

/**
 * 批量获取基金估值
 * @param {Array<String>} codes 基金代码数组
 * @returns {Promise<Array<Object>>} 基金估值信息数组
 */
function getBatchFundValuation(codes) {
  const promises = codes.map(code => getFundValuation(code));
  return Promise.all(promises);
}

/**
 * 搜索基金
 * @param {String} keyword 搜索关键词
 * @returns {Promise<Array<Object>>} 搜索结果
 */
function searchFund(keyword) {
  return new Promise((resolve, reject) => {
    if (!keyword || typeof keyword !== 'string') {
      resolve([]);
      return;
    }

    wx.request({
      url: `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx`,
      method: 'GET',
      data: {
        m: 1,
        key: keyword.trim(),
      },
      success: (res) => {
        try {
          const data = res.data;
          if (!data || !data.Datas) {
            resolve([]);
            return;
          }

          // 解析搜索结果
          const results = data.Datas.map(item => {
            const parts = item.split(',');
            return {
              code: parts[0],
              name: parts[1],
              type: parts[2],
              pinyin: parts[3],
            };
          });

          resolve(results);
        } catch (err) {
          console.error('解析基金搜索结果失败', err);
          reject(err);
        }
      },
      fail: (err) => {
        console.error('搜索基金失败', err);
        reject(err);
      },
    });
  });
}

/**
 * 获取基金历史净值
 * @param {String} code 基金代码
 * @param {Number} page 页码
 * @param {Number} pageSize 每页数量
 * @returns {Promise<Object>} 历史净值数据
 */
function getFundHistory(code, page = 1, pageSize = 20) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
      method: 'GET',
      success: (res) => {
        try {
          const content = res.data;
          
          // 解析 Data_netWorthTrend 净值走势数组
          const netWorthMatch = content.match(/var\s+Data_netWorthTrend\s*=\s*(\[[\s\S]*?\]);/);
          let netWorthData = [];
          
          if (netWorthMatch && netWorthMatch[1]) {
            netWorthData = JSON.parse(netWorthMatch[1]);
          }

          // 转换数据格式
          const LSJZList = netWorthData.map(item => ({
            FSRQ: new Date(item.x).toISOString().split('T')[0],
            DWJZ: item.y,
            JZZZL: item.equityReturn || '0.00',
          }));

          // 分页
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const pagedList = LSJZList.slice(start, end);

          resolve({
            LSJZList: pagedList,
            TotalCount: LSJZList.length,
            PageIndex: page,
            PageSize: pageSize,
          });
        } catch (err) {
          console.error('解析基金历史数据失败', err);
          reject(err);
        }
      },
      fail: (err) => {
        console.error('获取基金历史数据失败', err);
        reject(err);
      },
    });
  });
}

/**
 * 获取基金详情
 * @param {String} code 基金代码
 * @returns {Promise<Object>} 基金详情
 */
function getFundDetail(code) {
  return new Promise((resolve, reject) => {
    // 同时获取估值和详情
    Promise.all([
      getFundValuation(code),
      new Promise((resolve2, reject2) => {
        wx.request({
          url: `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
          method: 'GET',
          success: (res) => {
            try {
              const content = res.data;
              
              // 提取各项数据
              const escapeRegex = (str) => {
                return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              };

              const extractVar = (varName) => {
                const escapedName = escapeRegex(varName);
                const match = content.match(new RegExp(`var\\s+${escapedName}\\s*=\\s*"?([^";]*)"?;`));
                return match ? match[1] : '';
              };

              const extractArray = (varName) => {
                const escapedName = escapeRegex(varName);
                const match = content.match(new RegExp(`var\\s+${escapedName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
                if (match && match[1]) {
                  try {
                    return JSON.parse(match[1]);
                  } catch (e) {
                    return [];
                  }
                }
                return [];
              };

              const detail = {
                name: extractVar('fS_name'),
                code: extractVar('fS_code'),
                sourceRate: extractVar('fund_sourceRate'),
                rate: extractVar('fund_Rate'),
                yield1n: extractVar('syl_1n'),
                yield6y: extractVar('syl_6y'),
                yield3y: extractVar('syl_3y'),
                yield1y: extractVar('syl_1y'),
                netWorthTrend: extractArray('Data_netWorthTrend'),
                fundManager: extractArray('Data_currentFundManager'),
                stockCodes: extractVar('stockCodes'),
              };

              resolve2(detail);
            } catch (err) {
              console.error('解析基金详情失败', err);
              reject2(err);
            }
          },
          fail: (err) => {
            console.error('获取基金详情失败', err);
            reject2(err);
          },
        });
      }),
    ])
      .then(([valuation, detail]) => {
        resolve({
          ...valuation,
          ...detail,
        });
      })
      .catch(reject);
  });
}

/**
 * 获取基金排行
 * @param {String} type 排行类型
 * @returns {Promise<Array<Object>>} 基金排行列表
 * @note 当前为占位实现，返回空数组
 */
function getFundRank(type = 'all') {
  return new Promise((resolve) => {
    // 占位实现：返回空数组
    // TODO: 实际应该调用天天基金排行接口
    resolve([]);
  });
}

/**
 * 计算持仓收益
 * @param {Number} shares 持有份额
 * @param {Number} cost 成本价
 * @param {Number} currentNav 当前净值
 * @returns {Object} 收益信息
 */
function calculateProfit(shares, cost, currentNav) {
  if (!shares || !cost || !currentNav) {
    return {
      profit: 0,
      profitRate: 0,
      currentValue: 0,
      totalCost: 0,
    };
  }

  const totalCost = shares * cost;
  const currentValue = shares * currentNav;
  const profit = currentValue - totalCost;
  const profitRate = (profit / totalCost) * 100;

  return {
    profit: profit.toFixed(2),
    profitRate: profitRate.toFixed(2),
    currentValue: currentValue.toFixed(2),
    totalCost: totalCost.toFixed(2),
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