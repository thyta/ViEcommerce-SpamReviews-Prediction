const path = require('path');
const fs = require('fs');
const csv = require('csv-stringify');
const puppet = require('puppeteer');

const { preprocessName, quantityPostfixToNumber, delay } = require('../utils/scraper-functions');
const { outputFolderString, columnsMapping, makeProductBasicInfoFilePath, makeProductReviewsFilePath } = require('../vars/scraper.vars');

const extractors = {
  productName: () => document.querySelector('.product-briefing .flex-auto span')?.textContent ?? 'N/A',
  productPriceOriginal: () => {
    const orig = document.querySelector('.product-briefing .Y3DvsN');
    const discount = document.querySelector('.product-briefing .pqTWkA');

    if (orig) {
      return orig.textContent || 'N/A';
    }

    return discount.textContent || 'N/A';
  },
  productPriceDiscount: () => {
    const orig = document.querySelector('.product-briefing .Y3DvsN');
    const discount = document.querySelector('.product-briefing .pqTWkA');

    if (orig) {
      return discount.textContent || 'N/A';
    }

    return 'N/A';
  },
  productRating: () => document.querySelectorAll('.product-briefing .IZIVH\\+ ._1k47d8')?.[0]?.textContent ?? 'N/A',
  productTotalReviews: () => document.querySelectorAll('.product-briefing .IZIVH\\+ ._1k47d8')?.[1]?.textContent ?? 'N/A',
  productReviewMetrics: () => {
    if (document.querySelectorAll('.product-ratings').length < 1) {
      return 'N/A';
    }

    const output = {};
    const ratingOverviewFilters = document.querySelectorAll('.product-ratings .product-rating-overview__filters');

    // Regular expression for N-star reviews filter buttons (5 sao (<number>), 4 sao (<number>), etc.).
    // TODO: Improve this regular expression.
    const ratingRegExp = /([\w\p{L} /]){1,}(?: )?(?:\((\d{1,3}(?:(?:[,.]){0,1}(?:\d{0,3}k{0,})){0,}){0,}\))?/gu;

    // "Tất cả", N-sao (1-5) filters are minimum requirements.
    if (ratingOverviewFilters.length < 1 || ratingOverviewFilters[0].children.length < 6) {
      return 'N/A';
    }

    // Get all N-star reviews filter button texts (5 sao (<number>), 4 sao (<number>), etc.).
    // Ignore "Tất cả"
    // TODO: Provide translations for filter names.
    for (let i = 1; i < ratingOverviewFilters[0].children.length; i += 1) {
      const regExp = new RegExp(ratingRegExp);
      const rating = ratingOverviewFilters[0].children[i];
      // console.log(`i -> ${i}`);
      // console.log(`rating -> ${rating?.innerHTML}`);
      // console.log('rating.innerHTML', rating.innerHTML);
      const matches = regExp.exec(`${rating.textContent}`);

      // console.log('matches', matches);

      if (matches === null) {
        continue;
      } else {
        const [criteriaLabel, , value] = matches;
        output[criteriaLabel] = value;
      }
    }

    // // "Có bình luận"
    // const m6 = new RegExp(ratingRegExp).exec(`${ratingOverviewFilters[0].children[6].textContent}`);
    // console.log('m6', m6);
    // output['withComments'] = m6[2];

    // // "Có hình ảnh/video"
    // const m7 = new RegExp(ratingRegExp).exec(`${ratingOverviewFilters[0].children[7].textContent}`);
    // console.log('m7', m7);
    // output['withImagesAndOrVideos'] = m7[2];

    // TODO: Everything else (e.g. "Nước Ngoài")

    return output;
  },
  productQtySold: () => document.querySelector('.product-briefing .jgUbWJ .P3CdcB')?.textContent ?? 'N/A',
  productVariants: () => {
    const parameters = document.querySelectorAll('.product-briefing .oN9nMU');
    let output = {};

    if (parameters.length > 0) {
      parameters.forEach(parameter => {
        const parent = parameter.parentNode;
        const sibling = parameter.nextElementSibling;

        if (
          parent.children.length === 2 &&
          parameter.nodeName === 'LABEL' &&
          sibling.nodeName === 'DIV' &&
          sibling.children.length > 0
        ) {
          const siblingChildren = sibling.childNodes;

          output[parameter.textContent] = {
            all: [],
            active: [],
          };

          for (let child of siblingChildren) {
            if (child.nodeName === 'BUTTON') {
              const isDisabled = child.getAttribute('aria-disabled');

              output[parameter.textContent].all.push(child.textContent);

              if (isDisabled === 'false' || isDisabled === '') {
                output[parameter.textContent].active.push(child.textContent);
              }
            }
          }

          if (Object
            .keys(output[parameter.textContent])
            .every(key => output[parameter.textContent][key].length === 0)
          ) {
            delete output[parameter.textContent];
          }
        }
      });
    }

    if (Object.keys(output) < 1) {
      output = 'N/A';
    }

    return output;
  },
  productStockAvailable: () => {
    const list = document.querySelectorAll('.product-briefing .oN9nMU');

    if (list.length > 0) {
      const last = list[list.length - 1];
      const siblingChildren = last.nextElementSibling.children;

      return (siblingChildren[siblingChildren.length - 1].textContent)
        ?.split(' ').filter(segment => !isNaN(+segment))?.[0] ?? 'N/A';
    }

    return 'N/A';
  },
  productFavoritesCount: () => document.querySelectorAll('.product-briefing ._3jkKrB .IYjGwk .Ne7dEf')?.[0]?.textContent?.match(/(\d+)/g)?.[0] ?? 'N/A',
  productProperties: () => {
    const properties = document.querySelectorAll('.product-detail .U9rGd1 .MCCLkq .dR8kXc');
    const output = {};

    if (properties.length > 0) {
      const category = properties[0];

      // Handle "Danh mục"
      output[category.children[0].textContent] =
        Array.from(category.children[1].childNodes)
          .filter(child => child.nodeName === 'A')
          .map(child => child.textContent)
          .join(' > ')
        ;

      // Handle the rest
      for (let i = 1; i < properties.length; i += 1) {
        const p = properties[i];

        // Get property name
        const pName = p.children[0]?.textContent ?? 'N/A';

        // Get property value
        output[pName] = p.children[1]?.textContent ?? 'N/A';
      }

      return output;
    }

    return 'N/A';
  },
  productDescription: () => document.querySelectorAll('.product-detail .U9rGd1 .MCCLkq .irIKAp')?.[0]?.textContent ?? 'N/A',
  // productsReviews: () => {
  //   if (document.querySelectorAll('.product-ratings').length < 1) {
  //     return 'N/A';
  //   }
  // }
}

