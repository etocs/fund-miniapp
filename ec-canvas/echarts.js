// ec-canvas/echarts.js
/**
 * ECharts 占位文件
 * 请从 https://github.com/ecomfe/echarts-for-weixin 下载完整的 echarts.js 文件替换
 */

console.warn('ECharts 库未加载，图表功能不可用。请下载完整的 echarts.js 文件。');

// 提供一个空的 init 函数避免报错
function init() {
  console.warn('请替换为完整的 ECharts 库文件');
  return {
    setOption: function() {},
    resize: function() {},
    dispose: function() {},
    on: function() {},
    off: function() {},
  };
}

module.exports = {
  init: init
};
