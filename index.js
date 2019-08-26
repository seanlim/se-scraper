require('dotenv').config();
const {promisify} = require('util');
const request = promisify(require('request').defaults({jar: true}));
const writeFile = promisify(require('fs').writeFile);

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
async function run(url) {
	request({url: url, headers: {cookie: process.env.COOKIE}})
		.then(async ({body}) => {
			const modules = getData(body);
			console.info(`Writing ${modules.length} modules...`);
			await writeFile('./data/modules.json', JSON.stringify(modules, null, 2));
			console.info(`Done. Fetching components of ${modules.length} modules...`);
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
		.then(components => {
			console.info(
				`Writing ${components.flatMap(c => c).length} components...`,
			);
			writeFile('./data/components.json', JSON.stringify(components, null, 2));
		})
		.catch(console.error)
		.finally(() => console.info('Done.'));
}

// Scrape SE class
run(moduleURL('438'));
