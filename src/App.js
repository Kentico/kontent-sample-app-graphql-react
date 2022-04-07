import { Router, Switch, Route, useLocation } from "react-router-dom";
import React, { useState } from "react";
import ReactGA from 'react-ga';
import { gql, useQuery } from "@apollo/client";
import get from "lodash.get";
import Post from "./Post";
import { getUrlFromMappingByPathName } from "./utils";
import LandingPage from "./LandingPage";
import ListingPage from "./ListingPage";
import SimplePage from "./SimplePage";
import { UnknownComponent } from "./components";
import {
  actionFields,
  assetFields,
  seoFields,
  subpageNavigationItemFields,
} from "./graphQLFragments";
import GraphQLLoader from "./components/GraphQLLoader";
import getSeo from "./utils/getSeo";
import { getLanguage, getListingPaginationAndFilter } from "./utils/queryString";
import { languages } from './components/LanguageSelector';

export default function App() {
  const homePageQuery = gql`
    query HomePageQuery($codename: String!, $language: String!) {
      post_All {
        items {
          slug
          _system_ {
            codename
            type {
              _system_ {
                codename
              }
            }
          }
        }
      }
      homepage(codename: $codename, languageFilter: {languageCodename: $language}) {
        content {
          ... on LandingPage {
            _system_ {
              codename
              type {
                _system_ {
                  codename
                }
              }
            }
          }
        }
        _seo {
          ...SeoFields
        }
        headerLogo {
          ...AssetFields
        }
        title
        favicon {
          url
        }
        font {
          items {
            _system_ {
              codename
            }
          }
        }
        palette {
          items {
            _system_ {
              codename
            }
          }
        }
        mainMenu {
          ... on Menu {
            _system_ {
              codename
            }
            actions {
              items {
                ... on Action {
                  ...ActionFields
                }
              }
            }
          }
        }
        subpages {
          items {
            ... on NavigationItem {
              ...SubpageNavigationItemFields
              subpages {
                items {
                  ...SubpageNavigationItemFields
                }
              }
            }
          }
        }
      }
    }

    ${seoFields}
    ${assetFields}
    ${actionFields}
    ${subpageNavigationItemFields}
  `;

  const getNavigationData = (parrentSlug, item) => {
    if (item._system_?.type?._system_.codename === "post") {
      return {
        slug: parrentSlug.concat([item.slug]),
        navigationType: "post",
        navigationCodename: item._system_?.codename,
        contentCodename: item._system_?.codename,
        contentType: item._system_?.type._system_.codename,
      };
    }
    return {
      slug: parrentSlug.concat([item.slug]),
      navigationType: "navigationItem",
      navigationCodename: item._system_?.codename,
      contentCodename: item.content._system_.codename,
      contentType: item.content._system_.type._system_.codename,
    };
  };

  const homepageCodename = "homepage";

  const getMappings = (data) => {
    const mappings = [
      {
        slug: [],
        navigationCodename: homepageCodename,
        navigationType: "homepage",
        contentCodename: data.homepage.content._system_.codename,
        contentType: data.homepage.content._system_.type._system_.codename,
      },
    ];

    data.homepage.subpages.items.forEach((item) => {
      const navigationData = getNavigationData([], item);
      mappings.push(navigationData);
      mappings.push(
        ...item.subpages.items.map((subItem) =>
          getNavigationData(navigationData.slug, subItem)
        )
      );

      const content = item.content;
      if (content._system_.type._system_.codename === "listing_page") {
        const listingData = data[`${content.contentType}_All`];
        if (!listingData) {
          console.error(
            `Unknown listing page content type: ${content.contentType}`
          );
        } else {
          mappings.push(
            ...listingData.items.map((subItem) =>
              getNavigationData(navigationData.slug, subItem)
            )
          );
        }
      }
    });

    return mappings.reduce((result, item) => {
      result[[].concat(item.slug).join("/")] = {
        navigationCodename: item.navigationCodename,
        navigationType: item.navigationType,
        contentCodename: item.contentCodename,
        contentType: item.contentType,
      };

      return result;
    }, {});
  };

  const getSiteConfiguration = (data) => {
    return {
      asset: get(data, "homepage.headerLogo", null),
      title: get(data, "homepage.title", ""),
      mainMenuActions: get(
        data,
        "homepage.mainMenu.actions.items",
        []
      ),
      favicon: get(data, "homepage.favicon.url", null),
      font: get(data, "homepage.font.items[0]._system_.codename", null),
      palette: get(data, "homepage.palette.items[0]._system_.codename", null),
    };
  };

  const language = getLanguage(useLocation()) || languages[0].codename;

  const { loading, error, fetchMore } = useQuery(homePageQuery, {
    variables: { codename: homepageCodename, language: language },
    onCompleted: async (data) => {
      const mappings = getMappings(data);
      const siteConfiguration = getSiteConfiguration(data);

      setSiteConfiguration(siteConfiguration);
      setHomepageSeo(getSeo(data.homepage._seo));

      await fetchMore({
        variables: { codename: homepageCodename, language: languages.find(lang => lang.codename !== language).codename},
        updateQuery: (_, fetchMoreResult) => {
          setMappings({...getMappings(fetchMoreResult.fetchMoreResult), ...mappings});
        }
      });
    },
  });

  const [mappings, setMappings] = useState(null);
  const [siteConfiguration, setSiteConfiguration] = useState(null);
  const [homepageSeo, setHomepageSeo] = useState(null);

  if (error || loading || !mappings || !siteConfiguration || !homepageSeo) {
    return <GraphQLLoader error={error} loading={loading} />;
  }

  return (
    <Switch>
      <Route path="/" render={renderPage} />
    </Switch>
  );

  function renderPage({ location }) {
    const navigationItem = getUrlFromMappingByPathName(mappings, location.pathname);

    if (!navigationItem) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Unknown navigation item pathname: ${location.pathname}`);
        return (
          <div>
            <h2>Not found</h2>
            <pre>{JSON.stringify(mappings, undefined, 2)}</pre>
          </div>
        );
      }
      return <h2>Not found</h2>;
    }

    const pageProps = {
      siteConfiguration,
      mappings,
    };

    if (navigationItem.navigationType === "homepage") {
      pageProps["seo"] = homepageSeo;
      pageProps["codename"] = navigationItem.contentCodename;
    }

    switch (navigationItem.contentType) {
      case "landing_page":
        return (
          <LandingPage
            {...pageProps}
            codename={
              pageProps["codename"] || navigationItem.navigationCodename
            }
          />
        );
      case "listing_page":
        return (
          <ListingPage
            {...pageProps}
            codename={navigationItem.navigationCodename}
            {...getListingPaginationAndFilter(location)}
          />
        );
      case "simple_page":
        return (
          <SimplePage
            {...pageProps}
            codename={
              pageProps["codename"] || navigationItem.navigationCodename
            }
          />
        );
      case "post":
        return (
          <Post {...pageProps} codename={navigationItem.contentCodename} />
        );
      default:
        if (process.env.NODE_ENV === "development") {
          console.error(
            `Unknown navigation item content type: ${navigationItem.contentType}`
          );
          return (
            <UnknownComponent>
              <pre>{JSON.stringify(mappings, undefined, 2)}</pre>
            </UnknownComponent>
          );
        }
        return null;
    }
  }
}
