// utils/util.js
/**
 * 工具函数
 */

/**
 * 格式化日期
 * @param {Date|String|Number} date 日期
 * @param {String} format 格式，默认 'YYYY-MM-DD'
 * @returns {String} 格式化后的日期
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  
  let d = date;
  if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
  }
  
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 格式化数字
 * @param {Number} num 数字
 * @param {Number} decimals 小数位数，默认2
 * @param {Boolean} showSign 是否显示符号
 * @returns {String} 格式化后的数字
 */
function formatNumber(num, decimals = 2, showSign = false) {
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }

  const n = Number(num);
  let result = n.toFixed(decimals);

  if (showSign && n > 0) {
    result = '+' + result;
  }

  return result;
}

/**
 * 格式化百分比
 * @param {Number} num 数字
 * @param {Number} decimals 小数位数，默认2
 * @param {Boolean} showSign 是否显示符号
 * @returns {String} 格式化后的百分比
 */
function formatPercent(num, decimals = 2, showSign = false) {
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }

  const n = Number(num);
  let result = n.toFixed(decimals) + '%';

  if (showSign && n > 0) {
    result = '+' + result;
  }

  return result;
}

/**
 * 格式化金额
 * @param {Number} num 金额
 * @param {Number} decimals 小数位数，默认2
 * @returns {String} 格式化后的金额
 */
function formatMoney(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }

  const n = Number(num);
  const parts = n.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * 格式化基金规模
 * @param {Number} num 规模（亿元）
 * @returns {String} 格式化后的规模
 */
function formatScale(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }

  const n = Number(num);
  if (n >= 100) {
    return formatNumber(n, 2) + '亿元';
  } else if (n >= 1) {
    return formatNumber(n, 2) + '亿元';
  } else {
    return formatNumber(n * 10000, 0) + '万元';
  }
}

/**
 * 获取涨跌颜色类名
 * @param {Number} value 涨跌值
 * @returns {String} 类名
 */
function getChangeClass(value) {
  if (value > 0) return 'text-up';
  if (value < 0) return 'text-down';
  return '';
}

/**
 * 获取涨跌颜色
 * @param {Number} value 涨跌值
 * @returns {String} 颜色值
 */
function getChangeColor(value) {
  if (value > 0) return '#EE4646';
  if (value < 0) return '#07C160';
  return '#333333';
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {Number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {Number} wait 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, wait = 300) {
  let timeout;
  let previous = 0;
  
  return function(...args) {
    const context = this;
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}

/**
 * 解析 JSONP 数据
 * @param {String} jsonpStr JSONP 字符串
 * @returns {Object} 解析后的对象
 */
function parseJSONP(jsonpStr) {
  try {
    const match = jsonpStr.match(/\((.*)\)/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    return null;
  } catch (e) {
    console.error('JSONP 解析失败', e);
    return null;
  }
}

/**
 * 显示加载提示
 * @param {String} title 提示文字
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true,
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示提示信息
 * @param {String} title 提示文字
 * @param {String} icon 图标类型
 */
function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000,
  });
}

/**
 * 显示模态对话框
 * @param {String} content 内容
 * @param {String} title 标题
 * @returns {Promise} 用户操作结果
 */
function showModal(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      },
    });
  });
}

module.exports = {
  formatDate,
  formatNumber,
  formatPercent,
  formatMoney,
  formatScale,
  getChangeClass,
  getChangeColor,
  debounce,
  throttle,
  parseJSONP,
  showLoading,
  hideLoading,
  showToast,
  showModal,
};
