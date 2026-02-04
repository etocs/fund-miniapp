// pages/search/search.js
/**
 * 搜索页
 */

const fundService = require('../../services/fund.js');
const storage = require('../../services/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    keyword: '', // 搜索关键词
    searchResults: [], // 搜索结果
    searchHistory: [], // 搜索历史
    loading: false, // 加载状态
    showResults: false, // 是否显示搜索结果
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadSearchHistory();
    this.searchDebounced = util.debounce(this.performSearch.bind(this), 500);
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    const history = storage.getSearchHistory();
    this.setData({
      searchHistory: history,
    });
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    if (keyword.trim()) {
      this.searchDebounced(keyword);
    } else {
      this.setData({
        searchResults: [],
        showResults: false,
      });
    }
  },

  /**
   * 执行搜索
   */
  async performSearch(keyword) {
    if (!keyword || !keyword.trim()) {
      return;
    }

    this.setData({ loading: true });

    try {
      const results = await fundService.searchFund(keyword);
      
      // 检查是否已自选
      const resultsWithFavorite = results.map(item => {
        const itemCode = item.fundcode || item.code;
        return {
          ...item,
          isFavorite: storage.isFavorite(itemCode),
        };
      });

      this.setData({
        searchResults: resultsWithFavorite,
        showResults: true,
        loading: false,
      });
    } catch (err) {
      console.error('搜索失败', err);
      util.showToast('搜索失败，请稍后重试');
      this.setData({ loading: false });
    }
  },

  /**
   * 点击搜索历史
   */
  onHistoryTap(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword });
    this.performSearch(keyword);
  },

  /**
   * 清空搜索历史
   */
  async onClearHistory() {
    const confirm = await util.showModal('确定要清空搜索历史吗？');
    if (confirm) {
      storage.clearSearchHistory();
      this.setData({ searchHistory: [] });
      util.showToast('已清空');
    }
  },

  /**
   * 点击基金项
   */
  onFundTap(e) {
    // 兼容两种数据传递方式
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
    
    // 保存搜索历史
    if (this.data.keyword) {
      storage.addSearchHistory(this.data.keyword);
    }

    // 跳转到详情页，使用 fundcode
    wx.navigateTo({
      url: `/pages/detail/detail?code=${fundcode}`,
    });
  },

  /**
   * 添加/取消自选
   */
  onToggleFavorite(e) {
    const { fund, isFavorite } = e.detail;
    const fundcode = fund?.fundcode || fund?.code;

    if (!fundcode) {
      console.error('基金数据为空');
      return;
    }

    if (isFavorite) {
      storage.removeFavorite(fundcode);
      util.showToast('已取消自选');
    } else {
      // 传递对象给 addFavorite，包含基金代码和名称
      storage.addFavorite({
        fundcode: fundcode,
        name: fund.name,
      });
      util.showToast('已添加到自选');
    }

    // 更新列表状态
    const results = this.data.searchResults.map(item => {
      const itemCode = item.fundcode || item.code;
      if (itemCode === fundcode) {
        return { ...item, isFavorite: !isFavorite };
      }
      return item;
    });

    this.setData({ searchResults: results });
  },

  /**
   * 取消搜索
   */
  onCancel() {
    wx.navigateBack();
  },

  /**
   * 清空输入
   */
  onClear() {
    this.setData({
      keyword: '',
      searchResults: [],
      showResults: false,
    });
  },
});