import get from "lodash.get";
import { Image, Layout, RichText, GraphQLLoader } from "./components";
import { Container, makeStyles, Typography, useTheme } from "@material-ui/core";
import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import {
  assetFields,
  seoFields,
  richTextFields,
} from "./graphQLFragments";
import getSeo from "./utils/getSeo";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(4),
  },
}));

function SimplePage(props) {
  const simplePageFields = gql`
    fragment SimplePageFields on SimplePage {
      content {
        ...RichTextFields
      }
      image {
        ...AssetFields
      }
      subtitle
      title
    }
  `;

  const simplePageQuery = gql`
    query SimplePageQuery($codename: String!) {
      simplePage(codename: $codename) {
        ...SimplePageFields
      }
    }

    ${simplePageFields}
    ${assetFields}
    ${richTextFields}
  `;

  const navigationAndSimplePageQuery = gql`
    query NavigationAndSimplePageQuery($codename: String!) {
      navigationItem(codename: $codename) {
        _seo {
          ...SeoFields
        }
        content {
          ... on SimplePage {
            ...SimplePageFields
          }
        }
      }
    }

    ${simplePageFields}
    ${assetFields}
    ${richTextFields}
    ${seoFields}
  `;

  const classes = useStyles();
  const theme = useTheme();
  const imageSizes = `${theme.breakpoints.values.md}px`;

  const [page, setPage] = useState(null);
  const [seo, setSeo] = useState({});

  const { loading, error } = useQuery(
    props.seo ? simplePageQuery : navigationAndSimplePageQuery,
    {
      variables: { codename: props.codename },
      onCompleted: (data) => {
        if (props._seo) {
          setPage(data.simplePage);
          setSeo(props.seo);
        } else {
          setPage(data.navigationItem.content);
          setSeo(getSeo(data.navigationItem.seo));
        }
      },
    },
    [props.codename, props.seo]
  );

  if (error || loading || !page) {
    return <GraphQLLoader error={error} loading={loading} />;
  }

  return (
    <Layout {...props} seo={seo}>
      <Container className={classes.root} maxWidth="md">
        {get(page, "title", null) && (
          <Typography variant="h1">{get(page, "title", null)}</Typography>
        )}
        {get(page, "subtitle", null) && (
          <Typography variant="subtitle1">{get(page, "subtitle")}</Typography>
        )}

        {get(page, "image", null) && (
          <div>
            <Image
              sizes={imageSizes}
              asset={get(page, "image", null)}
              alt={
                get(page, "image.description") ||
                get(page, "image.name", null)
              }
            />
          </div>
        )}
        <Typography component="div">
          <RichText
            richTextElement={get(page, "content", null)}
            mappings={props.mappings}
          />
        </Typography>
      </Container>
    </Layout>
  );
}

export default SimplePage;
