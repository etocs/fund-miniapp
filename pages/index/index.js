// pages/index/index.js
/**
 * 首页 - 自选基金列表
 */

const fundService = require('../../services/fund.js');
const storage = require('../../services/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    funds: [], // 基金列表
    loading: false, // 加载状态
    refreshing: false, // 刷新状态
    updateTime: '', // 更新时间
    isEmpty: false, // 是否为空
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadFunds();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.funds.length > 0) {
      this.loadFunds();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadFunds(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载基金列表
   */
  async loadFunds(refresh = false) {
    const favorites = storage.getFavorites();

    if (favorites.length === 0) {
      this.setData({
        isEmpty: true,
        funds: [],
        loading: false,
      });
      return;
    }

    this.setData({
      loading: !refresh,
      refreshing: refresh,
      isEmpty: false,
    });

    try {
      // 批量获取基金数据，刷新时不使用缓存
      // getFavorites 返回的可能是对象数组（包含shares和cost）或字符串数组
      const funds = await fundService.getBatchFundValuation(favorites, !refresh);
      
      this.setData({
        funds,
        loading: false,
        refreshing: false,
        updateTime: util.formatDate(new Date(), 'HH:mm:ss'),
      });
    } catch (err) {
      console.error('加载基金数据失败', err);
      util.showToast('加载失败，请稍后重试');
      this.setData({
        loading: false,
        refreshing: false,
      });
    }
  },

  /**
   * 点击基金项
   */
  onFundTap(e) {
    const fund = e.detail?.fund || e.currentTarget?.dataset?.fund;
    const fundcode = fund?.fundcode || fund?.code;
    
    if (!fundcode) {
      console.error('基金代码为空', e);
      wx.showToast({
        title: '基金数据错误',
        icon: 'none'
      });
      return;
    }

    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?code=${fundcode}`,
    });
  },

  /**
   * 删除自选基金
   */
  async onDeleteFund(e) {
    const fundcode = e.currentTarget.dataset.fundcode;
    const fund = e.currentTarget.dataset.fund;
    
    if (!fundcode) {
      console.error('基金代码为空', e);
      return;
    }
    
    const confirm = await util.showModal(
      `确定要删除 ${fund?.name || fundcode} 吗？`,
      '删除自选'
    );

    if (confirm) {
      storage.removeFavorite(fundcode);
      this.loadFunds();
      util.showToast('删除成功');
    }
  },

  /**
   * 跳转到搜索页
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search',
    });
  },

  /**
   * 跳转到排行榜
   */
  goToRank() {
    wx.navigateTo({
      url: '/pages/rank/rank',
    });
  },

  /**
   * 手动刷新
   */
  onRefresh() {
    this.loadFunds(true);
  },
});
