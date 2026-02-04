// ec-canvas/ec-canvas.js
/**
 * ECharts Canvas 组件
 * 注意：完整的 echarts.js 文件需要从 echarts-for-weixin 项目下载
 * https://github.com/ecomfe/echarts-for-weixin
 */

let echarts;

// 尝试加载 ECharts
try {
  echarts = require('./echarts.js');
} catch (e) {
  console.warn('ECharts 未加载，图表功能不可用');
}

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas',
    },
    ec: {
      type: Object,
    },
    forceUseOldCanvas: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    isUseNewCanvas: false,
  },

  ready() {
    if (!echarts) {
      console.error('ECharts 未正确加载');
      return;
    }

    // 判断是否使用新版 Canvas
    if (!this.data.forceUseOldCanvas && wx.canvasGetImageData) {
      this.setData({ isUseNewCanvas: true });
    }

    // 延迟初始化
    setTimeout(() => {
      this.init();
    }, 100);
  },

  methods: {
    init() {
      const query = wx.createSelectorQuery().in(this);
      query
        .select('.ec-canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res || !res[0]) {
            console.error('Canvas 节点未找到');
            return;
          }

          const { node, width, height } = res[0];

          if (this.data.isUseNewCanvas && node) {
            this.initChart(node, width, height);
          } else {
            this.initChartOld(width, height);
          }
        });
    },

    initChart(canvas, width, height) {
      if (!echarts) return;

      const dpr = wx.getWindowInfo().pixelRatio;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr,
      });

      canvas.setChart = chart;

      if (this.properties.ec && typeof this.properties.ec.onInit === 'function') {
        this.properties.ec.onInit(chart, width, height, canvas);
      }
    },

    initChartOld(width, height) {
      if (!echarts) return;

      const ctx = wx.createCanvasContext(this.properties.canvasId, this);
      const chart = echarts.init(ctx, null, {
        width: width,
        height: height,
      });

      ctx.setChart = chart;

      if (this.properties.ec && typeof this.properties.ec.onInit === 'function') {
        this.properties.ec.onInit(chart, width, height, ctx);
      }
    },

    touchStart(e) {
      if (this.chart && this.chart._zr) {
        this.chart._zr.handler.dispatch('mousedown', e);
        this.chart._zr.handler.dispatch('mousemove', e);
        this.chart._zr.handler.processGesture(e, 'start');
      }
    },

    touchMove(e) {
      if (this.chart && this.chart._zr) {
        this.chart._zr.handler.dispatch('mousemove', e);
        this.chart._zr.handler.processGesture(e, 'change');
      }
    },

    touchEnd(e) {
      if (this.chart && this.chart._zr) {
        this.chart._zr.handler.dispatch('mouseup', e);
        this.chart._zr.handler.dispatch('click', e);
        this.chart._zr.handler.processGesture(e, 'end');
      }
    },
  },
});
