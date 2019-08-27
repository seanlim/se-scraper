require('dotenv').config();
const {promisify} = require('util');
const request = promisify(require('request').defaults({jar: true}));
const fs = require('fs');
const writeFile = promisify(fs.writeFile);

// URLs
const moduleURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/class?id=${id}`;
const componentURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/topic?topicID=${id}`;
const componentDetailURL = id =>
	`https://explorer.smartco.cloud/admin/page/classes/lesson?lessonID=${id}`;
// Request headers
const headers = {
	cookie: process.env.COOKIE,
};
// Helpers
function getData(body) {
	let results = body.match(/\(\[(.*?)\]/g);
	if (results.length < 1) return null;
	return JSON.parse(results[0].substr(1));
}
function getMedia(body) {
	return body.match(/src='(.*)\.png'/g);
}

function run(url) {
	request({url: url, headers})
		.then(async ({body}) => {
			const modules = getData(body);
			console.info(`Writing ${modules.length} modules...`);
			await writeFile('./data/modules.json', JSON.stringify(modules, null, 2));
			console.info(`Done. Fetching components of ${modules.length} modules...`);
			return Promise.all(
				modules.map(m =>
					request({
						url: componentURL(m.id),
						headers,
					}),
				),
			);
		})
		.then(results => results.map(({body}) => getData(body)))
		.then(async components => {
			console.info(
				`Writing ${components.flatMap(c => c).length} components...`,
			);
			await writeFile(
				'./data/components.json',
				JSON.stringify(components, null, 2),
			);
			console.info(`Done. Crawling for images...`);
			return components.flatMap(c => c);
		})
		.then(components =>
			Promise.all(
				components.map(c =>
					request({
						url: componentDetailURL(c.id),
						headers,
					}),
				),
			),
		)
		.then(imageReqs =>
			Promise.all(
				imageReqs
					.map(({body}) => getMedia(body))
					.filter(images => images !== null)
					.flatMap(i => i)
					.map(imageURL => imageURL.split("'")[1])
					.map((imageURL, idx) =>
						request
							.get({url: imageURL})
							.pipe(fs.createWriteStream(`./data/${idx}.png`)),
					),
			),
		)
		.catch(console.error)
		.finally(() => console.info('Done.'));
}

// Scrape SE class
run(moduleURL('438'));
