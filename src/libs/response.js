
const Error = {
	INVALID: { 'statusCode': 400, 'error': 'invalid_request' },
	NOT_SUPPORTED: { 'statusCode': 400, 'error': 'invalid_response' },
	UNAUTHORIZED: { 'statusCode': 401, 'error': 'unauthorized' },
	FORBIDDEN: { 'statusCode': 403, 'error': 'forbidden' },
	SCOPE: { 'statusCode': 403, 'error': 'insufficient_scope' },
	NOT_ALLOWED: { 'statusCode': 405, 'error': 'method_not_allowed' }
}

const Response = {
	send: (code, body, headers) => {
		return {
			'statusCode': code,
			'headers': {
				'Content-Type': 'application/json',
				...headers
			},
			'body': body ? JSON.stringify(body) : 'success'
		}
	},
	sendLocation: (location, sendBody) => {
		return Response.send(201, sendBody ? {
			'url': location
		} : null, {
			'Location': location
		})
	},
	error: (type, description) => {
		return Response.send(type.statusCode, {
			'error': type.error,
			'error_description': description
		})
	}
}

export { Error, Response }
