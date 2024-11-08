const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const port = process.env.PORT || 8080;

// Default URL to scrape
const defaultUrl = 'https://www.amazon.in/BRUTON-Lite-Sport-Shoes-Running/dp/B0DHH7TMQ1';

app.get('/scrape', async (req, res) => {
    const url = defaultUrl; // Use the default URL instead of the query parameter

    let browser = null;

    try {
        // Launch Puppeteer with the appropriate Chromium executable
        browser = await puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Extract product title
        const productTitle = await page.$eval('#title', el => el.innerText.trim());

        // Extract product price
        const productPrice = await page.$eval('.a-price .a-offscreen', el => el.innerText.trim());

        // Extract product description
        const productDesc = await page.$$eval('.a-list-item', items => {
            return items.map(item => item.innerText.trim()).filter(text => text);
        });

        // Send the extracted data as JSON
        res.json({ productTitle, productPrice, productDesc });
        
    } catch (error) {
        console.error('Error occurred while scraping:', error);
        res.status(500).json({ error: 'Failed to scrape the product details.' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
