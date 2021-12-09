
import dotenv from 'dotenv'
import { Base64, utils } from '../src/libs/utils'

dotenv.config({ path: '.env.example' })

describe('utils', () => {
	describe('Base64', () => {
		const string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
		const b64 = 'TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdC4='

		test('decode', () => {
			expect(Base64.decode(b64)).toBe(string)
		})

		test('encode', () => {
			expect(Base64.encode(string)).toBe(b64)
		})
	})

	describe('slugify', () => {
		const string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. $ % ^ &'
		const slug = 'lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit'

		test('lowercase', () => {
			expect(utils.slugify(string.toLowerCase())).toBe(slug)
		})

		test('uppercase', () => {
			expect(utils.slugify(string.toUpperCase())).toBe(slug)
		})

		test('mixed case', () => {
			expect(utils.slugify(string)).toBe(slug)
		})
	})

	describe('removeEmpty', () => {
		test('remove unused properties', () => {
			const tmp = utils.removeEmpty({
				'one': 123,
				'two': 'abc',
				'three': [1, 2, 3],
				'four': { 'a': 1 },
				'five': [],
				'six': {},
				'seven': null,
				'eight': undefined
			})
			expect(tmp).toHaveProperty('one')
			expect(tmp).toHaveProperty('two')
			expect(tmp).toHaveProperty('three')
			expect(tmp).toHaveProperty('four')
			expect(tmp).not.toHaveProperty('five')
			expect(tmp).not.toHaveProperty('six')
			expect(tmp).not.toHaveProperty('seven')
			expect(tmp).not.toHaveProperty('eight')
			expect(tmp).not.toHaveProperty('nine')
		})
	})

	describe('urlToFilename', () => {
		beforeEach(() => {
			console.error = jest.fn()
		})

		test('invalid URL', () => {
			expect(utils.urlToFilename('https://invalid.com/file')).not.toBeDefined()
		})

		test('valid URL', () => {
			const filename = utils.urlToFilename('https://domain.tld/articles/123')
			expect(filename).toBeDefined()
			expect(filename).toBe('src/articles/123.md')
		})
	})

	describe('pick', () => {
		const data = {
			'one': 1,
			'two': 2,
			'three': 3
		}

		test('only return props from allow list', () => {
			const res = utils.pick([ 'one', 'two' ], data)
			expect(res).toHaveProperty('one')
			expect(res).toHaveProperty('two')
			expect(res).not.toHaveProperty('three')
		})

		test('dont return props from allow list not in data', () => {
			const res = utils.pick([ 'one', 'two', 'four' ], data)
			expect(res).toHaveProperty('one')
			expect(res).toHaveProperty('two')
			expect(res).not.toHaveProperty('three')
			expect(res).not.toHaveProperty('four')
		})

		test('dont return props from allow list not in data', () => {
			const res = utils.pick([ 'one', 'two', 'four' ], {})
			expect(res).not.toHaveProperty('one')
			expect(res).not.toHaveProperty('two')
			expect(res).not.toHaveProperty('three')
			expect(res).not.toHaveProperty('four')
		})
	})

	describe('compareArrays', () => {
		test('two arrays have at least one matching value', () => {
			expect(utils.compareArrays(['one', 'two'], ['four', 'five', 'two'])).toBeTruthy()
			expect(utils.compareArrays(['two'], ['four', 'five', 'two'])).toBeTruthy()
			expect(utils.compareArrays(['one', 'two', 'three'], ['two'])).toBeTruthy()
			expect(utils.compareArrays(['one'], ['one'])).toBeTruthy()
		})

		test('invalid parameters', () => {
			expect(utils.compareArrays(['one', 'two'], 'two')).toBeFalsy()
			expect(utils.compareArrays('two', 'two')).toBeFalsy()
			expect(utils.compareArrays()).toBeFalsy()
			expect(utils.compareArrays(true, false)).toBeFalsy()
		})
	})
})
