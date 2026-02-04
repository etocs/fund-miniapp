// pages/detail/detail.js
/**
 * 基金详情页
 */

const fundService = require('../../services/fund.js');
const storage = require('../../services/storage.js');
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');

Page({
  data: {
    fundCode: '', // 基金代码
    fundInfo: null, // 基金信息
    historyData: [], // 历史净值数据
    chartData: [], // 图表数据
    isFavorite: false, // 是否已自选
    loading: true, // 加载状态
    activeTab: '1m', // 当前选中的时间范围
    timeRanges: config.TIME_RANGES, // 时间范围选项
    position: null, // 持仓信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { code } = options;
    if (code) {
      this.setData({ fundCode: code });
      this.loadFundDetail(code);
      this.loadFundHistory(code);
      this.checkFavorite(code);
      this.loadPosition(code);
    }
  },

  /**
   * 加载基金详情
   */
  async loadFundDetail(code) {
    try {
      const fundInfo = await fundService.getFundDetail(code);
      this.setData({
        fundInfo,
        loading: false,
      });
    } catch (err) {
      console.error('加载基金详情失败', err);
      util.showToast('加载失败，请稍后重试');
      this.setData({ loading: false });
    }
  },

  /**
   * 加载历史净值数据
   */
  async loadFundHistory(code, timeRange = '1m') {
    try {
      const result = await fundService.getFundHistory(code, 1, 100);
      const historyList = result.LSJZList || [];
      
      // 根据时间范围过滤数据
      const days = config.TIME_RANGES[timeRange].days;
      let filteredData = historyList;
      
      if (days > 0 && historyList.length > days) {
        filteredData = historyList.slice(0, days);
      }
      
      // 反转数组，使日期从旧到新
      filteredData = filteredData.reverse();
      
      this.setData({
        historyData: historyList,
        chartData: filteredData,
      });
    } catch (err) {
      console.error('加载历史数据失败', err);
    }
  },

  /**
   * 检查是否已自选
   */
  checkFavorite(code) {
    const isFavorite = storage.isFavorite(code);
    this.setData({ isFavorite });
  },

  /**
   * 加载持仓信息
   */
  loadPosition(code) {
    // 从自选列表中获取持仓信息
    const favorites = storage.getFavorites();
    const favorite = favorites.find(f => {
      const fundcode = typeof f === 'string' ? f : (f.fundcode || f.code);
      return fundcode === code;
    });
    
    if (favorite && typeof favorite === 'object' && favorite.shares > 0 && this.data.fundInfo) {
      // 计算收益
      const currentNav = parseFloat(this.data.fundInfo.gsz || this.data.fundInfo.valuation || this.data.fundInfo.nav);
      const profit = fundService.calculateProfit(
        favorite.shares,
        favorite.cost,
        currentNav
      );
      
      this.setData({
        position: {
          shares: favorite.shares,
          cost: favorite.cost,
          ...profit,
        },
      });
    }
  },

  /**
   * 切换时间范围
   */
  onTimeRangeChange(e) {
    const { range } = e.currentTarget.dataset;
    this.setData({ activeTab: range });
    this.loadFundHistory(this.data.fundCode, range);
  },

  /**
   * 添加/取消自选
   */
  onToggleFavorite() {
    const { fundCode, fundInfo, isFavorite } = this.data;
    
    if (isFavorite) {
      storage.removeFavorite(fundCode);
      util.showToast('已取消自选');
    } else {
      // 传递对象给 addFavorite，包含基金代码和名称
      storage.addFavorite({
        fundcode: fundCode,
        name: fundInfo?.name || '',
      });
      util.showToast('已添加到自选');
    }
    
    this.setData({ isFavorite: !isFavorite });
  },

  /**
   * 跳转到持仓计算器
   */
  goToCalculator() {
    wx.navigateTo({
      url: `/pages/calculator/calculator?code=${this.data.fundCode}`,
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: `${this.data.fundInfo?.name || '基金详情'}`,
      path: `/pages/detail/detail?code=${this.data.fundCode}`,
    };
  },

  /**
   * 格式化数字
   */
  formatNumber(num, decimals = 2) {
    return util.formatNumber(num, decimals);
  },

  /**
   * 格式化百分比
   */
  formatPercent(num, decimals = 2, showSign = true) {
    return util.formatPercent(num, decimals, showSign);
  },

  /**
   * 获取涨跌类名
   */
  getChangeClass(value) {
    return util.getChangeClass(value);
  },
});
