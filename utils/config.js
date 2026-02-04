// utils/config.js
/**
 * 配置文件
 */

module.exports = {
  // API 基础地址
  API: {
    // 天天基金网
    FUND_GZ: 'http://fundgz.1234567.com.cn/js/', // 实时估值
    FUND_DETAIL: 'http://fund.eastmoney.com/', // 基金详情
    FUND_HISTORY: 'http://api.fund.eastmoney.com/f10/lsjz', // 历史净值
    FUND_RANK: 'http://fund.eastmoney.com/data/rankhandler.aspx', // 基金排行
    FUND_SEARCH: 'http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx', // 基金搜索
  },

  // 颜色配置
  COLORS: {
    PRIMARY: '#1989FA', // 主色调
    UP: '#EE4646', // 上涨红色
    DOWN: '#07C160', // 下跌绿色
    BG: '#F5F5F5', // 背景色
    CARD_BG: '#FFFFFF', // 卡片背景
    TEXT_PRIMARY: '#333333', // 主要文字
    TEXT_SECONDARY: '#999999', // 次要文字
  },

  // 缓存时间配置（毫秒）
  CACHE_TIME: {
    VALUATION: 5 * 60 * 1000, // 实时估值：5分钟
    DETAIL: 60 * 60 * 1000, // 详情数据：1小时
    RANK: 30 * 60 * 1000, // 排行榜：30分钟
  },

  // 基金类型
  FUND_TYPES: {
    gp: '股票型',
    hh: '混合型',
    zq: '债券型',
    zs: '指数型',
    qdii: 'QDII',
    lof: 'LOF',
    fof: 'FOF',
  },

  // 排序类型
  SORT_TYPES: {
    zzf: '日涨跌幅',
    z: '近1周',
    y: '近1月',
    '3y': '近3月',
    '6y': '近6月',
    '1n': '近1年',
    '3n': '近3年',
    jn: '今年来',
    ln: '成立来',
  },

  // 时间范围
  TIME_RANGES: {
    '1m': { label: '近1月', days: 30 },
    '3m': { label: '近3月', days: 90 },
    '6m': { label: '近6月', days: 180 },
    '1y': { label: '近1年', days: 365 },
    'all': { label: '全部', days: 0 },
  },
};