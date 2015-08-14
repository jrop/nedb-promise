import assert from 'assert'
import Datastore from '../index'
import path from 'path'
import _ from 'lodash'

function makeDB(opts) {
	let filename = path.resolve(path.join(__dirname, 'test-db.json'))
	// console.log(filename)
	opts = _.extend({ filename }, opts || { })
	return new Datastore(opts)
}

describe('Datastore', () => {
	before(async (done) => {
		// console.log('<<<before')
		
		let DB = makeDB({ autoload: true })
		await DB.remove({}, { multi: true })
		
		await DB.insert([{
			num: 1,
			alpha: 'a'
		}, {
			num: 2,
			alpha: 'b'
		}, {
			num: 3,
			alpha: 'c'
		}])

		done()
	})

	describe('#find()', () => {
		it('should return them all', async (done) => {
			let DB = makeDB({ autoload: true })
			assert.equal((await DB.find({})).length, 3)
			done()
		})

		it('should only return 1', async (done) => {
			let DB = makeDB({ autoload: true })
			assert.equal((await DB.find({ num: 3 })).length, 1)
			done()
		})

		it ('should project', async (done) => {
			let DB = makeDB({ autoload: true })
			let doc = await DB.find({ num: 3 }, true)
				.projection({ num: 1, _id: 0 })
				.exec()

			doc = doc[0]
			assert.equal(doc.num, 3)
			assert.equal(doc.alpha, undefined)

			done()
		})

		it('should sort', async (done) => {
			let DB = makeDB({ autoload: true })

			let docs = await DB.find({}, true)
				.sort({ num: -1 })
				.exec()

			docs = _.chain(docs)
				.map(d => d.num)
				.value()

			let assertion = docs[0] == 3 && docs[1] == 2 && docs[2] == 1
			assert(assertion)

			done()
		})
	})

	describe('#findOne()', () => {
		it('should only return one', async (done) => {
			let DB = makeDB({ autoload: true })
			let doc = await DB.findOne({ num: 2 })
			assert.equal(doc.num, 2)

			done()
		})

		it('should project', async(done) => {
			let DB = makeDB({ autoload: true })
			let doc = await DB.findOne({ num: 2 }, true)
				.projection({ num: 1, _id: false })
				.exec()

			assert.equal(doc.num, 2)
			assert.equal(doc.alpha, undefined)

			done()
		})
	})

	describe('#count()', () => {
		it('should return the number of documents in the database', async (done) => {
			let DB = makeDB({ autoload: true })
			let count = await DB.count({})

			assert.equal(count, 3)

			done()
		})
	})

	describe('#insert()', () => {
		it('should insert two documents', async (done) => {
			let DB = makeDB({ autoload: true })
			
			let beforeCount = await DB.count({})
			let docs = await DB.insert([{
				num: 4,
				alpha: 'd'
			}, {
				num: 5,
				alpha: 'e'
			}])
			let afterCount = await DB.count({})

			assert.equal(afterCount - beforeCount, 2)

			done()
		})
	})

	describe('#update()', () => {
		it('should update a document', async (done) => {
			let DB = makeDB({ autoload: true })
			await DB.update({ num: 5 }, { $set: { updated: true } })
			let updated = await DB.findOne({ num: 5 })
			assert(updated.updated)

			done()
		})

		it('should insert a new document', async(done) => {
			let DB = makeDB({ autoload: true })
			
			let beforeCount = await DB.count({})
			await DB.update({ num: 6 }, {
				num: 6,
				alpha: 'f'
			}, { upsert: true })
			let afterCount = await DB.count({})

			assert.equal(afterCount - beforeCount, 1)

			done()
		})
	})

	describe('#remove()', () => {
		it('should remove a document', async (done) => {
			let DB = makeDB({ autoload: true })
			let beforeCount = await DB.count({})
			await DB.remove({})
			let afterCount = await DB.count({})

			assert.equal(beforeCount - afterCount, 1)

			done()
		})

		it('should remove all documents', async (done) => {
			let DB = makeDB({ autoload: true })
			await DB.remove({}, { multi: true })
			let afterCount = await DB.count({})

			assert.equal(afterCount, 0)

			done()
		})
	})
})
