require('dotenv').config();
const {promisify} = require('util');
const request = promisify(require('request').defaults({jar: true}));

// URLs
const courseURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/class?id=${id}`;
const moduleURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/topic?topicID=${id}`;
const componentURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/lesson?lessonID=${id}`;

function getData(body) {
	let results = body.match(/\(\[(.*?)\]/g);
	if (results.length < 1) return null;
	return JSON.parse(results[0].substr(1));
}
function run(url) {
	request({url: url, headers: {cookie: process.env.COOKIE}})
		.then(({body}) => {
			// Find modules
			const modules = getData(body);
			console.info(modules);

			// Find components

			// Parse components
		})
		.catch(console.error);
}

// Scrape SE class
run(courseURL('438'));
