import * as React from "react";
import { mount, shallow } from "enzyme";
import {
  CameraCalibrationConfig, BoolConfig, BoolConfigProps, NumberBoxConfig,
  NumberBoxConfigProps, DropdownConfig, DropdownConfigProps,
} from "../config";
import { CameraCalibrationConfigProps } from "../interfaces";

describe("<CameraCalibrationConfig />", () => {
  const fakeProps = (): CameraCalibrationConfigProps => ({
    values: {},
    onChange: jest.fn(),
    calibrationZ: undefined,
    calibrationImageCenter: { x: undefined, y: undefined },
  });

  it("renders", () => {
    const wrapper = mount(<CameraCalibrationConfig {...fakeProps()} />);
    ["Invert Hue Range Selection",
      "Calibration Object Separation",
      "Calibration Object Separation along axis",
      "Camera Offset X", "Camera Offset Y",
      "Origin Location in Image", "Bottom Left",
      "Pixel coordinate scale", "Camera rotation",
      "Camera not yet calibrated"]
      .map(string => expect(wrapper.text()).toContain(string));
  });

  it("renders z-height", () => {
    const p = fakeProps();
    p.calibrationZ = "1.1";
    const wrapper = mount(<CameraCalibrationConfig {...p} />);
    expect(wrapper.text().toLowerCase())
      .not.toContain("camera not yet calibrated");
    expect(wrapper.text().toLowerCase())
      .toContain("camera calibrated at z-axis height: 1.1");
  });
});

describe("<BoolConfig />", () => {
  const fakeProps = (): BoolConfigProps => ({
    configKey: "CAMERA_CALIBRATION_invert_hue_selection",
    label: "label",
    wdEnvGet: jest.fn(),
    onChange: jest.fn(),
    helpText: "help",
  });

  it("enables config", () => {
    const p = fakeProps();
    const wrapper = shallow(<BoolConfig {...p} />);
    wrapper.find("input").simulate("change", {
      currentTarget: { checked: true }
    });
    expect(p.onChange).toHaveBeenCalledWith(
      "CAMERA_CALIBRATION_invert_hue_selection", 1);
  });

  it("disables config", () => {
    const p = fakeProps();
    const wrapper = shallow(<BoolConfig {...p} />);
    wrapper.find("input").simulate("change", {
      currentTarget: { checked: false }
    });
    expect(p.onChange).toHaveBeenCalledWith(
      "CAMERA_CALIBRATION_invert_hue_selection", 0);
  });
});

describe("<NumberBoxConfig />", () => {
  const fakeProps = (): NumberBoxConfigProps => ({
    configKey: "CAMERA_CALIBRATION_blur",
    label: "label",
    wdEnvGet: jest.fn(),
    onChange: jest.fn(),
    helpText: "help",
  });

  it("changes config", () => {
    const p = fakeProps();
    const wrapper = shallow(<NumberBoxConfig {...p} />);
    wrapper.find("BlurableInput").simulate("commit", {
      currentTarget: { value: "1.23" }
    });
    expect(p.onChange).toHaveBeenCalledWith("CAMERA_CALIBRATION_blur", 1.23);
  });
});

describe("<DropdownConfig />", () => {
  const fakeProps = (): DropdownConfigProps => ({
    configKey: "CAMERA_CALIBRATION_calibration_along_axis",
    label: "label",
    wdEnvGet: jest.fn(),
    onChange: jest.fn(),
    helpText: "help",
    list: [],
  });

  it("changes config", () => {
    const p = fakeProps();
    const wrapper = shallow(<DropdownConfig {...p} />);
    wrapper.find("FBSelect").simulate("change", { label: "", value: 4 });
    expect(p.onChange).toHaveBeenCalledWith(
      "CAMERA_CALIBRATION_calibration_along_axis", 4);
  });

  it("handles errors", () => {
    const p = fakeProps();
    const wrapper = shallow(<DropdownConfig {...p} />);
    const badChange = () =>
      wrapper.find("FBSelect").simulate("change", { label: "", value: "4" });
    expect(badChange).toThrow("Weed detector got a non-numeric value");
  });
});
