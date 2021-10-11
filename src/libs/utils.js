
const Base64 = {
	encode: content => Buffer.from(content).toString('base64'),
	decode: content => Buffer.from(content, 'base64').toString('utf8')
}

const utils = {
	slugify: text => {
		return text
			.toLowerCase()
			.replace(/[^\w- ]+/g, '')
			.trim()
			.replace(/ /g, '-')
	},

	removeEmpty: data => {
		for (let i in data) {
			if (data[i] === undefined || data[i] === null || !data[i].length) {
				delete data[i]
			}
		}
		return data
	},

	urlToFilename: urlString => {
		try {
			const url = new URL(urlString)
			if (url &&
					url.origin == process.env.ME.replace(/\/$/, '') &&
					url.pathname) {
				const dir = (process.env.CONTENT_DIR || 'src').replace(/\/$/, '')
				return `${dir}/${url.pathname.replace(/^\/|\/$/g, '')}.md`
			}
		} catch (err) {
			console.error('Invalid URL:', urlString)
		}
	}
}

export {
	Base64,
	utils
}
