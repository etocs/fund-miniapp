// app.js
App({
  onLaunch() {
    // 小程序启动时执行
    console.log('基金估值小程序启动');
    
    // 检查本地存储
    this.checkStorage();
  },

  onShow() {
    // 小程序显示时执行
  },

  onHide() {
    // 小程序隐藏时执行
  },

  /**
   * 检查本地存储
   */
  checkStorage() {
    try {
      // 初始化自选基金列表
      const favorites = wx.getStorageSync('favorites');
      if (!favorites) {
        wx.setStorageSync('favorites', []);
      }

      // 初始化搜索历史
      const searchHistory = wx.getStorageSync('searchHistory');
      if (!searchHistory) {
        wx.setStorageSync('searchHistory', []);
      }

      // 初始化持仓记录
      const positions = wx.getStorageSync('positions');
      if (!positions) {
        wx.setStorageSync('positions', {});
      }
    } catch (e) {
      console.error('存储初始化失败', e);
    }
  },

  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,
    lastUpdateTime: null
  }
});
