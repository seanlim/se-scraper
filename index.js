require('dotenv').config();
const {promisify} = require('util');
const request = promisify(require('request').defaults({jar: true}));

// URLs
const moduleURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/class?id=${id}`;
const componentURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/topic?topicID=${id}`;

function getData(body) {
	let results = body.match(/\(\[(.*?)\]/g);
	if (results.length < 1) return null;
	return JSON.parse(results[0].substr(1));
}
function run(url) {
	request({url: url, headers: {cookie: process.env.COOKIE}})
		.then(({body}) => {
			const modules = getData(body);

			return Promise.all(
				modules.map(m =>
					request({
						url: componentURL(m.id),
						headers: {cookie: process.env.COOKIE},
					}),
				),
			);
		})
		.then(results => results.map(({body}) => getData(body))) // Map component data
		.then(components => {})
		.catch(console.error);
}

// Scrape SE class
run(moduleURL('438'));
