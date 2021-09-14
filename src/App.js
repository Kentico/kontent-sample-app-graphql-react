import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import get from 'lodash.get';
import Post from './Post';
import { getUrlSlug } from './utils';
import LandingPage from './LandingPage';
import ListingPage from './ListingPage';
import SimplePage from './SimplePage';
import { UnknownComponent } from './components';
import {
  actionFields,
  assetFields,
  homePageSeoFields,
  navigationSeoFields,
  subpageNavigationItemFields
} from './graphQLFragments';
import GraphQLLoader from './components/GraphQLLoader';
import getSeo from './utils/getSeo';
import {getListingPaginationAndFilter} from './utils/queryString';

export default function App() {
  const homePageQuery = gql`
    query HomePageQuery($codename: String!){
      postCollection{
        items {
          slug,
          _system {
            codename,
            type {
              _system {
                codename
              }
            }
          }
        }
      }
      
      homepage(codename: $codename) {
        content {
          items {
            _system {
              codename
              type {
                _system {
                  codename
                }
              }
            }
          }
        }
        ...HomePageSeoFields
        headerLogo {
          ...AssetFields
        }
        title
        favicon {
          url
        }
        font {
          _system {
            codename
          }
        }
        palette {
          _system {
            codename
          }
        }
        mainMenu(limit: 1) {
          items {
            ... on Menu {
              _system {
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

    ${homePageSeoFields}
    ${navigationSeoFields}
    ${assetFields}
    ${actionFields}
    ${subpageNavigationItemFields}
  `;

  const getNavigationData = (parrentSlug, item) => {
    if(item._system?.type?._system.codename === "post"){
      return {
        slug: parrentSlug.concat([item.slug]),
        navigationType: "post",
        navigationCodename: item._system?.codename,
        contentCodename: item._system?.codename,
        contentType: item._system?.type._system.codename
      }
    }

    return {
      slug: parrentSlug.concat([item.slug]),
      navigationType: "navigationItem",
      navigationCodename: item._system?.codename,
      contentCodename: item.content.items[0]._system.codename,
      contentType: item.content.items[0]._system.type._system.codename
    }
  };

  const homepageCodename = "homepage";

  const getMappings = (data) => {
    const mappings = [{
      slug: [],
      navigationCodename: homepageCodename,
      navigationType: "homepage",
      contentCodename: data.homepage.content.items[0]._system.codename,
      contentType: data.homepage.content.items[0]._system.type._system.codename
    }];

    data.homepage.subpages.items.forEach(item => {
      const navigationData = getNavigationData([], item);
      mappings.push(navigationData);
      mappings.push(...item.subpages.items.map(subItem => getNavigationData(navigationData.slug, subItem)));

      const content = item.content.items[0];
      if(content._system.type._system.codename === "listing_page"){
        const listingData = data[`${content.contentType}Collection`];
        if (!listingData){
          console.error(`Unknown listing page content type: ${content.contentType}`);
        }
        else {
          mappings.push(...listingData.items.map(subItem => getNavigationData(navigationData.slug, subItem)));
        }
      }
    });

    return mappings.reduce((result, item) => {
      result[getUrlSlug(item.slug)] = {
        navigationCodename: item.navigationCodename,
        navigationType: item.navigationType,
        contentCodename: item.contentCodename,
        contentType: item.contentType
      };

      return result;
    },{});
  };

  const getSiteConfiguration = (data) => {
    return {
      asset: get(data, "homepage.headerLogo[0]", null),
      title: get(data, "homepage.title", ""),
      mainMenuActions: get(data, "homepage.mainMenu.items[0].actions.items", []),
      favicon: get(data, "homepage.favicon[0].url", null),
      font: get(data, "homepage.font[0]._system.codename", null),
      palette: get(data, "homepage.palette[0]._system.codename", null)
    };
  };

  const { loading, error } = useQuery(homePageQuery, {
    variables: { codename: homepageCodename },
    onCompleted: (data) => {
      const mappings = getMappings(data);
      const siteConfiguration = getSiteConfiguration(data);

      setMappings(mappings);
      setSiteConfiguration(siteConfiguration);
      setHomepageSeo(getSeo(data.homepage));
    }
  });

  const [mappings, setMappings] = useState(null);
  const [siteConfiguration, setSiteConfiguration] = useState(null);
  const [homepageSeo, setHomepageSeo] = useState(null);

  if(error || loading || !mappings || !siteConfiguration || !homepageSeo) {
    return <GraphQLLoader error={error} loading={loading}/>;
  }

  return (
    <Router>
      <Switch>
        <Route path="/" render={renderPage}/>
      </Switch>
    </Router>
  );

  function renderPage({ location }){
    const navigationItem = mappings[getUrlSlug(location.pathname)];

    if(!navigationItem) {
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

    if(navigationItem.navigationType === "homepage"){
      pageProps["seo"] = homepageSeo;
      pageProps["codename"] = navigationItem.contentCodename;
    }

    switch (navigationItem.contentType) {
      case "landing_page":
        return <LandingPage {...pageProps} codename={pageProps["codename"] || navigationItem.navigationCodename} /> ;
      case "listing_page":
        return <ListingPage {...pageProps} codename={navigationItem.navigationCodename} {...getListingPaginationAndFilter(location)}/>;
      case "simple_page":
        return <SimplePage {...pageProps} codename={pageProps["codename"] || navigationItem.navigationCodename} />;
      case "post":
        return <Post {...pageProps} codename={navigationItem.contentCodename}/>;
      default:
        if (process.env.NODE_ENV === "development") {
          console.error(`Unknown navigation item content type: ${navigationItem.contentType}`);
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


