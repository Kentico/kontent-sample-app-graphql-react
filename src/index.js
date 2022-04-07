import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import App from './App';
import { createBrowserHistory } from 'history';
import { HelmetProvider } from 'react-helmet-async';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { name, version } from "../package.json";

const PREVIEW_API_KEY = process.env.REACT_APP_KONTENT_PREVIEW_API_KEY;
const GQL_ENDPOINT = process.env.REACT_APP_KONTENT_GRAPHQL_ENDPOINT ||
    (PREVIEW_API_KEY ? "https://preview-graphql.kontent.ai" : "https://graphql.kontent.ai");
const PROJECT_ID = process.env.REACT_APP_KONTENT_PROJECT_ID || "ad25961e-f934-01dc-e1fa-f4dd41b84df2";
const GA_TOKEN = process.env.REACT_APP_GA_ANALYTICS_TOKEN;

const authorizationHeader = PREVIEW_API_KEY ? {
    'Authorization': `Bearer ${PREVIEW_API_KEY}`
} : {};

const client = new ApolloClient({
    cache: new InMemoryCache({
        // https://github.com/apollographql/apollo-client/issues/7648#issuecomment-968969367
        // possibleTypes: {
        //     _Item: [
        //         "LandingPage",
        //         "ListingPage",
        //         "SimplePage"
        //     ]
        // }
    }),
    uri: `${GQL_ENDPOINT}/${PROJECT_ID}`,
    headers: Object.assign({
        'X-KC-SOURCE': `${name};${version}`
    }, authorizationHeader)
});

const history = createBrowserHistory();

if (GA_TOKEN) {
    ReactGA.initialize(GA_TOKEN);
    history.listen(location => {
        ReactGA.set({ page: location.pathname });
        ReactGA.pageview(location.pathname);
    });
}

ReactDOM.render(
    <React.StrictMode>
        <HelmetProvider>
            <ApolloProvider client={client}>
                <Router history={history} basename={process.env.PUBLIC_URL}>
                    <App />
                </Router>
            </ApolloProvider>
        </HelmetProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
