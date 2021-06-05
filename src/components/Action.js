import get from "lodash.get";
import { Button } from "@material-ui/core";
import { Link, Icon } from ".";
import { useLocation } from 'react-router-dom';

function Action(props) {
  const search = useLocation().search;

  const getHrefFromUrlSlugAndPreserveQueryString = (navigationItem) => {
    return `${get(navigationItem, "slug")}${search}`
  }

  const { action, size } = props;
  const navigationItem = get(action, "navigationItem.items[0]", null);
  const href = navigationItem.system.type.codename === "external_url" ?
               get(navigationItem, "url") : getHrefFromUrlSlugAndPreserveQueryString(navigationItem);
  const action_options = get(action, "options", []);


  const role = get(action, "role[0].system.codename", null);
  const outlined = action_options.some(item => item.system.codename === "outlined");
  const config = {};
  if (role) {
    config.variant = "contained";
    config.color = role;
  }
  if (outlined) {
    config.variant = "outlined";
  }

  const new_window = action_options.some(item => item.system.codename === "new_window");
  const no_follow = action_options.some(item => item.system.codename === "no_follow");
  const icon = get(action, "icon.items[0]", null);
  const iconPosition = get(icon, "iconPosition[0].system.codename", null);
  const options = {
    target: new_window ? "_blank" : undefined,
    rel: new_window || no_follow
      ? `${new_window ? "noopener" : ""} ${no_follow ? "nofollow" : ""}`
      : undefined,
  };

  return (
    <Button
      component={Link}
      startIcon={iconPosition && iconPosition === "left" && <Icon icon={icon} />}
      endIcon={iconPosition && iconPosition === "right" && <Icon icon={icon} />}
      underline="none"
      size={size}
      href={href}
      {...config}
      {...options}>
      {action.label}
    </Button>
  );
}

export default Action;
