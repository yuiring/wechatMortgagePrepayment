// pages/schedule/schedule.js
Page({
  data: {
    schedule: [],
    title: ''
  },
  onLoad: function (options) {
    const scheduleData = getApp().globalData.scheduleToShow;
    const scheduleTitle = getApp().globalData.scheduleTitle;
    if (scheduleData) {
      this.setData({
        schedule: scheduleData,
        title: scheduleTitle || '还款详情'
      });
      wx.setNavigationBarTitle({
        title: scheduleTitle || '还款详情'
      })
    }
  }
});