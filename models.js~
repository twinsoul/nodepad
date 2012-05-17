var mongoose = require('mongoose');

// 스키마 정의
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
  *  Model: 사용할 문서모델 정의
  */
Document = new Schema({
  'title': { type: String, index: true },
  'data': String,
  'tags': [String],
  'user_id' : ObjectId
});

// 'Document'라는 이름에 기정의한 문서모델 할당
mongoose.model('Document', Document);

module.exports.Document = function(db) {
  return db.model('Document')
};
