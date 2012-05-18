var mongoose = require('mongoose')
  , crypto = require('crypto');

// 스키마 정의
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
  *  Model: 사용할 Document 문서모델 정의
  */
Document = new Schema({
  'title' : { type: String, index: true },
  'data' : String,
  'tags' : [String],    
  'user_id' : ObjectId
});

/**
  *  Model: 사용할 User 문서모델 정의
  */
User = new Schema({
  'email': { type: String, index: {unique:true} },
  'hashed_password' : { type: String },
  'salt' : { type: String }
});

// Getters
User.virtual('id').get(function() {
  return this._id.toHexString();
});

// Getters/Setters
User.virtual('password').set(function(password) {
  this._password = password;
  this.salt = this.makeSalt();
  this.hashed_password = this.encryptPassword(password)
}).get(function() {
  return this._password;
});

User.methods.authenticate = function (plainText) {
  return this.encryptPassword(plainText) === this.hashed_password;
};

User.methods.makeSalt = function makeSalt() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
};

User.methods.encryptPassword = function encryptPassword(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

// 'Document'라는 이름에 기정의한 문서모델 할당
mongoose.model('Document', Document);

// 'User'라는 이름에 기정의한 문서모델 할당
mongoose.model('User', User);

module.exports.Document = function(db) {
  return db.model('Document')
};

module.exports.User = function(db) {
  return db.model('User');
};
