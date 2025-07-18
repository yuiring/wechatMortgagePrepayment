// utils/util.js
const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const getMonthsDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const years = d2.getFullYear() - d1.getFullYear();
  const months = d2.getMonth() - d1.getMonth();
  // 如果结束日期的天数小于开始日期的天数，我们认为不足一个月
  if (d2.getDate() < d1.getDate()) {
    return years * 12 + months - 1;
  }
  return years * 12 + months;
}

// 【新增】补充小程序模板所需的 formatTime 函数
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

module.exports = {
  formatDate,
  getMonthsDifference,
  formatTime // <--- 新增导出
}