/* eslint-disable no-useless-escape */

import nock from 'nock'
import Auth from '../src/libs/auth'

describe('Auth', () => {
	beforeEach(() => {
		console.error = jest.fn()
		nock.disableNetConnect()
	})

	const url = 'https://tokens.indieauth.com'
	const path = '/token'
	const token = '123456'
	const validResponse = {
		'me': 'https:\/\/domain.ltd\/',
		'issued_by': 'https:\/\/tokens.indieauth.com\/token',
		'client_id': 'https:\/\/example.com\/',
		'issued_at': 1532235856,
		'scope': 'create media delete',
		'nonce': 1234567
	}

	afterEach(() => {
		nock.cleanAll()
	})

	describe('validateToken', () => {
		test('valid token', async () => {
			const mock = nock(url, {
				reqheaders: {
					'accept': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			})
				.get(path)
				.reply(200, validResponse)

			const res = await Auth.validateToken(`${url}${path}`, token)
			mock.done()
			expect(res).toBeTruthy()
		})

		test('invalid token', async () => {
			const mock = nock(url, {
				reqheaders: {
					'accept': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			})
				.get(path)
				.reply(400)

			const res = await Auth.validateToken(`${url}${path}`, token)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('isValidScope', () => {
		describe('multiple allowed scopes', () => {
			test('single scope is in list', () => {
				const res = Auth.isValidScope(validResponse.scope, 'create')
				expect(res).toBeTruthy()
			})

			test('single scope is not in list', () => {
				const res = Auth.isValidScope(validResponse.scope, 'update')
				expect(res).toBeFalsy()
			})

			test('one of the scopes is in list', () => {
				const res = Auth.isValidScope(validResponse.scope, 'update create')
				expect(res).toBeTruthy()
			})

			test('none of the scopes are in the list', () => {
				const res = Auth.isValidScope(validResponse.scope, 'update other')
				expect(res).toBeFalsy()
			})
		})

		describe('single allowed scope', () => {
			const scope = 'create'
			test('single scope matches `scope`', () => {
				const res = Auth.isValidScope(scope, 'create')
				expect(res).toBeTruthy()
			})

			test('single scope does not match `scope`', () => {
				const res = Auth.isValidScope(scope, 'update')
				expect(res).toBeFalsy()
			})

			test('one of the scopes matches `scope`', () => {
				const res = Auth.isValidScope(scope, 'update create')
				expect(res).toBeTruthy()
			})

			test('none of the scopes match `scope`', () => {
				const res = Auth.isValidScope(scope, 'update media')
				expect(res).toBeFalsy()
			})
		})
	})

	describe('getToken', () => {
		test('get token from header', () => {
			const res = Auth.getToken({
				'authorization': `Bearer ${token}`
			})
			expect(res).toBe(token)
		})

		test('get token from body', () => {
			const res = Auth.getToken({}, {
				'access_token': token
			})
			expect(res).toBe(token)
		})

		test('token in header and body returns 400', () => {
			const res = Auth.getToken({
				'authorization': `Bearer ${token}`
			}, {
				'access_token': token
			})
			expect(res).toHaveProperty('error')
			expect(res).toHaveProperty('statusCode')
			expect(res.statusCode).toBe(400)
		})

		test('no token returns 401', () => {
			const res = Auth.getToken()
			expect(res).toHaveProperty('error')
			expect(res).toHaveProperty('statusCode')
			expect(res.statusCode).toBe(401)
		})
	})
})
