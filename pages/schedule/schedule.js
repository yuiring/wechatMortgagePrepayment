// pages/schedule/schedule.js
Page({
  data: {
    schedule: [],
    title: ''
  },
  onLoad: function (options) {
    // V2.0 重构: 从本地存储获取大数据
    const data = wx.getStorageSync('temp_schedule_data');
    if (data) {
      this.setData({
        schedule: data.schedule,
        title: data.title || '还款详情'
      });
      wx.setNavigationBarTitle({
        title: data.title || '还款详情'
      });
      // V2.0 优化: 数据用完后立即清除，避免占用存储空间
      wx.removeStorageSync('temp_schedule_data');
    } else {
      wx.showToast({ title: '加载还款详情失败', icon: 'none' });
    }
  }
});