const path = require('path');
const { preprocessName } = require('../utils/scraper-functions');

const outputFolderString = path.join(__dirname, '..', 'outputs');
const makeProductBasicInfoFilePath = (productName) => path.join(outputFolderString, `${preprocessName(productName)}-info.json`)
const makeProductReviewsFilePath = (productName) => path.join(outputFolderString, `${preprocessName(productName)}-reviews.csv`)

const columnsMapping = {
  product: {
    name: 'Name',
    priceOriginal: 'Original Price',
    priceDiscount: 'Discounted Price',
    rating: 'Rating',
    totalReviews: 'Total Reviews',
    qtySold: 'Quantity Sold',
    variants: 'Variants',
    stockAvailable: 'Stock Available',
    favoritesCount: 'Favorites Count',
    properties: 'Product Properties',
    description: 'Product Description',
    // reviewMetrics: 'Review Metrics',
    // reviews: 'Reviews',
  },
  reviewMetrics: {
    '1': '1 star',
    '2': '2 star',
    '3': '3 star',
    '4': '4 star',
    '5': '5 star',
    withComments: 'With Comments',
    withImagesAndOrVideos: 'With Images / Videos',
    foreign: 'Foreign',
  },
  reviews: {
    name: 'Username',
    rating: 'Rating',
    dateTime: 'Posted At',
    categories: 'Product Categories',
    text: 'Review Text',
    shopResponse: 'Shop\'s response',
    likes: 'Likes',
    page: 'Page',
  }
}

module.exports = {
  outputFolderString,
  columnsMapping,
  makeProductBasicInfoFilePath,
  makeProductReviewsFilePath,
};
