
import fm from 'front-matter'

export default {
	output: data => {
		return '---\n' +
			`date: ${data.date}\n` +
			(data.title ? `title: ${data.title}\n` : '') +
			(data.tags ? `tags:\n - ${data.tags.join('\n - ')}\n` : '') +
			'---\n\n' +
			data.content
	},
	parse: content => {
		console.log('parse:', content)
		const { attributes, body } = fm(content.toString())
		return {
			type: attributes.type || 'h-entry',
			date: attributes.date.toISOString(),
			title: attributes.title,
			tags: attributes.tags,
			content: body
		}
	}
}
