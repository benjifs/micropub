
import dotenv from 'dotenv'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpMultipartBodyParser from '@middy/http-multipart-body-parser'

dotenv.config()

import auth from './libs/auth'
import GitHub from './libs/github'
import { Error, Response } from './libs/response'

const mediaFn = async event => {
	if (event.httpMethod !== 'POST') {
		return Response.error(Error.NOT_ALLOWED)
	}

	const { headers, body } = event
	const error = await auth.isAuthorized(headers, body, 'media')
	if (error) {
		return Response.error(error)
	}

	if (body.file || body.photo) {
		const filename = await GitHub.uploadImage(body.file || body.photo)
		if (filename) {
			return Response.sendLocation(`${process.env.ME}${filename}`)
		}
	}
	return Response.error(Error.INVALID)
}

const handler = middy(mediaFn)
	.use(httpMultipartBodyParser())
	.use(httpErrorHandler())

export { handler }
