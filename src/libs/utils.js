
const DEFAULT_CONTENT_DIR = 'src'

const stringFromProp = prop => {
	if (prop) {
		return Array.isArray(prop) ? prop[0] : prop
	}
	return null
}

const slugify = text => {
	return text
		.toLowerCase()
		.replace(/ /g, '-')
		.replace(/[^\w-]+/g, '')
}

const Base64 = {
	encode: content => Buffer.from(content).toString('base64'),
	decode: content => Buffer.from(content, 'base64').toString('utf8')
}

const utils = {
	stringFromProp: stringFromProp,

	parseJSON: json => {
		if (!json || !json.type || !json.properties) {
			return null
		}
		const parsed = {
			'h': '',
			'content': '',
			'name': '',
			'category': [],
			'mp-slug': '',
			'post-status': 'published',
			'visibility': 'public'
		}
		const { type, properties } = json

		parsed.h = stringFromProp(type).replace('h-', '')
		parsed.content = stringFromProp(properties.content)
		parsed.name = stringFromProp(properties.name)
		parsed.category = properties.category
		parsed['mp-slug'] = stringFromProp(properties['mp-slug'])

		console.log('parseJSON\n└─>', parsed)
		return parsed
	},

	format: data => {
		console.log('format:', data)
		const dir = (process.env.CONTENT_DIR || DEFAULT_CONTENT_DIR).replace(/\/$/, '')
		const date = new Date()
		const datetime = date.toISOString()
		const timestamp = Math.round(date / 1000)

		let slug = data.name ? 'posts' : 'notes'
		if (data['mp-slug']) {
			slug += `/${slugify(data['mp-slug'])}`
		} else if (data.name) {
			slug += `/${timestamp}-${slugify(data.name)}`
		} else {
			slug += `/${timestamp}`
		}

		return {
			slug: slug,
			filename: `${dir}/${slug}.md`,
			date: datetime,
			title: data.name,
			tags: data.category,
			content: data.content
		}
	},

	urlToFilename: urlString => {
		try {
			const url = new URL(urlString)
			if (url &&
					url.origin == process.env.ME.replace(/\/$/, '') &&
					url.pathname) {
				const dir = (process.env.CONTENT_DIR || DEFAULT_CONTENT_DIR).replace(/\/$/, '')
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
