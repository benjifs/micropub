
import dotenv from 'dotenv'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpMultipartBodyParser from '@middy/http-multipart-body-parser'

dotenv.config()

import auth from './libs/auth'
import content from './libs/content'
import GitHub from './libs/github'
import { Error, Response } from './libs/response'

const getHandler = async query => {
	let res
	if (query.q === 'source') {
		// https://github.com/indieweb/micropub-extensions/issues/14
		const opts = {
			'limit': parseInt(query.limit) || 10,
			'offset': parseInt(query.offset) || 0,
			'url' : process.env.MEDIA_DIR || 'uploads'
		}
		const exists = await GitHub.getDirectory(opts.url)
		if (!exists) {
			res = { 'error': 'directory does not exist' }
		} else if (exists.files) {
			let items = []
			for (let file of exists.files) {
				items.push({ 'url': `${process.env.ME}${file.path}` })
			}
			// Since `url` should start with timestamp, sort by `url` and first item should be the newest
			items.sort((a, b) => a.url < b.url ? 1 : a.url > b.url ? -1 : 0)
			items = items.slice(opts.offset, opts.offset + opts.limit)

			return Response.send(200, {
				'items': items,
				'count': items.length,
				'total': exists.files.length
			})
		}
	}
	return Response.error(Error.INVALID, res && res.error)
}

const mediaFn = async event => {
	if (!['GET', 'POST'].includes(event.httpMethod)) {
		return Response.error(Error.NOT_ALLOWED)
	}

	const { headers, body } = event
	const authResponse = await auth.isAuthorized(headers, body)
	if (!authResponse || authResponse.error) {
		return Response.error(authResponse)
	}
	const { scope } = authResponse

	if (event.httpMethod === 'GET') {
		return getHandler(event.queryStringParameters)
	}

	const action = (body.action || 'media create').toLowerCase()
	if (!scope || !auth.isValidScope(scope, action)) {
		return Response.error(Error.SCOPE)
	}

	const file = body.file || body.photo
	if (file && file.filename) {
		const filename = content.mediaFilename(file)
		const uploaded = await GitHub.uploadImage(filename, file)
		if (uploaded) {
			return Response.sendLocation(`${process.env.ME}${uploaded}`, true)
		}
	}
	return Response.error(Error.INVALID)
}

const handler = middy(mediaFn)
	.use(httpMultipartBodyParser())
	.use(httpErrorHandler())

export { handler }
