
import { parseSyndicationTargets } from '../src/libs/config'

describe('config', () => {
	describe('parseSyndicationTargets', () => {
		const syndicationTargets = '{ "uid": "https://brid.gy/publish/twitter", "name": "@benjifs on Twitter w/ Brid.gy" }'

		beforeEach(() => {
			console.error = jest.fn()
		})

		test('parse syndication target from object', () => {
			const parsed = parseSyndicationTargets(syndicationTargets)
			expect(parsed).toBeTruthy()
			expect(parsed).toHaveLength(1)
			expect(parsed[0]).toHaveProperty('uid')
			expect(parsed[0]).toHaveProperty('name')
		})

		test('parse syndication target from array', () => {
			const parsed = parseSyndicationTargets(`[${syndicationTargets}]`)
			expect(parsed).toBeTruthy()
			expect(parsed).toHaveLength(1)
			expect(parsed[0]).toHaveProperty('uid')
			expect(parsed[0]).toHaveProperty('name')
		})

		test('parse multiple syndication targets from array', () => {
			const parsed = parseSyndicationTargets(`[${syndicationTargets}, ${syndicationTargets}]`)
			expect(parsed).toBeTruthy()
			expect(parsed).toHaveLength(2)
			expect(parsed[0]).toHaveProperty('uid')
			expect(parsed[1]).toHaveProperty('uid')
		})

		test('should not parse JSON', () => {
			// Remove last character from `syndicationTargets` to make it not parsable
			const parsed = parseSyndicationTargets(syndicationTargets.slice(0, -1))
			expect(parsed).toBeFalsy()
		})

		test('invalid parameters', () => {
			expect(parseSyndicationTargets()).toBeFalsy()
			expect(parseSyndicationTargets('')).toBeFalsy()
			expect(parseSyndicationTargets('[]')).toBeFalsy()
			expect(parseSyndicationTargets('{}')).toBeFalsy()
		})
	})
})
