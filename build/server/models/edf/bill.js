// Generated by CoffeeScript 1.10.0
var EDFBill, cozydb;

cozydb = require('cozydb');

module.exports = EDFBill = cozydb.getModel('Bill', {
  type: String,
  subtype: String,
  date: Date,
  vendor: String,
  amount: Number,
  plan: String,
  pdfurl: String,
  binaryId: String,
  fileId: String,
  content: String,
  isRefund: Boolean,
  clientId: String,
  number: String,
  docTypeVersion: String
});

EDFBill.all = function(callback) {
  return EDFBill.request('byDate', callback);
};
