
import publish from '../src/libs/publish'
import GitHub from '../src/libs/github'
import parse from '../src/libs/parse'

describe('publish', () => {
	const likedURL = 'https://domain.tld'

	const form = {
		'h': 'entry',
		'content': 'Content goes here\r\nAnd thats all',
		'name': 'Title',
		'category': [ 'one', 'two', 'three' ],
		'mp-slug': 'this-is-a-slug',
		'like-of': likedURL,
		'bookmark-of': likedURL,
		'in-reply-to': likedURL,
		'rsvp': 'maybe'
	}

	beforeEach(() => {
		console.log = jest.fn()
		console.error = jest.fn()
	})

	describe('addContent: SUCCESS', () => {
		let entry
		beforeEach(() => {
			const getFile = jest.spyOn(GitHub, 'getFile')
			getFile.mockReturnValue(false)
			const createFile = jest.spyOn(GitHub, 'createFile')
			createFile.mockReturnValue(true)
			entry = {
				'h': form['h']
			}
		})

		test('add note', async () => {
			entry['content'] = form['content']
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('notes/')
		})

		test('add article', async () => {
			entry['name'] = 'Title'
			entry['content'] = form['content']
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('articles/')
		})

		test('add like', async () => {
			const getPageTitle = jest.spyOn(parse, 'getPageTitle')
			getPageTitle.mockReturnValue('PAGE TITLE')

			entry['like-of'] = likedURL
			const res = await publish.addContent(entry)
			expect(getPageTitle.mock.calls.length).toBe(1)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('likes/')
		})

		test('add bookmark', async () => {
			entry['name'] = 'Title'
			entry['bookmark-of'] = likedURL
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('bookmarks/')
		})

		test('add reply', async () => {
			entry['in-reply-to'] = 'Title'
			entry['content'] = form['content']
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('notes/')
		})

		test('add RSVP', async () => {
			entry['in-reply-to'] = 'Title'
			entry['rsvp'] = 'yes'
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('rsvp/')
		})

		test('add watched note', async () => {
			entry['u-watch-of'] = likedURL
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('watched/')
		})
	})

	describe('addContent: FAIL', () => {
		test('only if no properties sent', async () => {
			const res = await publish.addContent({})
			expect(res).toHaveProperty('error', 'nothing to add')
		})
	})

	describe('handleUpdate', () => {
		let parsed

		beforeEach(() => {
			parsed = {
				'type': 'h-entry',
				'content': 'this is some content',
				'name': 'title',
				'category': [ 'one', 'two', '3' ],
				'date': '2021-09-09T12:23:34.120Z'
			}
		})

		test('invalid body', () => {
			expect(publish.handleUpdate({}, {})).toBeFalsy()
		})

		// https://micropub.spec.indieweb.org/#replace
		test('replace content', () => {
			let updated = publish.handleUpdate({
				'replace': {
					'content': ['hello moon']
				}
			}, parsed)
			expect(updated).toHaveProperty('content')
			expect(updated.content).not.toBe(parsed.content)
		})

		test('replace content - add if property not found', () => {
			let updated = publish.handleUpdate({
				'replace': {
					'deleted': [ 'true' ]
				}
			}, parsed)
			expect(updated).toHaveProperty('deleted', 'true')
		})

		// https://micropub.spec.indieweb.org/#remove
		test('delete property', () => {
			let updated = publish.handleUpdate({
				'delete': ['content']
			}, parsed)
			expect(updated).not.toHaveProperty('content')
		})

		test('delete property - no property found', () => {
			let updated = publish.handleUpdate({
				'delete': ['like-of']
			}, parsed)
			expect(updated).toBeFalsy()
		})

		test('delete two items of category', () => {
			let updated = publish.handleUpdate({
				'delete': {
					'category': [ 'two', '3' ]
				}
			}, parsed)
			expect(updated).toHaveProperty('category')
			expect(updated.category).toHaveLength(1)
		})

		test('delete two items of category - items not in category', () => {
			let updated = publish.handleUpdate({
				'delete': {
					'category': [ 'three', 'four' ]
				}
			}, parsed)
			expect(updated).toBeFalsy()
		})

		test('delete only items found in category', () => {
			let updated = publish.handleUpdate({
				'delete': {
					'category': [ '3', 'four' ]
				}
			}, parsed)
			expect(updated).toHaveProperty('category')
			expect(updated.category).toHaveLength(2)
		})

		test('delete two items of property - property doesnt exist', () => {
			let updated = publish.handleUpdate({
				'delete': {
					'tagged': [ 'two', '3' ]
				}
			}, parsed)
			expect(updated).toBeFalsy()
		})

		// https://micropub.spec.indieweb.org/#add
		test('add property', () => {
			let updated = publish.handleUpdate({
				'add': {
					'like-of': [ likedURL ]
				}
			}, parsed)
			expect(updated).toHaveProperty('like-of', likedURL)
		})

		test('add categories', () => {
			let updated = publish.handleUpdate({
				'add': {
					'category': [ 'four', 'five' ]
				}
			}, parsed)
			expect(updated).toHaveProperty('category')
			expect(updated.category).toHaveLength(5)
		})

		test('add new prop array', () => {
			delete parsed.category
			let updated = publish.handleUpdate({
				'add': {
					'category': [ 'a', 'b' ]
				}
			}, parsed)
			expect(updated).toHaveProperty('category')
			expect(updated.category).toHaveLength(2)
		})

		test('update category with tags key', () => {
			const original = parsed.category.length
			let updated = publish.handleUpdate({
				'add': {
					'tags': [ 'a', 'b' ]
				}
			}, parsed)
			expect(updated).toHaveProperty('category')
			expect(updated.category).toHaveLength(original + 2)
		})

		test('add unknown property', () => {
			let updated = publish.handleUpdate({
				'add': {
					'unknown': 'hello'
				}
			}, parsed)
			expect(updated).toHaveProperty('unknown', 'hello')
		})
	})
})
