// components/fund-item/fund-item.js
/**
 * 基金列表项组件
 */

const util = require('../../utils/util.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 基金数据
    fund: {
      type: Object,
      value: {},
    },
    // 是否显示添加按钮
    showAddButton: {
      type: Boolean,
      value: false,
    },
    // 是否已自选
    isFavorite: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    changeClass: '',
    changeColor: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击事件
     */
    onTap() {
      this.triggerEvent('tap', {
        fund: this.properties.fund,
      });
    },

    /**
     * 添加/取消自选
     */
    onToggleFavorite() {
      this.triggerEvent('toggle', {
        fund: this.properties.fund,
        isFavorite: this.properties.isFavorite,
      });
    },

    /**
     * 格式化涨跌幅
     */
    formatGrowth(value) {
      return util.formatPercent(value, 2, true);
    },

    /**
     * 格式化净值
     */
    formatNav(value) {
      return util.formatNumber(value, 4);
    },

    /**
     * 获取涨跌类名
     */
    getChangeClass(value) {
      return util.getChangeClass(value);
    },
  },

  /**
   * 生命周期函数 - 组件实例进入页面节点树时执行
   */
  attached() {
    // 设置涨跌颜色
    const growth = parseFloat(this.properties.fund.gszzl || this.properties.fund.dayGrowth || 0);
    this.setData({
      changeClass: util.getChangeClass(growth),
      changeColor: util.getChangeColor(growth),
    });
  },
});
