import React from "react";

export const Docs = () => {
  return (
    <div>
      <h1 className="text-3xl">Documentation</h1>
      <div className="mt-4 flex flex-col gap-4 px-3">
        {sections.map((section) => (
          <DocSection title={section.title}>{section.content}</DocSection>
        ))}
      </div>
    </div>
  );
};

const DocSection = ({ title, children }) => (
  <div>
    <h2 className="text-2xl font-bold my-2">{title}</h2>
    <p>{children}</p>
  </div>
);

const sections = [
  {
    title: "How to create or edit a scraper",
    content: (
      <ul className="list-disc">
        <li className="my-2">
          To create a scraper, you need to make sure the page is connected to
          the backend, for that, you can check if the green button on the top of
          the sidebar is enabled. If you are not connected to the backend, it
          could be for different reasons: The first one is that the backend is
          stopped, in which case you should notify Gonzalo. Otherwise, it is
          probably because you don't have mixed content enabled in your browser.
          Because the backend currenly accepts only http requests, you will need
          to enabled mixed content in your browser. To do that, you can click on
          the lock icon on the left of the URL bar, and then click on site
          settings. In the site settings, you will need to enable mixed content.
          After that, you should be able to create a scraper. Other reason for
          the server to be blocked is that it is currently scraping all the
          products, in which case, you will have to wait until the scraping is
          done. The scheduled times at where this process begins are: hour: [6,
          12, 18, 0], minute: 0
        </li>
        <li>
          Once you have done this, you can start creating a scraper. Navigate to
          the URL of the product in a incognito window. If you access from your
          account, it is likely that you will skip some events in the page, such
          as the appearance of a cookie banner. The incognito window must be in
          full screen mode, since all the scrapers will be run in full-screen to
          avoid elements changing due to responsiveness. You can open the
          terminal in the browser, and make sure that the terminal is open in a
          separate window, so that it doesnt affect the size of the window. You
          can do that by cliking on the three dots on the top right of the
          inspector tab, and then click on "undock into separate window".
        </li>
        <li className="my-2">
          Now you have the browser in the optimal settings, you can start
          selecting the xpath of the elements that need to be clicked, or
          selected in order to get the price of a product.
        </li>
        <li className="my-2">
          When the scraper has been configured correctly, you will get the
          scraped price on your screen. At that point, you can save the product,
          and next time all products are scraped, the new price will be updated.
          If you have done a quick fix, and you want to have the new price be
          pushed to the giergigroeien page as soon as possible, you can edit the
          price of the product manually to match the correct price, and then, on
          the scrape and push tab, press push to wordpress.
        </li>
      </ul>
    ),
  },
  {
    title: "Exceptions",
    content: (
      <ul className="list-disc">
        <li className="my-2">
          <h1 className="font-bold">The price contains also the decimals</h1>
          <p>
            If you are trying to grab the price of an element, but when you
            select the numeral part of the digit you get the decimals attached
            to that number, go deeper in the page html until you get to the
            actual text, and then, select that xpath instead of that of the
            parent element.
          </p>
        </li>
        <li className="my-2">
          <h1 className="font-bold">
            The price update is delayed after selecting or clicking on page
            option
          </h1>
          <p>Add a "Wait" action before selecting the product price</p>
        </li>
        <li className="my-2">
          <h1 className="font-bold">The price is not updating</h1>
          <p>If you have tried and nothing worked, contact Gonzalo</p>
        </li>
      </ul>
    ),
  },
];
