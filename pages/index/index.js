// pages/index/index.js
const calculator = require('../../utils/calculator.js');
const util = require('../../utils/util.js');

Page({
  data: {
    termRange: Array.from({length: 26}, (v, k) => k + 5),
    termIndex: 25,
    rate: 3.95,
    today: '',
    startDate: '',
    prepaymentDate: '',
    farFutureDate: '2099-12-31'
  },

  onLoad: function () {
    const today = util.formatDate(new Date());
    const oneYearAgo = util.formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    this.setData({
      today: today,
      startDate: oneYearAgo,
      prepaymentDate: today
    });
  },

  bindTermChange: function(e) {
    this.setData({
      termIndex: e.detail.value
    });
  },
  bindRateInput: function(e) {
    this.setData({
      rate: e.detail.value
    });
  },

  bindDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  onCalculate(e) {
    const values = e.detail.value;
    if (!values.totalAmount || !values.rate || !values.prepaymentAmount) {
      wx.showToast({ title: '请填写所有必填项', icon: 'none' });
      return;
    }
    
    const monthsPaid = util.getMonthsDifference(this.data.startDate, this.data.prepaymentDate);
    if (monthsPaid < 0) {
      wx.showToast({ title: '计划还款时间不能早于首次还款时间', icon: 'none' });
      return;
    }

    // 【优化】增加加载提示
    wx.showLoading({
      title: '智能分析中...',
      mask: true
    });

    // 使用 setTimeout 确保加载提示有时间渲染
    setTimeout(() => {
      const params = {
        totalAmount: parseFloat(values.totalAmount) * 10000,
        loanTerm: this.data.termRange[this.data.termIndex] * 12,
        rate: parseFloat(values.rate) / 100 / 12,
        monthsPaid: monthsPaid,
        prepaymentAmount: parseFloat(values.prepaymentAmount) * 10000,
      };
      
      const results = calculator.analyze(params);

      wx.hideLoading(); // 【优化】计算完成，隐藏提示

      if (results.error) {
          wx.showToast({ title: results.error, icon: 'none', duration: 2000 });
          return;
      }

      getApp().globalData.analysisResults = results;
      wx.navigateTo({ url: `/pages/result/result` });
    }, 100);
  },
});