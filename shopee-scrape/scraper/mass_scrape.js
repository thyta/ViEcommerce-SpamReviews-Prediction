const scrape = require('./scrape');

(async () => {
  const urls = [
    // 0. Short reviews product
    'https://shopee.vn/Kem-Ch%E1%BB%91ng-n%E1%BA%AFng-Heliocare-Water-Gel-SPF-50-i.392115671.8762920587?sp_atk=55138e95-9eeb-42de-ba35-0d546b6db06f&xptdk=55138e95-9eeb-42de-ba35-0d546b6db06f',
    
    // 1. Long reviews product
    'https://shopee.vn/-Cosrx-official-kem-ch%E1%BB%91ng-n%E1%BA%AFng-Cosrx-d%C6%B0%E1%BB%A1ng-da-vitamin-e-spf-50-(50ml)-i.457209160.21617531614?sp_atk=a3ca7067-e036-4cbf-b97d-bdaa85626dc2&xptdk=a3ca7067-e036-4cbf-b97d-bdaa85626dc2',

    // 2. Even Longer!
    'https://shopee.vn/Gel-r%E1%BB%ADa-m%E1%BA%B7t-Cosrx-Good-Morning-150ml-50ml-chi%E1%BA%BFt-xu%E1%BA%A5t-tr%C3%A0-xanh-%C4%91%E1%BB%99-ph-th%E1%BA%A5p-i.457209160.14315640722?sp_atk=c13f0088-b3a6-4023-8477-2ceccc43b573&xptdk=c13f0088-b3a6-4023-8477-2ceccc43b573',

    // 3. HDD-1 --- 3k reviews
    'https://shopee.vn/%E1%BB%94-C%E1%BB%A9ng-HDD-cho-PC-CAMERA-3.5inch-500GB-1TB-2TB-Western-Seagate-H%C3%A0ng-th%C3%A1o-m%C3%A1y-BH-01-th%C3%A1ng-!!!-i.134078428.2313710786?sp_atk=77f61721-a603-41d5-bb30-a976074060a4&xptdk=77f61721-a603-41d5-bb30-a976074060a4',

    // 4. HDD-2 -- 1.2k reviews
    "https://shopee.vn/%E1%BB%94-HDD-2.5''-LAPTOP-B%C3%93C-M%C3%81Y-250G-320G-500G-1T-v%C3%A0-BOX-new-%C4%90%C3%83-TEST-OK-H%E1%BB%97-Tr%E1%BB%A3-c%C3%A0i-win-theo-y%C3%AAu-c%E1%BA%A7u-i.148904091.7755187957",

    // 5. No Reviews
    'https://shopee.vn/%E1%BB%90p-D%E1%BA%BBo-Silicon-Cao-C%E1%BA%A5p-cho-HTC-M8-si%C3%AAu-b%E1%BB%81n-i.180268243.4907594353?sp_atk=8fdd2928-ee60-41c6-bf13-3e2e475b41f5&xptdk=8fdd2928-ee60-41c6-bf13-3e2e475b41f5',

    // 6. <50 reviews
    'https://shopee.vn/H%E1%BB%99p-%C4%90%E1%BB%B1ng-%E1%BB%94-C%E1%BB%A9ng-Di-%C4%90%E1%BB%99ng-HDD-Box-2.5-ORICO-2139C3-G2-USB3.1-Gen2-Type-C-2.5-Nh%E1%BB%B1a-Trong-Su%E1%BB%91t-H%C3%A0ng-Ch%C3%ADnh-H%C3%A3ng-i.84958111.2591712158?sp_atk=e9a69260-97ff-4959-9e5d-d80717646f1d&xptdk=e9a69260-97ff-4959-9e5d-d80717646f1d',

    // 7. ~300 reviews
    'https://shopee.vn/%E1%BB%94-c%E1%BB%A9ng-Walram-Sata3-Ssd-60gb-128gb-240gb-120gb-256gb-480gb-512gb-720gb-HDD-2.5--i.451685997.9664761935?sp_atk=905ca65d-957b-437d-9fab-45adb6c76e44&xptdk=905ca65d-957b-437d-9fab-45adb6c76e44',

    'https://shopee.vn/D%E1%BA%A7u-g%E1%BB%99i-ch%E1%BB%91ng-g%C3%A0u-s%E1%BA%A1ch-n%E1%BA%A5m-Selsun-250ml-i.59597911.14063842117?sp_atk=ba455ce9-4667-45bd-9090-9a87b61185b6&xptdk=ba455ce9-4667-45bd-9090-9a87b61185b6',
  ];

  try {
    await scrape(urls[8]);
  } catch (error) {
    console.error(error);
  }
})();
