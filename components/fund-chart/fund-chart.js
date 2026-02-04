// components/fund-chart/fund-chart.js
/**
 * 基金图表组件
 */

const util = require('../../utils/util.js');

Component({
  properties: {
    // 图表数据
    chartData: {
      type: Array,
      value: [],
    },
    // 图表高度
    height: {
      type: String,
      value: '300px',
    },
  },

  data: {
    ec: {
      onInit: null,
    },
  },

  lifetimes: {
    attached() {
      this.initChart();
    },
  },

  methods: {
    /**
     * 初始化图表
     */
    initChart() {
      this.setData({
        ec: {
          onInit: (chart, width, height) => {
            this.chart = chart;
            this.updateChart();
          },
        },
      });
    },

    /**
     * 更新图表
     */
    updateChart() {
      if (!this.chart || !this.properties.chartData || this.properties.chartData.length === 0) {
        return;
      }

      const data = this.properties.chartData;
      const dates = data.map(item => item.date || item.FSRQ);
      const navs = data.map(item => parseFloat(item.nav || item.DWJZ || 0));
      const growths = data.map(item => parseFloat(item.growth || item.JZZZL || 0));

      const option = {
        backgroundColor: '#ffffff',
        color: ['#1989FA', '#EE4646'],
        grid: {
          left: 50,
          right: 50,
          top: 40,
          bottom: 30,
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            fontSize: 10,
            rotate: 45,
          },
          boundaryGap: false,
        },
        yAxis: [
          {
            type: 'value',
            name: '净值',
            position: 'left',
            axisLabel: {
              fontSize: 10,
            },
          },
          {
            type: 'value',
            name: '涨跌幅(%)',
            position: 'right',
            axisLabel: {
              fontSize: 10,
            },
          },
        ],
        series: [
          {
            name: '净值',
            type: 'line',
            data: navs,
            smooth: true,
            yAxisIndex: 0,
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              opacity: 0.1,
            },
          },
          {
            name: '涨跌幅',
            type: 'bar',
            data: growths,
            yAxisIndex: 1,
            itemStyle: {
              color: (params) => {
                return params.value >= 0 ? '#EE4646' : '#07C160';
              },
            },
          },
        ],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        },
        legend: {
          data: ['净值', '涨跌幅'],
          top: 5,
          textStyle: {
            fontSize: 10,
          },
        },
      };

      this.chart.setOption(option);
    },
  },

  observers: {
    'chartData': function(newVal) {
      if (this.chart && newVal && newVal.length > 0) {
        this.updateChart();
      }
    },
  },
});
