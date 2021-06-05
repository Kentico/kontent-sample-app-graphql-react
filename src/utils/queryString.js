const pageSize = 3;
const authorQueryStringKey = "author";
const languageQueryStringKey = "lang";
const pageQueryStringKey = "page";

const setPageAndReturnQueryString = (page, urlParams) => {
  urlParams.set(pageQueryStringKey, page > 0 ? page : 1);

  return `?${urlParams}`;
}

export const getListingPaginationAndFilter = (location) => {
  const urlParams = new URLSearchParams(location.search);
  const authorQuery = urlParams.get(authorQueryStringKey);
  const pageQuery = urlParams.get(pageQueryStringKey);
  let pageNumber = parseInt(pageQuery);

  pageNumber = pageNumber > 0 ? pageNumber : 1;

  return {
    author: authorQuery,
    nextPage: `${location.pathname}${setPageAndReturnQueryString(pageNumber + 1, urlParams)}`,
    prevPage: `${location.pathname}${setPageAndReturnQueryString(pageNumber - 1, urlParams)}`,
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize
  }
};

export const setAuthor = (location, author) => setParameter(location, authorQueryStringKey, author);

export const getAuthor = (location) => getParameter(location, authorQueryStringKey);

export const setLanguage = (location, language) => setParameter(location, languageQueryStringKey, language);

export const getLanguage = (location) => getParameter(location, languageQueryStringKey);

const getParameter = (location, key) => {
  const urlParams = new URLSearchParams(location.search);

  return urlParams.get(key) || "";
};

const setParameter = (location, key, value) => {
  const urlParams = new URLSearchParams(location.search);

  if(!value){
    urlParams.delete(key);
  }
  else{
    urlParams.set(key, value);
  }

  return {
    pathname: location.pathname,
    search: `?${urlParams}`
  };
}
