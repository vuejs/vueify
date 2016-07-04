var crypto = require('crypto')

var Cache = function() {
	this.cache = {}
}

Cache.prototype.check = function(key, source) {
	var cache = this.cache[key],
		checksum = hash(source)

	if(cache && cache.checksum === checksum) {
		return false
	}
	
	return checksum
}

Cache.prototype.get = function(key) {
	return this.cache[key]
}

Cache.prototype.set = function(key, checksum, data) {
	return this.cache[key] = {
		checksum: checksum,
		data: data
	}
}

function hash(str) {
	var hash = crypto.createHash('md5')
	hash.update(str)
	return hash.digest('hex')
}

module.exports = new Cache()