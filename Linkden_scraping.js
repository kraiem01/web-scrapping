const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

function arrayContainsArray(mainArray, subArray) {
    return subArray.every(item => mainArray.includes(item));
}

async function getJobUrls(QUERY, location, start) {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    const companyUrlsMap = {};

    //for (let start = 0; start <= nb; start += 10) {
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${QUERY}&location=${location}&start=${start}`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const blocks = await page.$$('li div');

    for (const block of blocks) {
        const companyElement = await block.$('.base-search-card__info h4 a');
        // Check if companyElement is not null before accessing its properties
        if (companyElement) {
            const companyName = await page.evaluate(node => node.innerText.trim(), companyElement);

            const jobElements = await block.$$('a');
            const jobUrlsForCompany = await Promise.all(jobElements.map(jobElement => jobElement.evaluate(node => node.href)));

            if (companyUrlsMap.hasOwnProperty(companyName)) {
                // If the company already exists in the map, add new URLs to the existing array
                if (!arrayContainsArray(companyUrlsMap[companyName], jobUrlsForCompany)) {
                    companyUrlsMap[companyName].push(...jobUrlsForCompany);
                }
            } else {
                // If the company is not in the map, create a new entry with URLs array
                companyUrlsMap[companyName] = jobUrlsForCompany;
            }
        }
    }

    await browser.close();

    const finalUrls = {
        title: QUERY,
        location: location,
        URL: Object.entries(companyUrlsMap).map(([companyName, jobUrls]) => ({
            companyName: companyName,
            URLs: jobUrls,
        })),
    };

    return finalUrls;
}

// Example usage
const search = "data science";
const location = 'france';
const nb = 1;

getJobUrls(search, location, nb)
    .then(urls => {
        console.log(JSON.stringify(urls, null, 2));
    })
    .catch(error => console.error(error));
