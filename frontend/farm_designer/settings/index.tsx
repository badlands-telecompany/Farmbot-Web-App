import * as React from "react";
import { connect } from "react-redux";
import {
  DesignerPanel, DesignerPanelContent, DesignerPanelTop,
} from "../designer_panel";
import { t } from "../../i18next_wrapper";
import { DesignerNavTabs, Panel } from "../panel_header";
import {
  bulkToggleControlPanel, MCUFactoryReset,
} from "../../devices/actions";
import { FarmBotSettings, Firmware, PowerAndReset } from "./fbos_settings";
import {
  AxisSettings, Motors, EncodersOrStallDetection, LimitSwitches, ErrorHandling,
  PinGuard, ParameterManagement, PinBindings, isFwHardwareValue,
} from "./hardware_settings";
import { maybeOpenPanel } from "../../devices/components/maybe_highlight";
import { isBotOnlineFromState } from "../../devices/must_be_online";
import { DesignerSettingsProps } from "./interfaces";
import { Designer } from "./farm_designer_settings";
import { SearchField } from "../../ui/search_field";
import { mapStateToProps } from "./state_to_props";
import { Actions } from "../../constants";
import { ExtraSettings } from "../map/easter_eggs/bugs";
import { ControlPanelState } from "../../devices/interfaces";
import { OtherSettings } from "./other_settings";

interface ToggleSettingsOpenProps {
  dispatch: Function;
  panels: ControlPanelState;
}

class ToggleSettingsOpen extends React.Component<ToggleSettingsOpenProps> {

  get open() {
    return Object.values(this.props.panels)
      .filter((open: boolean) => open)
      .length > 0;
  }

  render() {
    return <a><button className="fb-button gray"
      title={t("toggle settings open")}
      onClick={() =>
        this.props.dispatch(bulkToggleControlPanel(!this.open))}>
      <i className={`fa fa-chevron-${!this.open ? "right" : "down"}`} />
    </button></a>;
  }
}

export class RawDesignerSettings
  extends React.Component<DesignerSettingsProps, {}> {

  componentDidMount = () => this.props.dispatch(maybeOpenPanel());

  componentWillUnmount = () => {
    this.props.dispatch({
      type: Actions.SET_SETTINGS_SEARCH_TERM,
      payload: ""
    });
  }

  render() {
    const { getConfigValue, dispatch, firmwareConfig,
      sourceFwConfig, sourceFbosConfig, resources,
    } = this.props;
    const { controlPanelState } = this.props.bot;
    const commonProps = { dispatch, controlPanelState };
    const { value } = this.props.sourceFbosConfig("firmware_hardware");
    const firmwareHardware = isFwHardwareValue(value) ? value : undefined;
    const botOnline = isBotOnlineFromState(this.props.bot);
    const { busy } = this.props.bot.hardware.informational_settings;
    return <DesignerPanel panelName={"settings"} panel={Panel.Settings}>
      <DesignerNavTabs />
      <DesignerPanelTop panel={Panel.Settings} withButton={true}>
        <SearchField
          placeholder={t("Search settings...")}
          searchTerm={this.props.searchTerm}
          onChange={searchTerm => {
            dispatch(bulkToggleControlPanel(searchTerm != ""));
            dispatch({
              type: Actions.SET_SETTINGS_SEARCH_TERM,
              payload: searchTerm
            });
          }} />
        <ToggleSettingsOpen dispatch={dispatch} panels={controlPanelState} />
      </DesignerPanelTop>
      <DesignerPanelContent panelName={"settings"}>
        <FarmBotSettings
          bot={this.props.bot}
          env={this.props.env}
          alerts={this.props.alerts}
          saveFarmwareEnv={this.props.saveFarmwareEnv}
          dispatch={this.props.dispatch}
          sourceFbosConfig={sourceFbosConfig}
          shouldDisplay={this.props.shouldDisplay}
          botOnline={botOnline}
          timeSettings={this.props.timeSettings}
          device={this.props.deviceAccount} />
        <Firmware
          bot={this.props.bot}
          alerts={this.props.alerts}
          dispatch={this.props.dispatch}
          sourceFbosConfig={sourceFbosConfig}
          shouldDisplay={this.props.shouldDisplay}
          botOnline={botOnline}
          timeSettings={this.props.timeSettings} />
        <PowerAndReset {...commonProps}
          sourceFbosConfig={sourceFbosConfig}
          botOnline={botOnline} />
        <AxisSettings {...commonProps}
          bot={this.props.bot}
          sourceFwConfig={sourceFwConfig}
          shouldDisplay={this.props.shouldDisplay}
          firmwareConfig={firmwareConfig}
          firmwareHardware={firmwareHardware}
          botOnline={botOnline} />
        <Motors {...commonProps}
          arduinoBusy={busy}
          sourceFwConfig={sourceFwConfig}
          firmwareHardware={firmwareHardware} />
        <EncodersOrStallDetection {...commonProps}
          arduinoBusy={busy}
          sourceFwConfig={sourceFwConfig}
          shouldDisplay={this.props.shouldDisplay}
          firmwareHardware={firmwareHardware} />
        <LimitSwitches {...commonProps}
          arduinoBusy={busy}
          sourceFwConfig={sourceFwConfig} />
        <ErrorHandling {...commonProps}
          arduinoBusy={busy}
          sourceFwConfig={sourceFwConfig} />
        <PinBindings  {...commonProps}
          resources={resources}
          firmwareHardware={firmwareHardware} />
        <PinGuard {...commonProps}
          arduinoBusy={busy}
          resources={resources}
          sourceFwConfig={sourceFwConfig} />
        <ParameterManagement {...commonProps}
          arduinoBusy={busy}
          sourceFwConfig={sourceFwConfig}
          firmwareConfig={firmwareConfig}
          firmwareHardware={firmwareHardware}
          onReset={MCUFactoryReset}
          botOnline={botOnline} />
        <Designer {...commonProps}
          getConfigValue={getConfigValue} />
        <OtherSettings {...commonProps}
          searchTerm={this.props.searchTerm}
          getConfigValue={getConfigValue}
          sourceFbosConfig={sourceFbosConfig} />
        {ExtraSettings(this.props.searchTerm)}
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}

export const DesignerSettings = connect(mapStateToProps)(RawDesignerSettings);