const getBasicProductInfo = async (page, product) => {
  product['name'] = await page.evaluate(extractors.productName);
  product['priceOriginal'] = await page.evaluate(extractors.productPriceOriginal);
  product['priceDiscount'] = await page.evaluate(extractors.productPriceDiscount);
  product['rating'] = await page.evaluate(extractors.productRating);
  product['totalReviews'] = await page.evaluate(extractors.productTotalReviews);
  product['qtySold'] = await page.evaluate(extractors.productQtySold);
  product['variants'] = await page.evaluate(extractors.productVariants);
  product['stockAvailable'] = await page.evaluate(extractors.productStockAvailable);
  product['favoritesCount'] = await page.evaluate(extractors.productFavoritesCount);
  product['properties'] = await page.evaluate(extractors.productProperties);
  product['description'] = await page.evaluate(extractors.productDescription);
  product['reviewMetrics'] = await page.evaluate(extractors.productReviewMetrics);
  // product['reviews'] = await getProductReviews(page, product);
  // const productReviewMetrics = await page.evaluate(extractors.productReviewMetrics);
}

const getProductReviews = async (page, state) => {
  const reviewsContainer = '.product-ratings .product-ratings__list';
  const reviewsList = `${reviewsContainer} .shopee-product-comment-list`;
  const reviewsPageController = `${reviewsContainer} .product-ratings__page-controller`;
  const reviewFilterButtons = '.product-ratings .product-rating-overview__filters';
  const activePageButtons = `${reviewsPageController} button.shopee-button-solid, button.shopee-button-solid--primary`;
  const inactivePageButtons = `${reviewsPageController} button.shopee-button-no-outline, button.shopee-button-no-outline--non-click`;
  const pageNumberButtons = `${activePageButtons}, ${inactivePageButtons}`; // Include active + in-active
  const controlButtons = {
    left: `${reviewsPageController} button.shopee-icon-button--left`,
    right: `${reviewsPageController} button.shopee-icon-button--right`,
  };

  // Maximum number of reviews per page.
  const MAX_REVIEWS_PER_PAGE = 6;

  if (state.totalReviews === 'N/A' ||
    await page.evaluate(() => document.querySelectorAll('.product-ratings').length < 1) ||
    await page.evaluate(
      (reviewsPageController) => document.querySelectorAll(reviewsPageController).length < 1,
      reviewsPageController
    )
  ) {
    return 'N/A';
  }

  // Global accumulated reviews
  const masterReviews = {
    all: [],
    byPage: {},
    statistics: {},
  };

  // Indicates whether reviews control buttons can be used or not.
  let invalidControls;

  // Current active page state
  let currentActivePageNumber;

  // Has more page to click next to?
  let hasReachedLastPage;
  let hasReachedFirstPage;

  // Page statistics (e.g. Indexed pages, total page count, ...)
  let pageStatistics = {
    indexedPages: new Map(),
    totalPageCount: 0,
    totalReviews: 0,
  };

  const assignReviewPageNumberControllIDs = async () => { }

  // Current active page button element
  // let currentActiveButtonElement = null;

  // const reviewsControllerElement = await page.$$(reviewsController);
  // // console.log('reviewsControllerElement', reviewsControllerElement);

  // const controlButtonLeftElement = await page.$$(controlButtons.left);
  // const controlButtonRightElement = await page.$$(controlButtons.right);

  // console.log('pageNavigationButtonsElement', pageNavigationButtonsElement.length);

  // TODO: UPDATE 31-May: When listing All Reviews, neither the page number buttons will not appear,
  // nor the control buttons (prev / next) will work, causing the crawl procedure to fail.
  const getPageControllerInfo = async () => {
    return await page.evaluate(
      (reviewsController, activePageButtons, controlButtons) => {
        const reviewsControllerElement = document.querySelectorAll(reviewsController);

        const pageInfo = {
          invalidControls: false,
          hasReachedFirstPage: false,
          hasReachedLastPage: false,
          currentActivePageNumber: -1
        }

        // Cannot find controllers for navigating reviews
        if (reviewsControllerElement.length < 1) {
          pageInfo.invalidControls = true;
          return pageInfo;
        }

        // Find current active button
        const activePageNavigationButtonsElement = reviewsControllerElement[0].querySelectorAll(`${activePageButtons}`)?.[0] ?? null;
        const controlButtonRightElement = document.querySelectorAll(controlButtons.right)?.[0] ?? null;
        const controlButtonLeftElement = document.querySelectorAll(controlButtons.left)?.[0] ?? null;

        if (activePageNavigationButtonsElement === null || controlButtonRightElement === null || controlButtonLeftElement === null) {
          pageInfo.hasReachedFirstPage = false;
          pageInfo.hasReachedLastPage = false;
        } else if (activePageNavigationButtonsElement.nextElementSibling.isEqualNode(controlButtonRightElement)) {
          // Current active page navigation button is next to the right button. 
          pageInfo.currentActivePageNumber = activePageNavigationButtonsElement.innerText;
          // hasReachedFirstPage = false;
          pageInfo.hasReachedLastPage = true;
        } else if (activePageNavigationButtonsElement.previousElementSibling.isEqualNode(controlButtonLeftElement)) {
          // Current active page navigation button is next to the left button.
          pageInfo.currentActivePageNumber = activePageNavigationButtonsElement.innerText;
          pageInfo.hasReachedFirstPage = true;
          // hasReachedLastPage = false;
        } else {
          // Current active page navigation button is next to something else. Continue.
          pageInfo.currentActivePageNumber = activePageNavigationButtonsElement.innerText;
          // hasReachedLastPage = false;
          // hasReachedFirstPage = false;
        }

        return pageInfo;
      },

      // Below are passed as arguments into the function.
      reviewsPageController,
      activePageButtons,
      controlButtons
    )
  }

  // Checks to see if the problem on top of getPageControllerInfo exists or not.
  // Will have to check for cases where there are less reviews than MAX_REVIEWS_PER_PAGE.
  const canUseAllFilterStrategy = async () => {
    const estimatedTotalReviews = quantityPostfixToNumber(state.totalReviews);

    return await page.evaluate(
      (
        reviewsPageController,
        controlButtons,
        pageNumberButtons,
        estimatedTotalReviews,
        MAX_REVIEWS_PER_PAGE
      ) => {
        // const controlButtonClassNames = Object.keys(controlButtons).map(key => controlButtons[key]);
        // // Check the number of buttons inside reviewsPageController.
        // const exisitingControllerButtonsClassNames = Array.from(document.querySelectorAll(reviewsPageController)[0].childNodes).map(buttonElement => buttonElement.className.trim());

        const pageNumberButtonLength = document.querySelectorAll(pageNumberButtons).length;

        // There is no page number button on the review section.
        // This could mean either;
        // 1. The review filter we're trying to crawl is somewhat broken.
        // 2. The total reviews is lower than the maximum reviews per page (MAX_REVIEWS_PER_PAGE).
        if (pageNumberButtonLength < 1) {
          if (estimatedTotalReviews <= MAX_REVIEWS_PER_PAGE) {
            return true;
          }

          return false;
        }
      },

      reviewsPageController,
      controlButtons,
      pageNumberButtons,
      estimatedTotalReviews,
      MAX_REVIEWS_PER_PAGE,
    );
  }

  const updatePageControllerInfo = async () => {
    const pageControllerInfo = await getPageControllerInfo();

    // Get current active page number
    invalidControls = pageControllerInfo.invalidControls;
    currentActivePageNumber = pageControllerInfo.currentActivePageNumber;
    hasReachedFirstPage = pageControllerInfo.hasReachedFirstPage;
    hasReachedLastPage = pageControllerInfo.hasReachedLastPage;

    if (+currentActivePageNumber > 0 && !pageStatistics.indexedPages.has(currentActivePageNumber)) {
      // If this page has already been gone through before, do not increment totalPageCount.
      pageStatistics.indexedPages.set(currentActivePageNumber, '');
      pageStatistics.totalPageCount += 1;
    }

    // console.log('---------------------------------');
    // console.log('updatePageControllerInfo');
    // console.log('invalidControls', invalidControls);
    // console.log('currentActivePageNumber', currentActivePageNumber);
    // console.log('hasReachedFirstPage', hasReachedFirstPage);
    // console.log('hasReachedLastPage', hasReachedLastPage);
    // console.log('---------------------------------');
  }

  const next = async () => {
    // Retrieve more reviews
    await page.evaluate((controlButtons) => {
      const rightButton = document.querySelectorAll(controlButtons.right)?.[0] ?? null;

      if (rightButton !== null) {
        rightButton.click();
      }
    }, controlButtons);

    // TODO: Use MutationObserver instead of delay. Maybe wait until all of the reviews of that page has been loaded.
    await delay(750);
    await updatePageControllerInfo();
  }

  const prev = async () => {
    // Retrieve more reviews
    await page.evaluate((controlButtons) => {
      const leftButton = document.querySelectorAll(controlButtons.left)?.[0] ?? null;

      if (leftButton !== null) {
        leftButton.click();
      }
    }, controlButtons);

    await delay(250);
    await updatePageControllerInfo();
  }

  const getAllReviewsInPage = async () => {
    return await page.evaluate((reviewsList, currentActivePageNumber) => {
      const dateTimeCategoriesRegExp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) {0,1}\|{0,1} {0,1}((?:[\p{L} ]*): ([\w\p{L} ,]+)){0,}/gui;

      /**
       * Get review's rating based on the number of stars
       */
      const getReviewStarRating = (containerElement) => {
        if (containerElement === null) {
          return 'N/A';
        }

        const stars = containerElement.querySelectorAll('.shopee-product-rating__rating')?.[0] ?? null;

        if (stars === null) {
          return 'N/A';
        }

        let rating = 0;

        for (let star of stars.childNodes) {
          if (star.classList.contains('icon-rating-solid--active') &&
            star.classList.contains('icon-rating-solid')
          ) {
            rating += 1;
          }
        }

        return rating;
      }

      const getReviewDateTime = (containerElement) => {
        const regEx = new RegExp(dateTimeCategoriesRegExp);

        if (containerElement === null) {
          return 'N/A';
        }

        const matches = regEx.exec(containerElement.innerText);

        if (!Array.isArray(matches) || matches.length < 1) {
          return 'N/A';
        }

        return matches[1];
      }

      // TODO: Implement this. Currently using getReviewDateTime's logic.
      const getReviewCategories = (containerElement) => {
        const regEx = new RegExp(dateTimeCategoriesRegExp);

        if (containerElement === null) {
          return 'N/A';
        }

        const matches = regEx.exec(containerElement.innerText);

        if (!Array.isArray(matches) || matches.length < 1) {
          return 'N/A';
        }

        return matches[2];
      }

      const getReviewText = (containerElement) => {
        if (containerElement === null || containerElement.length < 1) {
          return 'N/A';
        }

        return containerElement.innerText;
      }

      const getReviewShopResponse = (containerElement) => {
        if (containerElement === null || containerElement.querySelectorAll('._2kece8').length < 1) {
          return 'N/A';
        }

        return containerElement.querySelectorAll('._2kece8')?.[0]?.innerText ?? 'N/A';
      }

      const getReviewLikes = (containerElement) => {
        if (containerElement === null || containerElement.children.length < 1) {
          return 'N/A';
        }

        const likesCount = containerElement.firstChild.querySelectorAll('.shopee-product-rating__like-count')?.[0]?.innerText ?? null;

        if (likesCount === null) {
          return 'N/A';
        }

        return isNaN(+(likesCount)) ? '0' : +(likesCount);
      }

      const reviews = [];

      // Reviews list element
      const listElement = document.querySelectorAll(reviewsList)?.[0] ?? null;

      // console.log('listElement', listElement);

      if (listElement === null || listElement.children.length < 1) {
        return [];
      }

      // console.log('reviews', listElement.innerHTML);

      for (let review of listElement.childNodes) {
        let extractedTextContent = {};
        let textContentElement = review.querySelectorAll('.shopee-product-rating__main')?.[0] ?? null;

        // Extract reviewer name, date/time, category, comments, shop's response (if any) and likes.
        if (textContentElement !== null && textContentElement.children.length > 0) {
          const reviewStarRatingContainer = textContentElement.querySelectorAll('.repeat-purchase-con')?.[0] ?? null;
          const reviewDateTimeCategoriesContainer = textContentElement.querySelectorAll('.shopee-product-rating__time')?.[0] ?? null;
          const reviewTextContainer = textContentElement.querySelectorAll('.Rk6V\\+3')?.[0] ?? null;
          const reviewShopResponseContainer = textContentElement.querySelectorAll('.fwJamt')?.[0] ?? null;
          const reviewLikesContainer = textContentElement.querySelectorAll('.shopee-product-rating__actions')?.[0] ?? null;

          extractedTextContent['name'] = textContentElement.querySelectorAll('.shopee-product-rating__author-name')?.[0]?.innerText ?? null;
          extractedTextContent['rating'] = getReviewStarRating(reviewStarRatingContainer);
          extractedTextContent['dateTime'] = getReviewDateTime(reviewDateTimeCategoriesContainer);
          extractedTextContent['categories'] = getReviewCategories(reviewDateTimeCategoriesContainer);
          extractedTextContent['text'] = getReviewText(reviewTextContainer);
          extractedTextContent['shopResponse'] = getReviewShopResponse(reviewShopResponseContainer);
          extractedTextContent['likes'] = getReviewLikes(reviewLikesContainer);
          extractedTextContent['page'] = currentActivePageNumber;

          // console.log('extractedTextContent', extractedTextContent);
        }

        reviews.push(extractedTextContent);
        // break; // TODO: remove when done.
      }

      // masterReviews[currentActivePage] = reviews;
      return reviews;
    }, reviewsList, currentActivePageNumber);
  }

  // TODO: Implement me pls.
  const changeReviewFilter = async (filterLabel) => { }

  // TODO: Implement me pls (might replace getAllReviewsInPage).
  const getAllReviewsForFilter = async () => { }

  // Update inital page info
  await updatePageControllerInfo();

  // Check the comment in getPageControllerInfo. Implementing it now.
  // Will check whether the "Tất cả" filter button and its navigation buttons still work.
  // If not then switch strategy to get reviews from each N-star filter buttons.

  async function allFilterStrategy() {
    console.log('Using "All" filter button strategy to retrieve reviews.');

    // Since the page would defeault to show all reviews anyway,
    // there is no need to switch review filter.
    while (!invalidControls) {
      console.log('currentActivePageNumber', currentActivePageNumber);
      console.log('hasReachedFirstPage', hasReachedFirstPage);
      console.log('hasReachedLastPage', hasReachedLastPage);

      console.log('Extracting reviews for page', currentActivePageNumber, '...');

      const pageReviews = await getAllReviewsInPage();

      masterReviews.byPage[currentActivePageNumber] = pageReviews;
      masterReviews.all.push(...pageReviews);
      pageStatistics.totalReviews += pageReviews.length;

      // console.log('masterReviews', masterReviews.all);

      // Check if there are any more page to fetch
      // Find the current active page, check if its next sibling is another page button or controller button
      // If its another page button, click right button
      // If its controller button, that means there are no more page to fetch. Stop.

      // currentActivePage += 1;

      // Go to next page.
      // await next();
      if (hasReachedLastPage) {
        break;
      } else {
        await next();
      }
      // break;
    }
  }

  async function nStarButtonsStrategy() {
    console.log('Using "N-Star" filter buttons strategy to retrieve reviews.');

    const b = await page.$$(reviewFilterButtons);
    const filterButtonsLength = await page.evaluate(
      (buttons) => Array.from(buttons).length, b
    );

    if (filterButtonsLength < 1) {
      return null;
    }

    const b1 = await page.$$eval(reviewFilterButtons, elements => elements[0].children.length);

    for (let i = 1; i <= 5; i += 1) {
      // Click buttons for each N-star filters.
      await page.$$eval(
        reviewFilterButtons,
        (elements, i) => {
          const button = elements[0].children[i];
          button.click();
          console.log(`Extracting reviews for label '${button.innerText}'.`);
        },
        i
      );

      // Putting this here because of race conditions.
      // TODO: Implement MutationObserver system?
      await delay(1.25 * 1000);

      await updatePageControllerInfo();
      const rr = await getAllReviewsInPage();
      console.log(`Total reviews for filter for page 1:`, rr.length);
      console.log('Extracting reviews for product...');

      let filterButtonTotalReviews = 0;
      let filterButtonTotalPages = 0;

      // Get reviews for each page
      while (!invalidControls) {
        // console.log('currentActivePageNumber', currentActivePageNumber);
        // console.log('hasReachedFirstPage', hasReachedFirstPage);
        // console.log('hasReachedLastPage', hasReachedLastPage);

        // console.log('Extracting reviews for page', currentActivePageNumber, '...');

        const pageReviews = await getAllReviewsInPage();

        masterReviews.byPage[currentActivePageNumber] = pageReviews;
        masterReviews.all.push(...pageReviews);
        pageStatistics.totalReviews += pageReviews.length;
        filterButtonTotalReviews += pageReviews.length;
        filterButtonTotalPages += 1;

        // Go to next page.
        if (hasReachedLastPage) {
          break;
        } else {
          await next();
        }
        // break;
      }

      console.log(`Reviews for filter is:`, filterButtonTotalReviews);
      console.log(`Pages for filter is:`, filterButtonTotalPages);

      // await delay(2 * 1000);
    }

    console.log('Done retrieving reviews for each filter!');
  }

  const skipAllFilterStrategy = !(await canUseAllFilterStrategy());

  if (skipAllFilterStrategy) {
    await nStarButtonsStrategy();
  } else {
    await allFilterStrategy();
  }
  // await nStarButtonsStrategy();
  // Attach page statistics
  // pageStatistics.indexedPages = Array.from(pageStatistics.indexedPages.keys());
  // masterReviews.statistics = pageStatistics;

  return masterReviews;
}

