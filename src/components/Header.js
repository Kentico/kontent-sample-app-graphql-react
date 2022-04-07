import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { Action, Image, Link, SideDrawer } from ".";
import { Container, Hidden } from "@material-ui/core";
import LanguageSelector from './LanguageSelector';


const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  logo: {
    width: "200px",
  },
  mainMenu: {
    flexGrow: 1,
    display: "flex",
    justifyContent: "flex-end",
    "& a": {
      margin: theme.spacing(1),
    }
  }
}));

function Header({ asset, title, mainMenuActions }) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar color="transparent" position="sticky">
        <Container>
          <Toolbar>
            <Link href='/' className={classes.logo}>
              {asset
                ? <Image
                   asset={asset}
                   src={asset.url}
                   alt={title}
                   width="200"
                   height="60"
                  />
                : <Typography variant="h6">{title}</Typography>
              }
            </Link>
            <Hidden smDown>
              <div className={classes.mainMenu}>
                {mainMenuActions.map((navigationItem, index) =>
                    <Action key={index} action={navigationItem} />)}
                <LanguageSelector/>
              </div>
            </Hidden>
            <Hidden mdUp>
              <div className={classes.mainMenu}>
                <SideDrawer navLinks={mainMenuActions}/>
              </div>
            </Hidden>
          </Toolbar>
        </Container>
      </AppBar>
    </div >
  );
}

export default Header;
