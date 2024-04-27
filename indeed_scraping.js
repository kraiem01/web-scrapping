const debutExecution = new Date();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

const JOB_WEBSITE_URL = "https://www.indeed.com/";
const QUERY = "database";
const LOCATION = "France";
const WAIT_TIME = 6000;

const scrapeIndeed = async (QUERY) => {
    try {
        // Validation of Inputs;
        if (typeof JOB_WEBSITE_URL !== 'string' || typeof QUERY !== 'string' || typeof LOCATION !== 'string') {
            throw new Error('Invalid input type');
        }

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,  // Set viewport to null to use the entire browser window
        });
        const page = await browser.newPage();

        let status = await page.goto(JOB_WEBSITE_URL, { waitUntil: 'domcontentloaded' });
        // Verify the website URL like it exists or not by status code;
        status = status.status();
        if (status !== 404) {
            console.log(`Probably HTTP response status code 200 OK.`);
        }

        await page.type('#text-input-what', QUERY);
        await page.type('#text-input-where', LOCATION);
        await page.click("[type=submit]"); // Click of find Job button or It will return jobs after 6000ms automatically according to query;
        await page.waitForTimeout(WAIT_TIME);
        let existingJob = [];
        try {
            const existingDataString = fs.readFileSync('./db.json');
            existingJob = JSON.parse(existingDataString);
            console.log(`Job ${existingJob.length}`);
        } catch (e) {
            console.log(`Job erreur !!!!!!!!!!!!!!!!!!!!!!!!!`, e.message);
        }
        const jobs = await page.evaluate((existingJob, QUERY) => {
            console.log(`Job ${existingJob.length}`);
            // Fetch all the jobs according to queries;
            const heading = document.querySelectorAll("#mosaic-provider-jobcards > ul > li");
            heading.forEach((ele) => {
                let a = ele.innerText.trim().split("\n");
                console.log(a);
                let beg1 = "", beg2 = "";
                for (let i = 4; i < a.length; i++) {
                    beg1 += a[i] + ".";
                }
                for (let i = 3; i < a.length; i++) {
                    beg2 += a[i] + ".";
                }
                let jobUrl = ele.querySelector('a') ? ele.querySelector('a').href : '';
                let obj = {
                    title: QUERY,
                    comapny_name: a[1] == "new" ? a[2] : a[1],
                    location: a[1] == "new" ? a[3] : a[2],
                    'URL': jobUrl
                };

                if (!existingJob.some(existingJob => existingJob.URL === obj.URL || existingJob.location === obj.location) && obj.title !== '' && obj.URL !== '') {
                    existingJob.push(obj);
                }
            });
            return existingJob;
        }, existingJob, QUERY);

        console.log(jobs);
        console.log(jobs.length);

        // Save the extracted data in a structured JSON format as per the name mention;
        fs.writeFile('db.json', JSON.stringify(jobs), (error) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                console.log('Successfully File Saved in JSON Format');
            }
        });

        // Automatically close the browser after 5000ms;
        await browser.close();
    } catch (error) {
        console.error('Error:', error);
    }
    const finExecution = new Date();
    // Calculer la différence de temps en millisecondes
    const tempsExecution = finExecution - debutExecution;

    console.log(`La fonction a mis ${tempsExecution} millisecondes pour s'exécuter.`);
};

scrapeIndeed(QUERY);
