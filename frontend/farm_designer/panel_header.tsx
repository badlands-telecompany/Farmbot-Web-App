import * as React from "react";
import { getPathArray } from "../history";
import { Link } from "../link";
import { t } from "../i18next_wrapper";
import { DevSettings } from "../account/dev/dev_support";
import { getWebAppConfigValue } from "../config_storage/actions";
import { store } from "../redux/store";
import { BooleanSetting } from "../session_keys";
import {
  getFwHardwareValue, hasSensors,
} from "../devices/components/firmware_hardware_support";
import { getFbosConfig } from "../resources/getters";

export enum Panel {
  Map = "Map",
  Plants = "Plants",
  Groups = "Groups",
  SavedGardens = "SavedGardens",
  FarmEvents = "FarmEvents",
  Zones = "Zones",
  Points = "Points",
  Weeds = "Weeds",
  Controls = "Controls",
  Sensors = "Sensors",
  Photos = "Photos",
  Farmware = "Farmware",
  Tools = "Tools",
  Settings = "Settings",
}

type Tabs = keyof typeof Panel;

export enum PanelColor {
  green = "green",
  cyan = "cyan",
  brown = "brown",
  magenta = "magenta",
  gray = "gray",
  lightGray = "light-gray",
  yellow = "yellow",
  blue = "blue",
  navy = "navy",
  teal = "teal",
  red = "red",
}

export const TAB_COLOR: { [key in Panel]: PanelColor } = {
  [Panel.Map]: PanelColor.gray,
  [Panel.Plants]: PanelColor.green,
  [Panel.Groups]: PanelColor.blue,
  [Panel.SavedGardens]: PanelColor.navy,
  [Panel.FarmEvents]: PanelColor.yellow,
  [Panel.Zones]: PanelColor.brown,
  [Panel.Points]: PanelColor.teal,
  [Panel.Weeds]: PanelColor.red,
  [Panel.Controls]: PanelColor.gray,
  [Panel.Sensors]: PanelColor.gray,
  [Panel.Photos]: PanelColor.gray,
  [Panel.Farmware]: PanelColor.gray,
  [Panel.Tools]: PanelColor.gray,
  [Panel.Settings]: PanelColor.gray,
};

export enum Icon {
  map = "map",
  plant = "plant",
  groups = "groups",
  gardens = "gardens",
  calendar = "calendar",
  zones = "zones",
  point = "point",
  weeds = "weeds",
  controls = "controls",
  sensors = "sensors",
  photos = "photos",
  farmware = "farmware",
  tool = "tool",
  settings = "settings",
}

export const iconFile = (icon: Icon) => `/app-resources/img/icons/${icon}.svg`;

export const TAB_ICON: { [key in Panel]: string } = {
  [Panel.Map]: iconFile(Icon.map),
  [Panel.Plants]: iconFile(Icon.plant),
  [Panel.Groups]: iconFile(Icon.groups),
  [Panel.SavedGardens]: iconFile(Icon.gardens),
  [Panel.FarmEvents]: iconFile(Icon.calendar),
  [Panel.Zones]: iconFile(Icon.zones),
  [Panel.Points]: iconFile(Icon.point),
  [Panel.Weeds]: iconFile(Icon.weeds),
  [Panel.Controls]: iconFile(Icon.controls),
  [Panel.Sensors]: iconFile(Icon.sensors),
  [Panel.Photos]: iconFile(Icon.photos),
  [Panel.Farmware]: iconFile(Icon.farmware),
  [Panel.Tools]: iconFile(Icon.tool),
  [Panel.Settings]: iconFile(Icon.settings),
};

