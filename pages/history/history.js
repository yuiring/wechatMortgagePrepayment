// pages/history/history.js
const util = require('../../utils/util.js');

Page({
  data: {
    historyList: []
  },
  onShow: function () {
    // 使用 onShow，每次进入该Tab页面都会刷新
    const history = wx.getStorageSync('calculation_history') || [];
    this.setData({ historyList: history });
  },
  // 点击某条历史记录
  useThisRecord: function(e) {
    const record = e.currentTarget.dataset.record;
    // 使用全局变量传递数据，因为 switchTab 不支持参数
    getApp().globalData.tabBarRedirectionData = record;
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
  // 查看结果
  viewResult: function(e) {
    const results = e.currentTarget.dataset.results;
    const resultsStr = encodeURIComponent(JSON.stringify(results));
    wx.navigateTo({
      url: `/pages/result/result?results=${resultsStr}`
    });
  }
});