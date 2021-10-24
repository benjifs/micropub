/* eslint-disable no-useless-escape */

import { Error, Response } from '../src/libs/response'

describe('response', () => {
	test('send with no body', () => {
		const res = Response.send(200)
		expect(res).toHaveProperty('body')
		expect(res.body).toBe('success')
	})

	test('send with body', () => {
		const res = Response.send(200, { 'a': 1 })
		expect(res).toHaveProperty('body')
		expect(res.body).toBe('{\"a\":1}')
	})

	test('send with headers', () => {
		const res = Response.send(200, null, { 'x-app-name': 'test' })
		expect(res).toHaveProperty('headers')
		expect(res.headers).toHaveProperty('x-app-name')
		expect(res.headers['x-app-name']).toBe('test')
	})

	const domain = 'https://domain.tld'
	test('send location without body', () => {
		const res = Response.sendLocation(domain)
		expect(res).toHaveProperty('headers')
		expect(res.headers).toHaveProperty('Location')
		expect(res.headers['Location']).toBe(domain)
		expect(res.body).toBe('success')
	})

	test('send location with body', () => {
		const res = Response.sendLocation(domain, true)
		expect(res).toHaveProperty('headers')
		expect(res.headers).toHaveProperty('Location')
		expect(res.headers['Location']).toBe(domain)
		expect(res.body).toBe(JSON.stringify({ 'url': domain }))
	})

	test('error without description', () => {
		const res = Response.error(Error.INVALID)
		expect(res.statusCode).toBe(400)
		expect(res.body).not.toContain('error_description')
	})

	test('error with description', () => {
		const res = Response.error(Error.INVALID, 'critical error')
		expect(res.statusCode).toBe(400)
		expect(res.body).toContain('error_description')
	})
})
