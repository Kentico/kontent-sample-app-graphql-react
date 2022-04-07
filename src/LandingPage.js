import get from "lodash.get";
import upperFirst from "lodash.upperfirst";
import camelCase from "lodash.camelcase";
import { Layout, UnknownComponent, GraphQLLoader } from "./components";
import * as sections from "./components/sections";
import { Box, makeStyles } from "@material-ui/core";
import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { richTextFields, seoFields } from "./graphQLFragments";
import getSeo from "./utils/getSeo";
import { useLocation } from 'react-router-dom';
import { getLanguage } from './utils/queryString';
import { languages } from './components/LanguageSelector';

const useStyles = makeStyles((theme) => ({
  sections: {
    "& > section:first-child": {
      paddingTop: theme.spacing(8),
      paddingBottom: theme.spacing(8),
    },
  },
}));

function LandingPage(props) {
  const landingPageFields = gql`
    fragment LandingPageFields on LandingPage {
      sections {
        items {
          # https://github.com/apollographql/apollo-client/issues/7648#issuecomment-968969367
          ... on CtaSection {
            _system_ {
              codename
              language {
                _system_ {
                  codename
                }
              }
              type {
                _system_ {
                  codename
                }
              }
            }
          }
          ... on FeaturesSection {
            _system_ {
              codename
              language {
                _system_ {
                  codename
                }
              }
              type {
                _system_ {
                  codename
                }
              }
            }
          }
          ... on ContactSection {
            _system_ {
              codename
              language {
                _system_ {
                  codename
                }
              }
              type {
                _system_ {
                  codename
                }
              }
            }
          }
          ... on HeroSection {
            _system_ {
              codename
              language {
                _system_ {
                  codename
                }
              }
              type {
                _system_ {
                  codename
                }
              }
            }
          }
          ... on ContentSection {
            _system_ {
              codename
              language {
                _system_ {
                  codename
                }
              }
              type {
                _system_ {
                  codename
                }
              }
            }
          }
          ... on ListingSection {
            _system_ {
              codename
              language {
                _system_ {
                  codename
                }
              }
              type {
                _system_ {
                  codename
                }
              }
            }
            title
            subtitle {
              ...RichTextFields
            }
            orderBy
            contentType
            numberOfItems
          }
        }
      }
    }

    ${richTextFields}
  `;

  const landingPageQuery = gql`
    query LandingPageQuery($codename: String!, $language: String!) {
      landingPage(codename: $codename, languageFilter: {languageCodename: $language}) {
        ...LandingPageFields
      }
    }
    ${landingPageFields}
  `;

  const navigationAndLandingPageQuery = gql`
    query NavigationAndLandingPageQuery($codename: String!, $language: String!) {
      navigationItem(codename: $codename, languageFilter: {languageCodename: $language}) {
        _seo {
          ...SeoFields
        }
        content {
          ... on LandingPage {
            ...LandingPageFields
          }
        }
      }
    }
    ${landingPageFields}
    ${seoFields}
  `;

  const classes = useStyles();

  const [sectionItems, setSectionItems] = useState(null);
  const [seo, setSeo] = useState({});
    const language = getLanguage(useLocation()) || languages[0].codename;

  const { loading, error } = useQuery(
    props.seo ? landingPageQuery : navigationAndLandingPageQuery,
    {
      variables: { codename: props.codename, language: language},
      onCompleted: (data) => {
        if (props.seo) {
          setSectionItems(data.landingPage.sections.items);
          setSeo(props.seo);
        } else {
          setSectionItems(data.navigationItem.content.sections.items);
          setSeo(getSeo(data.navigationItem._seo));
        }
      },
    },
    [props.codename, props.seo]
  );

  if (error || loading || !sectionItems) {
    return <GraphQLLoader error={error} loading={loading} />;
  }

  return (
    <Layout {...props} seo={seo}>
      <Box className={classes.sections}>
        {sectionItems.map((section, index) => {
          const contentType = upperFirst(
            camelCase(get(section, "_system_.type._system_.codename", null))
          );
          const Component = sections[contentType];

          if (process.env.NODE_ENV === "development" && !Component) {
            console.error(
              `Unknown section component for section content type: ${contentType}`
            );
            return (
              <UnknownComponent key={index} {...props}>
                <pre>{JSON.stringify(section, undefined, 2)}</pre>
              </UnknownComponent>
            );
          }

          return (
            <Component
              key={index}
              {...props}
              section={section}
              site={props}
            />
          );
        })}
      </Box>
    </Layout>
  );
}

export default LandingPage;