const scrape = async (link, browserWSEndpoint) => {
  // TODO: Should make a pre-check procedure.
  // Check if "outputs" folder exists. If not, create it then put all files into it.
  if (!fs.existsSync(outputFolderString)) {
    fs.mkdirSync(outputFolderString);
  }

  /**
   * Since Shitpee doesn't really like scrapers/crwalers/poor students who are struggling with good time schedules,
   * we are using an exsiting Chrome/Chromium instance through a remote debugging port, which unfortunately requires extra setup.
   */
  const browser = await puppet.connect({
    // headless: false,
    browserWSEndpoint
  });

  // Open a new tab.
  const page = await browser.newPage();

  // Limit requests 
  await page.setRequestInterception(true);

  page.on('request', async (request) => {
    if (request.resourceType() == 'image') {
      await request.abort();
    } else {
      await request.continue();
    }
  });

  // console.log(await browser.userAgent());

  // Make page react to loggable actions
  page.on('console', async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log(await msgArgs[i].jsonValue());
    }
  });

  // Go to link.
  await page.goto(link, { waitUntil: 'networkidle0' });

  // Global state.
  let product = {};

  // TODO: Check whether we are actually inspecting a product page instead of other kinds of pages (e.g. Not Found) (IMPORTANT!!!)

  // Get product basic info
  const productName = await page.evaluate(extractors.productName);

  console.log('--------------------------');
  console.log('Product Name (full):', productName);
  console.log('Product Name (pre-processed):', preprocessName(productName));
  console.log('--------------------------');
  
  const productBasicInfoFilePath = makeProductBasicInfoFilePath(productName);
  const productReviewsFilePath = makeProductReviewsFilePath(productName);

  // Since we are using preprocessed product name as a unique identifier,
  // checking if either the JSON file or the CSV file exists in the outputs folder.
  // If both exist, skip. Otherwise, fetch the missing parts.
  if (!fs.existsSync(productBasicInfoFilePath)) {
    console.log('Product basic info file not found, fetching...');
    await getBasicProductInfo(page, product);
    
    // Export to json and csv for reviews
    const productJSON = JSON.stringify(product, null, 2);

    fs.writeFileSync(productBasicInfoFilePath, productJSON);
    console.log('JSON file written successfully!');
  }

  console.log('productReviewsFilePath', productReviewsFilePath);
  
  if (!fs.existsSync(productReviewsFilePath)) {
    console.log('Product reviews file not found, fetching...');

    // TODO: Again, 4head solution, do not keep in stable releases.
    if (Object.keys(product) < 1) {
      // Since getProductReviews depends on basic product info,
      // and there exists a JSON file of it, load the contents and parse.
      product = JSON.parse(await fs.promises.readFile(productBasicInfoFilePath));
    }

    const productReviews = await getProductReviews(page, product);

    // console.log('product', product);
  
    // await delay(10 * 1000);
    console.log('Total Product Reviews fetched:', productReviews.all.length);

    // Export product reviews to CSV file
    csv.stringify(productReviews?.all ?? [], {
      header: true,
      bom: true,
      columns: columnsMapping.reviews
    }, (err, output) => {
      fs.writeFileSync(productReviewsFilePath, output);
      console.log('CSV file written successfully!');
    });
  }

  
  // Close tab/page
  await page.close();

  // Close browser
  // await browser.close();
}

module.exports = scrape;