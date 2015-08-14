import NedbDatastore from 'nedb'

function wrapCursor(c) {
	c.__origExec = c.exec
	c.exec = () => new Promise((yes, no) => {
		c.__origExec(function(err, ...rest) {
			return (err) ? no(makeError(err)) : yes(...rest)
		})
	})

	return c
}

function makeError(msg) {
	return new Error(msg)
}

export default class Datastore {
	constructor(opts) {
		this.dataStore = new NedbDatastore(opts)
	}

	loadDatabase() {
		return new Promise((yes, no) =>
			this.dataStore.loadDatabase(err => (err) ? no(makeError(err)) : yes()))
	}

	insert(docs) {
		return new Promise((yes, no) =>
			this.dataStore.insert(
				docs,
				(err, newDocs) => (err) ? no(makeError(err)) : yes(newDocs)))
	}

	find(spec, opt = undefined) {
		let makeCursor = false
		if (opt === true) {
			makeCursor = true
			opt = undefined
		}

		if (makeCursor)
			return wrapCursor(this.dataStore.find(spec, opt))
		else
			return new Promise((yes, no) =>
				this.dataStore.find(spec, opt, (err, docs) => (err) ? no(makeError(err)) : yes(docs)))
	}

	findOne(spec, opt = undefined) {
		let makeCursor = false
		if (opt === true) {
			makeCursor = true
			opt = undefined
		}

		if (makeCursor)
			return wrapCursor(this.dataStore.findOne(spec))
		else
			return new Promise((yes, no) =>
				this.dataStore.findOne(spec, (err, doc) => (err) ? no(makeError(err)) : yes(doc)))
	}

	count(spec) {
		return new Promise((yes, no) =>
			this.dataStore.count(spec, (err, count) => (err) ? no(makeError(err)) : yes(count)))
	}

	//
	// @returns { numReplaced, newDoc }
	//
	update(query, update, options = {}) {
		return new Promise((yes, no) =>
			this.dataStore.update(
				query, update, options,
				(err, numReplaced, newDoc) => (err) ? no(makeError(err)) : yes({ numReplaced, newDoc })))
	}

	remove(query, options = {}) {
		return new Promise((yes, no) =>
			this.dataStore.remove(
				query, options,
				(err, numRemoved) => (err) ? no(makeError(err)) : yes(numRemoved)))
	}

	ensureIndex(spec) {
		return new Promise((yes, no) =>
			this.dataStore.ensureIndex(spec, err => (err) ? no(makeError(err)) : yes()))
	}

	removeIndex(fieldName) {
		return new Promise((yes, no) =>
			this.dataStore.removeIndex(fieldName, err => (err) ? no(makeError(err)) : yes()))
	}

	compactDataFile() {
		this.dataStore.persistence.compactDataFile()
	}

	setAutoCompactionInterval(interval) {
		this.dataStore.persistence.setAutoCompactionInterval(interval)
	}

	stopAutoCompaction() {
		this.dataStore.persistence.stopAutoCompaction()
	}
}

export { Datastore }
