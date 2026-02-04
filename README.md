# 基金估值小程序

一个功能完整的微信小程序，用于基金实时估值、净值查询、持仓管理等功能。

![版本](https://img.shields.io/badge/version-1.0.0-blue)
![微信小程序](https://img.shields.io/badge/微信小程序-原生开发-green)
![许可证](https://img.shields.io/badge/license-MIT-orange)

## 项目简介

本项目是一款专为基金投资者打造的微信小程序，提供以下核心功能：

- 📊 **实时估值**：实时获取基金估值数据，及时掌握基金动态
- 🔍 **智能搜索**：支持基金代码和名称模糊搜索，快速找到目标基金
- 📈 **走势图表**：使用 ECharts 展示基金净值走势，直观了解历史表现
- 💰 **持仓计算**：计算持仓收益，清晰了解投资收益情况
- 🏆 **排行榜**：多维度基金排行，发现优质投资标的
- ⭐ **自选管理**：添加自选基金，快速查看关注的基金

## 功能特性

### 1. 首页（自选基金）

- 显示用户自选的基金列表
- 实时估值数据展示
- 涨跌幅、涨跌额显示（红涨绿跌）
- 下拉刷新数据
- 支持添加/删除自选基金
- 显示更新时间

### 2. 基金搜索

- 支持基金代码搜索（如：000001）
- 支持基金名称模糊搜索
- 搜索历史记录
- 搜索结果列表展示
- 快速添加到自选

### 3. 基金详情

#### 基本信息
- 基金名称、代码
- 基金类型、公司
- 基金经理、成立时间
- 资产规模

#### 净值信息
- 最新净值
- 实时估值
- 日涨跌幅
- 累计净值

#### 净值走势图
- 使用 ECharts 展示
- 支持切换时间范围（近1月、3月、6月、1年、全部）
- 双轴展示净值和涨跌幅

#### 操作功能
- 添加/取消自选
- 跳转持仓计算器

### 4. 持仓计算器

- 输入持有份额
- 输入成本价
- 自动计算当前市值
- 计算持仓收益（金额和百分比）
- 保存持仓记录

### 5. 基金排行榜

- 分类展示：股票型、混合型、债券型、指数型
- 排序选项：日涨跌幅、近1周、近1月、近3月、近1年
- 列表显示基金名称、代码、最新净值、涨跌幅
- 支持添加自选

## 技术栈

- **开发框架**：微信小程序原生开发
- **数据源**：天天基金网 API
- **图表库**：ECharts for WeChat
- **数据存储**：本地 Storage
- **代码规范**：ES6+

## 项目结构

```
fund-miniapp/
├── app.js                 # 小程序入口
├── app.json              # 全局配置
├── app.wxss              # 全局样式
├── project.config.json   # 项目配置
├── sitemap.json          # 索引配置
├── pages/                # 页面目录
│   ├── index/            # 首页（自选基金）
│   ├── search/           # 搜索页
│   ├── detail/           # 基金详情
│   ├── rank/             # 排行榜
│   └── calculator/       # 持仓计算器
├── components/           # 组件目录
│   ├── fund-item/        # 基金列表项组件
│   └── fund-chart/       # 图表组件
├── utils/                # 工具函数
│   ├── api.js            # API 接口封装
│   ├── util.js           # 工具函数
│   └── config.js         # 配置文件
├── services/             # 服务层
│   ├── fund.js           # 基金数据服务
│   └── storage.js        # 本地存储服务
└── ec-canvas/            # ECharts 组件
    ├── ec-canvas.js
    ├── ec-canvas.json
    ├── ec-canvas.wxml
    ├── ec-canvas.wxss
    └── echarts.js        # ECharts 库（需替换）
```

## 快速开始

### 环境要求

- 微信开发者工具 v1.05.0 或更高版本
- 微信基础库 v2.19.4 或更高版本

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/etocs/fund-miniapp.git
cd fund-miniapp
```

2. **替换 ECharts 文件**

由于 ECharts 文件较大（约 1MB），本项目提供的是占位文件。请按以下步骤替换：

```bash
# 方法一：从 GitHub 下载
# 访问 https://github.com/ecomfe/echarts-for-weixin
# 下载 ec-canvas/echarts.js 文件
# 替换 ec-canvas/echarts.js

# 方法二：使用 npm（如果项目支持）
npm install echarts-for-weixin
# 然后复制 node_modules/echarts-for-weixin/ec-canvas/echarts.js 到项目中
```

3. **配置开发者工具**

- 打开微信开发者工具
- 选择"导入项目"
- 选择项目目录
- 填写 AppID（可使用测试号）

4. **配置合法域名**

在微信公众平台配置以下请求域名（开发阶段可在开发者工具中关闭域名校验）：

```
http://fundgz.1234567.com.cn
http://fund.eastmoney.com
http://api.fund.eastmoney.com
http://fundsuggest.eastmoney.com
```

5. **运行项目**

点击"编译"按钮即可运行项目

## 使用说明

### 添加自选基金

1. 点击首页的"搜索"按钮
2. 输入基金代码或名称进行搜索
3. 点击搜索结果中的"☆"图标添加到自选
4. 返回首页即可看到自选基金列表

### 查看基金详情

1. 在首页或搜索页点击基金项
2. 进入详情页查看基金详细信息
3. 切换时间范围查看不同周期的走势图
4. 点击"持仓计算器"计算收益

### 使用持仓计算器

1. 在基金详情页点击"持仓计算器"
2. 输入持有份额和成本价
3. 系统自动计算当前市值和收益
4. 点击"保存"保存持仓记录

### 查看排行榜

1. 点击首页的"排行"按钮
2. 选择基金类型和排序方式
3. 查看对应的基金排行榜
4. 点击"☆"添加感兴趣的基金到自选

## 数据接口说明

### 天天基金网接口

1. **基金实时估值**
   ```
   GET http://fundgz.1234567.com.cn/js/{fundcode}.js
   ```

2. **基金搜索**
   ```
   GET http://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key={keyword}
   ```

3. **历史净值**
   ```
   GET http://api.fund.eastmoney.com/f10/lsjz?fundCode={fundcode}&pageIndex=1&pageSize=20
   ```

4. **基金排行**
   ```
   GET http://fund.eastmoney.com/data/rankhandler.aspx?op=ph&dt=kf&ft=all&sc=zzf&st=desc&pi=1&pn=50
   ```

### 缓存策略

- **实时估值**：缓存 5 分钟
- **详情数据**：缓存 1 小时
- **排行榜**：缓存 30 分钟

## 配置说明

### 颜色配置（utils/config.js）

```javascript
COLORS: {
  PRIMARY: '#1989FA',    // 主色调（蓝色）
  UP: '#EE4646',        // 上涨颜色（红色）
  DOWN: '#07C160',      // 下跌颜色（绿色）
  BG: '#F5F5F5',        // 背景色
  CARD_BG: '#FFFFFF',   // 卡片背景
}
```

### 缓存时间配置

```javascript
CACHE_TIME: {
  VALUATION: 5 * 60 * 1000,     // 实时估值：5分钟
  DETAIL: 60 * 60 * 1000,       // 详情数据：1小时
  RANK: 30 * 60 * 1000,         // 排行榜：30分钟
}
```

## 开发规范

### 代码规范

- 使用 ES6+ 语法
- 统一使用 2 空格缩进
- 变量和函数使用驼峰命名
- 常量使用大写下划线命名
- 添加必要的代码注释

### 提交规范

```
feat: 新增功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

## 注意事项

1. **数据来源**：所有数据来源于公开接口，仅供学习参考使用
2. **免责声明**：本项目不提供投资建议，投资有风险，入市需谨慎
3. **域名配置**：正式发布需在微信公众平台配置合法请求域名
4. **ECharts 文件**：需要从官方渠道下载完整的 ECharts 文件
5. **网络请求**：所有接口调用需遵守数据源的使用条款

## 常见问题

### 1. 图表不显示？

确保已正确替换 `ec-canvas/echarts.js` 文件为完整的 ECharts 库。

### 2. 接口请求失败？

- 检查网络连接
- 确认已配置合法域名或关闭域名校验
- 查看控制台错误信息

### 3. 数据不更新？

- 下拉刷新页面
- 清除缓存后重试
- 检查数据源接口是否可用

### 4. 如何修改配色方案？

在 `utils/config.js` 中修改 `COLORS` 配置，在 `app.wxss` 中修改全局样式类。

## 后续计划

- [ ] 添加基金对比功能
- [ ] 添加定投计算器
- [ ] 支持更多数据源
- [ ] 增加数据可视化分析
- [ ] 添加消息推送功能
- [ ] 优化性能和用户体验

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 免责声明

本项目仅供学习交流使用，所有数据来源于公开接口。项目不提供任何投资建议，不对使用本项目造成的任何损失负责。投资有风险，入市需谨慎！

## 联系方式

- 项目地址：https://github.com/etocs/fund-miniapp
- 问题反馈：https://github.com/etocs/fund-miniapp/issues

## 致谢

- 感谢天天基金网提供的数据接口
- 感谢 ECharts 团队提供的图表库
- 感谢所有贡献者的支持

---

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**
