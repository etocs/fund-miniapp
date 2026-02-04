// pages/rank/rank.js
/**
 * 基金排行榜页
 */

const fundService = require('../../services/fund.js');
const storage = require('../../services/storage.js');
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');

Page({
  data: {
    fundList: [], // 基金列表
    loading: false, // 加载状态
    fundType: 'all', // 基金类型
    sortType: 'zzf', // 排序类型
    fundTypes: [
      { value: 'all', label: '全部' },
      { value: 'gp', label: '股票型' },
      { value: 'hh', label: '混合型' },
      { value: 'zq', label: '债券型' },
      { value: 'zs', label: '指数型' },
    ],
    sortTypes: config.SORT_TYPES,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadRankData();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadRankData(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载排行数据
   */
  async loadRankData(refresh = false) {
    this.setData({ loading: true });

    try {
      // 清除缓存以获取最新数据
      if (refresh) {
        const cacheKey = `rank_${this.data.fundType}_${this.data.sortType}_1_50`;
        storage.removeCache(cacheKey);
      }

      const funds = await fundService.getFundRank(
        this.data.fundType,
        this.data.sortType,
        1,
        50
      );

      // 检查是否已自选
      const favorites = storage.getFavorites();
      const fundsWithFavorite = funds.map(item => ({
        ...item,
        isFavorite: favorites.includes(item.code),
      }));

      this.setData({
        fundList: fundsWithFavorite,
        loading: false,
      });
    } catch (err) {
      console.error('加载排行数据失败', err);
      util.showToast('加载失败，请稍后重试');
      this.setData({ loading: false });
    }
  },

  /**
   * 切换基金类型
   */
  onFundTypeChange(e) {
    const fundType = e.detail.value;
    this.setData({ fundType });
    this.loadRankData();
  },

  /**
   * 切换排序类型
   */
  onSortTypeChange(e) {
    const sortType = e.detail.value;
    this.setData({ sortType });
    this.loadRankData();
  },

  /**
   * 点击基金项
   */
  onFundTap(item) {
    wx.navigateTo({
      url: `/pages/detail/detail?code=${item.code}`,
    });
  },

  /**
   * 添加/取消自选
   */
  onToggleFavorite(item) {
    const { code, isFavorite } = item;

    if (isFavorite) {
      storage.removeFavorite(code);
      util.showToast('已取消自选');
    } else {
      storage.addFavorite(code);
      util.showToast('已添加到自选');
    }

    // 更新列表状态
    const fundList = this.data.fundList.map(fund => {
      if (fund.code === code) {
        return { ...fund, isFavorite: !isFavorite };
      }
      return fund;
    });

    this.setData({ fundList });
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
    return util.getChangeClass(parseFloat(value));
  },
});
