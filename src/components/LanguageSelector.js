import React from "react";
import MuiSelect from "@material-ui/core/Select";
import { useHistory } from 'react-router-dom';
import { makeStyles, MenuItem } from '@material-ui/core';
import { getLanguage, setLanguage } from '../utils/queryString';

const useStyles = makeStyles((theme) => ({
  selectLanguage: {
    clear: 'both',
    borderBottom: 'none'
  },
}));

export const languages = [{
        name: "EN",
        codename: "default"
    },
    {
        name: "CZ",
        codename: "cz"
    }
];

function LanguageSelector() {
  const history = useHistory();
  const classes = useStyles();
  const handleClick = ({target}) => {
    history.push(setLanguage(history.location, target.value));
  }
  return (
    <MuiSelect
        value={getLanguage(history.location)}
        onChange={handleClick}
        className={classes.selectLanguage}
        displayEmpty
        renderValue={value => !value ? <em>{languages[0].name}</em> : languages.find(language => language.codename === value).name}
    >
      {languages.map((language, index) => <MenuItem key={`languageSelectorItem${index}`} value={language.codename}>{language.name}</MenuItem>)}
    </MuiSelect>
  );
}

export default LanguageSelector;
