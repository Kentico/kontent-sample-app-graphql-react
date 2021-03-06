import get from "lodash.get";
import { Image, Layout, RichText, GraphQLLoader } from "./components";
import { Container, makeStyles, Typography, useTheme } from "@material-ui/core";
import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { assetFields, seoFields, richTextFields } from "./graphQLFragments";
import getSeo from "./utils/getSeo";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(4),
  },
}));

function Post(props) {
  const postPageQuery = gql`
    query PostPageQuery($codename: String!) {
      post(codename: $codename) {
        _seo {
          ...SeoFields
        }
        _system_ {
          type {
            _system_ {
              codename
            }
          }
        }
        image {
          ...AssetFields
        }
        title
        publishingDate
        author {
          firstName
          lastName
        }
        subtitle
        content {
          ...RichTextFields
        }
      }
    }

    ${seoFields}
    ${assetFields}
    ${richTextFields}
  `;

  const [post, setPost] = useState(null);
  const [seo, setSeo] = useState(null);
  const classes = useStyles();
  const theme = useTheme();
  const imageSizes = `${theme.breakpoints.values.md}px`;

  const { loading, error } = useQuery(
    postPageQuery,
    {
      variables: { codename: props.codename },
      onCompleted: (data) => {
        setPost(data.post);
        setSeo(getSeo(data.post._seo));
      },
    },
    [props.codename]
  );

  if (error || loading || !post) {
    return <GraphQLLoader error={error} loading={loading} />;
  }

  return (
    <Layout {...props} seo={seo}>
      <Container className={classes.root} maxWidth="md">
        {get(post, "title", null) && (
          <Typography variant="h1">{get(post, "title", null)}</Typography>
        )}
        {get(post, "subtitle", null) && (
          <Typography variant="subtitle1">
            {get(post, "subtitle", null)}
          </Typography>
        )}

        {get(post, "image", null) && (
          <div>
            <Image
              sizes={imageSizes}
              asset={get(post, "image", null)}
              alt={
                get(post, "image.description") ||
                get(post, "image.name", null)
              }
            />
          </div>
        )}
        <Typography component="div">
          <RichText {...props} richTextElement={get(post, "content", null)} />
        </Typography>

        <footer>
          <time>
            {get(post, "publishingDate", null) &&
              new Date(get(post, "publishingDate", null)).toDateString()}
          </time>
          {get(post, "author", null) &&
            ", by " +
              get(post, "author.firstName", null) +
              " " +
              get(post, "author.lastName", null)}
        </footer>
      </Container>
    </Layout>
  );
}

export default Post;
