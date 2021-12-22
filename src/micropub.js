
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
import { parseSyndicationTargets } from './libs/config'

const getHandler = async query => {
	let res
	const syndicateTo = parseSyndicationTargets(process.env.SYNDICATE_TO) || []
	if (query.q === 'config') {
		return Response.send(200, {
			'media-endpoint': process.env.MEDIA_ENDPOINT || `${process.env.URL || ''}/.netlify/functions/media`,
			'syndicate-to': syndicateTo
		})
	} else if (query.q === 'source' && query.url) {
		res = await source.get(query.url, query.properties || query['properties[]'])
		if (res && res.source) {
			return Response.send(200, res.source)
		}
	} else if (query.q === 'syndicate-to') {
		return Response.send(200, {
			'syndicate-to': syndicateTo
		})
	}
	return Response.error(Error.INVALID, res && res.error)
}

const micropubFn = async event => {
	if (!['GET', 'POST'].includes(event.httpMethod)) {
		return Response.error(Error.NOT_ALLOWED)
	}

	const { headers, body } = event
	const scopes = await auth.isAuthorized(headers, body)
	if (!scopes || scopes.error) {
		return Response.error(scopes)
	}

	if (event.httpMethod === 'GET') {
		return getHandler(event.queryStringParameters)
	}

	const action = (body.action || 'create').toLowerCase()
	if (!auth.isValidScope(scopes, action)) {
		return Response.error(Error.SCOPE)
	}

	let res
	if (action == 'create') {
		res = await publish.addContent(body, headers['content-type'] == 'application/json')
	} else if (action == 'update') {
		res = await publish.updateContent(body.url, body)
	} else if (action == 'delete') {
		res = await publish.deleteContent(body.url, process.env.PERMANENT_DELETE)
	} else if (action == 'undelete') {
		res = await publish.undeleteContent(body.url)
	} else {
		// unknown or unsupported action
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
