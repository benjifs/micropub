
import got from 'got'

import { Error } from './response'

const Auth = {
	validateToken: async (token_endpoint, token) => {
		try {
			const { body } = await got(token_endpoint, {
				headers: {
					accept: 'application/json',
					Authorization: `Bearer ${token}`
				}
			})
			return body && JSON.parse(body)
		} catch (err) {
			console.error(err)
		}
	},
	isAuthorized: async (headers, body, required_scope) => {
		console.log('HEADERS:', headers)
		console.log('BODY:', body)
		const token = (headers.authorization && headers.authorization.split(' ')[1]) || body.access_token
		if (!token) {
			return Error.UNAUTHORIZED
		}
		const auth = await Auth.validateToken(process.env.TOKEN_ENDPOINT, token)
		if (!auth || auth.me != process.env.ME) {
			return Error.FORBIDDEN
		}
		const valid_scopes = auth.scope.split(' ')
		if (!valid_scopes.includes(required_scope)) {
			return Error.SCOPE
		}
	}
}

export default Auth
