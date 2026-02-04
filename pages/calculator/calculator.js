// pages/calculator/calculator.js
/**
 * 持仓计算器页
 */

const fundService = require('../../services/fund.js');
const storage = require('../../services/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    fundCode: '', // 基金代码
    fundInfo: null, // 基金信息
    shares: '', // 持有份额
    cost: '', // 成本价
    marketValue: 0, // 当前市值
    profit: 0, // 收益金额
    profitRate: 0, // 收益率
    currentNav: 0, // 当前净值
    loading: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { code } = options;
    if (code) {
      this.setData({ fundCode: code });
      this.loadFundInfo(code);
      this.loadPosition(code);
    }
  },

  /**
   * 加载基金信息
   */
  async loadFundInfo(code) {
    try {
      const fundInfo = await fundService.getFundDetail(code);
      const currentNav = parseFloat(fundInfo.valuation || fundInfo.nav);
      
      this.setData({
        fundInfo,
        currentNav,
        loading: false,
      });

      // 如果已有持仓数据，重新计算
      if (this.data.shares && this.data.cost) {
        this.calculate();
      }
    } catch (err) {
      console.error('加载基金信息失败', err);
      util.showToast('加载失败，请稍后重试');
      this.setData({ loading: false });
    }
  },

  /**
   * 加载已保存的持仓
   */
  loadPosition(code) {
    const position = storage.getPosition(code);
    if (position) {
      this.setData({
        shares: String(position.shares),
        cost: String(position.cost),
      });
    }
  },

  /**
   * 输入持有份额
   */
  onSharesInput(e) {
    this.setData({ shares: e.detail.value });
    this.calculate();
  },

  /**
   * 输入成本价
   */
  onCostInput(e) {
    this.setData({ cost: e.detail.value });
    this.calculate();
  },

  /**
   * 计算收益
   */
  calculate() {
    const { shares, cost, currentNav } = this.data;
    
    if (!shares || !cost || !currentNav) {
      this.setData({
        marketValue: 0,
        profit: 0,
        profitRate: 0,
      });
      return;
    }

    const sharesNum = parseFloat(shares);
    const costNum = parseFloat(cost);

    if (isNaN(sharesNum) || isNaN(costNum) || sharesNum <= 0 || costNum <= 0) {
      return;
    }

    const result = fundService.calculateProfit(sharesNum, costNum, currentNav);
    
    this.setData({
      marketValue: result.marketValue,
      profit: result.profit,
      profitRate: result.profitRate,
    });
  },

  /**
   * 保存持仓
   */
  async onSave() {
    const { fundCode, shares, cost } = this.data;

    if (!shares || !cost) {
      util.showToast('请输入完整信息');
      return;
    }

    const sharesNum = parseFloat(shares);
    const costNum = parseFloat(cost);

    if (isNaN(sharesNum) || isNaN(costNum) || sharesNum <= 0 || costNum <= 0) {
      util.showToast('请输入有效数字');
      return;
    }

    const success = storage.setPosition(fundCode, {
      shares: sharesNum,
      cost: costNum,
      updateTime: Date.now(),
    });

    if (success) {
      util.showToast('保存成功');
      
      // 添加到自选
      if (!storage.isFavorite(fundCode)) {
        storage.addFavorite(fundCode);
      }

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } else {
      util.showToast('保存失败');
    }
  },

  /**
   * 清空
   */
  onClear() {
    this.setData({
      shares: '',
      cost: '',
      marketValue: 0,
      profit: 0,
      profitRate: 0,
    });
  },

  /**
   * 删除持仓
   */
  async onDelete() {
    const confirm = await util.showModal('确定要删除持仓记录吗？');
    if (confirm) {
      storage.removePosition(this.data.fundCode);
      util.showToast('已删除');
      this.onClear();
    }
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
