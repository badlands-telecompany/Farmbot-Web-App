import * as React from "react";
import { Row, Col } from "../../../ui/index";
import { DeviceSetting, Content } from "../../../constants";
import { TimezoneRowProps } from "./interfaces";
import { t } from "../../../i18next_wrapper";
import { Highlight } from "../maybe_highlight";
import { edit, save } from "../../../api/crud";
import { timezoneMismatch } from "../../timezones/guess_timezone";
import { TimezoneSelector } from "../../timezones/timezone_selector";

export class TimezoneRow extends React.Component<TimezoneRowProps> {

  Note = () =>
    <div className="note">
      {timezoneMismatch(this.props.device.body.timezone)
        ? t(Content.DIFFERENT_TZ_WARNING) : ""}
    </div>;

  Selector = () =>
    <TimezoneSelector
      currentTimezone={this.props.device.body.timezone}
      onUpdate={timezone => {
        this.props.dispatch(edit(this.props.device, { timezone }));
        this.props.dispatch(save(this.props.device.uuid));
      }} />;

  render() {
    return <Highlight settingName={DeviceSetting.timezone}>
      <Row>
        <Col xs={12}>
          <label>
            {t(DeviceSetting.timezone)}
          </label>
        </Col>
      </Row>
      <Row>
        <Col xs={12}><this.Note /></Col>
        <Col xs={12} className="no-pad"><this.Selector /></Col>
      </Row>
    </Highlight>;
  }
}