const getCurrentTab = (): Tabs => {
  const pathArray = getPathArray();
  if (pathArray.join("/") === "/app/designer") {
    return Panel.Map;
  } else if (pathArray.includes("groups")) {
    return Panel.Groups;
  } else if (pathArray.includes("gardens")) {
    return Panel.SavedGardens;
  } else if (pathArray.includes("events")) {
    return Panel.FarmEvents;
  } else if (pathArray.includes("zones")) {
    return Panel.Zones;
  } else if (pathArray.includes("points")) {
    return Panel.Points;
  } else if (pathArray.includes("weeds")) {
    return Panel.Weeds;
  } else if (pathArray.includes("controls")) {
    return Panel.Controls;
  } else if (pathArray.includes("sensors")) {
    return Panel.Sensors;
  } else if (pathArray.includes("photos")) {
    return Panel.Photos;
  } else if (pathArray.includes("farmware")) {
    return Panel.Farmware;
  } else if (pathArray.includes("tools")) {
    return Panel.Tools;
  } else if (pathArray.includes("settings")) {
    return Panel.Settings;
  } else {
    return Panel.Plants;
  }
};

const common = { width: 30, height: 30 };

interface NavTabProps {
  panel: Panel;
  linkTo: string;
  title: string;
  desktopHide?: boolean;
}

const NavTab = (props: NavTabProps) =>
  <Link to={props.linkTo} style={{ flex: 0.3 }}
    className={[
      getCurrentTab() === props.panel ? "active" : "",
      props.desktopHide ? "desktop-hide" : "",
    ].join(" ")}>
    {<img {...common} src={TAB_ICON[props.panel]} title={props.title} />}
  </Link>;

const displayScrollIndicator = () => {
  const element = document.getElementsByClassName("panel-tabs")[1];
  const mobile = element?.scrollWidth < 430;
  const end = element?.scrollWidth - element?.scrollLeft == element?.clientWidth;
  return mobile && !end;
};

const showSensors = () => {
  const getWebAppConfigVal = getWebAppConfigValue(store.getState);
  const firmwareHardware = getFwHardwareValue(getFbosConfig(
    store.getState().resources.index));
  return !getWebAppConfigVal(BooleanSetting.hide_sensors)
    && hasSensors(firmwareHardware);
};

export function DesignerNavTabs(props: { hidden?: boolean }) {
  const tab = getCurrentTab();
  const hidden = props.hidden ? "hidden" : "";
  return <div className={`panel-nav ${TAB_COLOR[tab]}-panel ${hidden}`}>
    {displayScrollIndicator() && <div className={"scroll-indicator"} />}
    <div className="panel-tabs">
      <NavTab panel={Panel.Map}
        linkTo={"/app/designer"}
        title={t("Map")} desktopHide={true} />
      <NavTab
        panel={Panel.Plants}
        linkTo={"/app/designer/plants"}
        title={t("Plants")} />
      <NavTab
        panel={Panel.Groups}
        linkTo={"/app/designer/groups"}
        title={t("Groups")} />
      <NavTab
        panel={Panel.SavedGardens}
        linkTo={"/app/designer/gardens"}
        title={t("Gardens")} />
      <NavTab
        panel={Panel.FarmEvents}
        linkTo={"/app/designer/events"}
        title={t("Events")} />
      {DevSettings.futureFeaturesEnabled() &&
        <NavTab
          panel={Panel.Zones}
          linkTo={"/app/designer/zones"}
          title={t("Zones")} />}
      <NavTab
        panel={Panel.Points}
        linkTo={"/app/designer/points"}
        title={t("Points")} />
      <NavTab
        panel={Panel.Weeds}
        linkTo={"/app/designer/weeds"}
        title={t("Weeds")} />
      <NavTab
        panel={Panel.Controls}
        linkTo={"/app/designer/controls"}
        title={t("Controls")} />
      {showSensors() &&
        <NavTab
          panel={Panel.Sensors}
          linkTo={"/app/designer/sensors"}
          title={t("Sensors")} />}
      <NavTab
        panel={Panel.Photos}
        linkTo={"/app/designer/photos"}
        title={t("Photos")} />
      <NavTab
        panel={Panel.Farmware}
        linkTo={"/app/designer/farmware"}
        title={t("Farmware")} />
      <NavTab
        panel={Panel.Tools}
        linkTo={"/app/designer/tools"}
        title={t("Tools")} />
      <NavTab
        panel={Panel.Settings}
        linkTo={"/app/designer/settings"}
        title={t("Settings")} />
    </div>
  </div>;
}
