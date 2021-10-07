
import dotenv from 'dotenv'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpMultipartBodyParser from '@middy/http-multipart-body-parser'
import httpUrlEncodeBodyParser from '@middy/http-urlencode-body-parser'
import jsonBodyParser from '@middy/http-json-body-parser'

dotenv.config()

import auth from './libs/auth'
import source from './libs/source'
import publish from './libs/publish'
import { Error, Response } from './libs/response'
// q=source&properties%5B%5D=content&properties%5B%5D=category&url=https%3A%2F%2Fbenji.dog%2Fnotes%2F1632514908
const getHandler = async query => {
	let res
	if (query.q === 'config') {
		return Response.send(200, {
			'media-endpoint': process.env.MEDIA_ENDPOINT || `${process.env.URL}/.netlify/functions/media`,
			'syndicate-to': []
		})
	} else if (query.q === 'source' && query.url) {
		res = await source.get(query.url, query.properties || query['properties[]'])
		if (res && res.source) {
			return Response.send(200, res.source)
		}
	} else if (query.q === 'syndicate-to') {
		return Response.send(200, {
			'syndicate-to': []
		})
	}
	return Response.error(Error.INVALID, res && res.error)
}

const micropubFn = async event => {
	if (event.httpMethod == 'GET') {
		return getHandler(event.queryStringParameters)
	}
	if (event.httpMethod !== 'POST') {
		return Response.error(Error.NOT_ALLOWED)
	}

	const { headers, body } = event
	const action = (body.action || 'create').toLowerCase()
	const error = await auth.isAuthorized(headers, body, action)
	if (error) {
		return Response.error(error)
	}

	let res
	if (action == 'create') {
		res = await publish.addContent(body, headers['content-type'] == 'application/json')
	} else if (action == 'delete') {
		res = await publish.deleteContent(body.url)
	} else if (action == 'update') {
		res = await publish.updateContent(body.url, body)
	} else {
		// 'undelete' action or unknown action
		return Response.error(Error.NOT_SUPPORTED)
	}
	if (res && res.filename) {
		if (action == 'create') {
			return Response.sendLocation(`${process.env.ME}${res.filename}`)
		}
		return Response.send(204)
	}
	return Response.error(Error.INVALID, res && res.error)
}

const handler = middy(micropubFn)
	.use(jsonBodyParser()) // application/json
	.use(httpMultipartBodyParser()) // multipart/form-data
	.use(httpUrlEncodeBodyParser()) // application/x-www-form-urlencoded
	.use(httpErrorHandler())

export { handler }
